/**
 * SpatialWorld — Three.js + GSAP renderer for the WorldModel.
 *
 * Responsibilities:
 *  - Own the WebGL renderer, camera, OrbitControls, lights and the render loop.
 *  - Reconcile a WorldModel (stack frames / variables / heap objects / references) into
 *    keyed 3D nodes: new nodes grow in, persisting nodes lerp to their new layout slot,
 *    removed nodes shrink out and are disposed. No teleports between steps.
 *  - Draw curved Bezier arcs for references that follow their endpoints while they move.
 *  - Keep the canvas aspect correct under any container resize (ResizeObserver).
 *  - Render in either Velvet (light) or Velvet Night (dark) and swap live via setTheme().
 *  - Dispose every geometry / material / texture it creates (no WebGL leaks across traces).
 *
 * The renderer consumes plain data only; it knows nothing about Python or the trace format.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';

/** Scene palettes. Mirrors the CSS tokens in style.css so canvas and chrome feel like one surface. */
export const WORLD_THEMES = {
    light: {
        name: 'light',
        bg: 0xEFE8DD,
        fogDensity: 0.014,
        exposure: 1.0,
        hemiSky: 0xFFF6EC, hemiGround: 0xCDBCA6, hemiIntensity: 1.35,
        keyColor: 0xFFF1E2, keyIntensity: 2.1,
        rimA: 0xE6B48A, rimB: 0xD39AB0, rimIntensity: 14,
        gridCenter: 0xC6B3A0, gridLine: 0xDACCBB, gridOpacity: 0.7,
        dust: 0xB48646, dustOpacity: 0.22,
        shadowOpacity: 0.14,
        plate: 0xFFFBF6, plateOpacity: 0.94,
        frameEdge: 0xCDBBA7, frameEdgeActive: 0x7A2E4A,
        blend: THREE.NormalBlending,
        edge: 0x9A5068, pulse: 0xC2643C,
        emissive: 0.05, flash: 0.6,
        changed: 0xC2643C, danger: 0xB0262E,
        roughness: 0.42, clearcoat: 0.6,
        label: {
            fill: 'rgba(255, 252, 248, 0.96)', stroke: 'rgba(110, 80, 60, 0.18)', shadow: 'rgba(70, 40, 25, 0.16)',
            text: '#2A221F', sub: '#8E8178',
        },
        types: { number: 0x2F6CA3, str: 0x3B7651, bool: 0xB07419, none: 0x9C8F86, ref: 0x7A2E4A, other: 0x6A4A9A },
        objects: { list: 0x2F6CA3, tuple: 0x3B7651, dict: 0x6A4A9A, set: 0xB07419, other: 0x7A2E4A },
        idleA: 0x7A2E4A, idleB: 0xB48646,
    },
    dark: {
        name: 'dark',
        bg: 0x121014,
        fogDensity: 0.02,
        exposure: 1.05,
        hemiSky: 0xF6DCE6, hemiGround: 0x120E14, hemiIntensity: 0.75,
        keyColor: 0xFFE7D8, keyIntensity: 1.5,
        rimA: 0xE3A77C, rimB: 0xE08FAB, rimIntensity: 42,
        gridCenter: 0x4D3D48, gridLine: 0x2B242B, gridOpacity: 0.6,
        dust: 0xE3A77C, dustOpacity: 0.35,
        shadowOpacity: 0.38,
        plate: 0x1F1B22, plateOpacity: 0.9,
        frameEdge: 0x4A3E4E, frameEdgeActive: 0xE08FAB,
        blend: THREE.AdditiveBlending,
        edge: 0xD483A0, pulse: 0xFFE3EC,
        emissive: 0.2, flash: 1.3,
        changed: 0xE3A77C, danger: 0xF07A7A,
        roughness: 0.28, clearcoat: 1,
        label: {
            fill: 'rgba(28, 24, 31, 0.94)', stroke: 'rgba(255, 236, 224, 0.12)', shadow: 'rgba(0, 0, 0, 0.45)',
            text: '#F3EDE7', sub: '#8A7F78',
        },
        types: { number: 0x8CB8E4, str: 0x8FC9A1, bool: 0xE7B76A, none: 0x8A7F78, ref: 0xE08FAB, other: 0xBCA0E6 },
        objects: { list: 0x8CB8E4, tuple: 0x8FC9A1, dict: 0xBCA0E6, set: 0xE7B76A, other: 0xE08FAB },
        idleA: 0xE08FAB, idleB: 0xD8B37D,
    },
};

const TWEEN = { move: 0.34, grow: 0.4, shrink: 0.24, ease: 'power3.out' };

const VAR_SPACING = 2.2;
const VAR_COLS = 4;
const CELL = 0.92;
const STACK_RIGHT_EDGE = -1.4;
const HEAP_LEFT_EDGE = 1.8;
const FLOOR_Y = -0.62;
// Every tray (stack frame or heap object) is the same 0.12-high plate resting on the floor;
// blocks and cells sit directly on its top surface.
const TRAY_Y = -0.55;
const TRAY_TOP = TRAY_Y + 0.06;
const BLOCK_Y = TRAY_TOP + 0.55 - TRAY_Y;   // primitive block (1.1 tall), local to a var group at TRAY_Y
const SOCKET_Y = TRAY_TOP + 0.275 - TRAY_Y; // reference socket (0.55 tall)
const CELL_Y = 0.06 + 0.25;                  // heap cell (0.5 tall), local to its tray
const TABLE_CELL_SCALE_Y = 0.56;             // table cells are flatter tiles
const TABLE_CELL_Y = 0.06 + 0.25 * TABLE_CELL_SCALE_Y;
const TABLE_ROW_LABEL = 0.75;                // space for row labels on the left of a grid
const TABLE_HEADER = 0.95;                   // space for column headers at the back of a grid

const SEQUENCE_TYPES = new Set(['list', 'tuple', 'set', 'frozenset', 'deque', 'range', 'array']);

/** "items" for sequences, "entries" for mappings, "fields" for instances. */
function countNoun(type, n) {
    const t = String(type || '').toLowerCase();
    const word = SEQUENCE_TYPES.has(t) ? 'item' : (t === 'dict' ? 'entry' : 'field');
    if (n === 1) return word;
    return word === 'entry' ? 'entries' : `${word}s`;
}

function cssHex(n) {
    return `#${n.toString(16).padStart(6, '0')}`;
}

/** Recursively dispose geometries, materials and textures under an Object3D. */
export function disposeObject3D(root, sharedGeometries = new Set()) {
    if (!root) return;
    root.traverse(obj => {
        if (obj.geometry && !sharedGeometries.has(obj.geometry)) obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : (obj.material ? [obj.material] : []);
        for (const m of mats) {
            if (m.map) m.map.dispose();
            m.dispose();
        }
    });
    root.removeFromParent();
}

/**
 * Text label rendered to a CanvasTexture sprite (always faces the camera).
 * @param {Array<{text: string, mono?: boolean, color?: string, weight?: number, scale?: number}>} rows
 * @param {{size?: number, plate?: boolean, theme: object, accent?: string}} opts
 * @returns {THREE.Sprite}
 */
function makeLabel(rows, { size = 1, plate = true, theme, accent = null }) {
    const L = theme.label;
    const dpr = 2;
    const basePx = 28 * dpr;
    const padX = 18 * dpr;
    const padY = 11 * dpr;
    const gap = 4 * dpr;
    const shadowPad = plate ? 8 * dpr : 0;

    const specs = rows.map(r => {
        const px = basePx * (r.scale || 1);
        const family = r.mono ? '"JetBrains Mono", ui-monospace, monospace' : 'Inter, system-ui, sans-serif';
        return { ...r, px, font: `${r.weight || (r.mono ? 500 : 600)} ${px}px ${family}` };
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let width = 0;
    for (const s of specs) { ctx.font = s.font; width = Math.max(width, ctx.measureText(s.text).width); }
    const textH = specs.reduce((h, s) => h + s.px, 0) + gap * (specs.length - 1);
    canvas.width = Math.ceil(width + padX * 2 + shadowPad * 2);
    canvas.height = Math.ceil(textH + padY * 2 + shadowPad * 2);

    if (plate) {
        const x = shadowPad;
        const y = shadowPad * 0.6;
        const w = canvas.width - shadowPad * 2;
        const h = canvas.height - shadowPad * 2;
        ctx.save();
        ctx.shadowColor = L.shadow;
        ctx.shadowBlur = 10 * dpr;
        ctx.shadowOffsetY = 2 * dpr;
        ctx.fillStyle = L.fill;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10 * dpr);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = L.stroke;
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10 * dpr);
        ctx.stroke();
    }

    let y = shadowPad * (plate ? 0.6 : 1) + padY;
    ctx.textBaseline = 'top';
    for (const s of specs) {
        ctx.font = s.font;
        ctx.fillStyle = s.color || L.text;
        ctx.fillText(s.text, shadowPad + padX, y);
        y += s.px + gap;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    // Labels are UI, not geometry: draw them over the scene so orbiting never buries them inside a block.
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, toneMapped: false });
    const sprite = new THREE.Sprite(material);
    const worldH = 0.42 * size * (canvas.height / (basePx + padY * 2 + shadowPad * 2));
    sprite.scale.set(worldH * (canvas.width / canvas.height), worldH, 1);
    sprite.renderOrder = 10;
    return sprite;
}

function replaceLabel(holder, key, sprite) {
    const old = holder.userData[key];
    if (old) {
        sprite.position.copy(old.position);
        disposeObject3D(old);
    }
    holder.userData[key] = sprite;
    holder.add(sprite);
}

export class SpatialWorld {
    /**
     * @param {object} params
     * @param {HTMLCanvasElement} params.canvas
     * @param {HTMLElement} params.container - Element whose size drives the canvas size
     * @param {'light'|'dark'} [params.theme]
     * @param {(info: object|null) => void} [params.onSelect] - Called when a node is clicked
     * @param {(info: object|null, x: number, y: number) => void} [params.onHover]
     */
    constructor({ canvas, container, theme = 'light', onSelect = null, onHover = null }) {
        this.canvas = canvas;
        this.container = container;
        this.onSelect = onSelect;
        this.onHover = onHover;
        this.theme = WORLD_THEMES[theme] || WORLD_THEMES.light;

        this.nodes = new Map();   // id -> node record
        this.edges = new Map();   // id -> edge record
        this.pickables = [];
        this._hovered = null;
        this._hasContent = false;
        this._lastWorld = null;
        this._timer = new THREE.Timer();
        this._disposed = false;

        this._initRenderer();
        this._initScene();
        this._applyEnvironment();
        this._initInteraction();
        this._initResize();
        this.renderer.setAnimationLoop(() => this._tick());
    }

    // ── Setup ──────────────────────────────────────────────────────────────

    _initRenderer() {
        const { w, h } = this._size();
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(w, h, false);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;

        this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 400);
        this.camera.position.set(0, 11, 19);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        // Once the user orbits/zooms by hand, stop auto-framing until they press Fit or re-run.
        this._userMoved = false;
        this._fitted = null;
        this.controls.addEventListener('start', () => { this._userMoved = true; });
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 90;
        this.controls.maxPolarAngle = Math.PI * 0.48;
        this.controls.target.set(0, 0, -1.5);

        this.canvas.addEventListener('webglcontextlost', e => {
            e.preventDefault();
            this.renderer.setAnimationLoop(null);
            this.container.dispatchEvent(new CustomEvent('proviz:webgl-lost', { bubbles: true }));
        });
        this.canvas.addEventListener('webglcontextrestored', () => {
            this.renderer.setAnimationLoop(() => this._tick());
        });
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

        this._hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
        this.scene.add(this._hemi);

        this._key = new THREE.DirectionalLight(0xffffff, 1.5);
        this._key.position.set(7, 16, 11);
        this._key.castShadow = true;
        this._key.shadow.mapSize.set(2048, 2048);
        this._key.shadow.camera.left = -30;
        this._key.shadow.camera.right = 30;
        this._key.shadow.camera.top = 30;
        this._key.shadow.camera.bottom = -30;
        this._key.shadow.camera.near = 1;
        this._key.shadow.camera.far = 70;
        this._key.shadow.bias = -0.0006;
        this._key.shadow.radius = 5;
        this.scene.add(this._key);

        this._rimA = new THREE.PointLight(0xffffff, 1, 40, 2);
        this._rimA.position.set(-10, 6, 6);
        this.scene.add(this._rimA);
        this._rimB = new THREE.PointLight(0xffffff, 1, 40, 2);
        this._rimB.position.set(10, 6, -6);
        this.scene.add(this._rimB);

        // Soft contact shadows on an invisible floor
        this._ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.2 }));
        this._ground.rotation.x = -Math.PI / 2;
        this._ground.position.y = FLOOR_Y - 0.01;
        this._ground.receiveShadow = true;
        this.scene.add(this._ground);

        // Ambient dust particles
        const count = 420;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 80;
            pos[i * 3 + 1] = Math.random() * 22 - 1;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
        const dustGeo = new THREE.BufferGeometry();
        dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this._dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.06, transparent: true, depthWrite: false }));
        this.scene.add(this._dust);

        // Root for all trace-driven content
        this.root = new THREE.Group();
        this.scene.add(this.root);
        this.edgeRoot = new THREE.Group();
        this.scene.add(this.edgeRoot);

        // Shared geometries (disposed only in dispose())
        this.geo = {
            block: new RoundedBoxGeometry(1.1, 1.1, 1.1, 4, 0.16),
            socket: new RoundedBoxGeometry(0.9, 0.55, 0.9, 4, 0.14),
            cell: new RoundedBoxGeometry(CELL - 0.08, 0.5, CELL - 0.08, 3, 0.09),
            cone: new THREE.ConeGeometry(0.1, 0.28, 16),
            pulse: new THREE.SphereGeometry(0.08, 12, 12),
        };
        this._shared = new Set(Object.values(this.geo));
    }

    /** Apply the current theme to lights, fog, floor, particles and the idle scene. */
    _applyEnvironment() {
        const th = this.theme;
        this.renderer.setClearColor(th.bg, 1);
        this.renderer.toneMappingExposure = th.exposure;
        this.scene.fog.color.setHex(th.bg);
        this.scene.fog.density = th.fogDensity;
        this._hemi.color.setHex(th.hemiSky);
        this._hemi.groundColor.setHex(th.hemiGround);
        this._hemi.intensity = th.hemiIntensity;
        this._key.color.setHex(th.keyColor);
        this._key.intensity = th.keyIntensity;
        this._rimA.color.setHex(th.rimA);
        this._rimB.color.setHex(th.rimB);
        this._rimA.intensity = this._rimB.intensity = th.rimIntensity;
        this._ground.material.opacity = th.shadowOpacity;

        const dm = this._dust.material;
        dm.color.setHex(th.dust);
        dm.opacity = th.dustOpacity;
        dm.blending = th.blend;
        dm.needsUpdate = true;

        // GridHelper bakes colours into vertices, so rebuild it.
        if (this._grid) disposeObject3D(this._grid);
        this._grid = new THREE.GridHelper(120, 120, th.gridCenter, th.gridLine);
        this._grid.material.transparent = true;
        this._grid.material.opacity = th.gridOpacity;
        this._grid.position.y = FLOOR_Y;
        this.scene.add(this._grid);

        this._buildIdle();
    }

    _buildIdle() {
        const th = this.theme;
        const wasVisible = this.idle ? this.idle.visible : !this._hasContent;
        if (this.idle) disposeObject3D(this.idle);

        const idle = new THREE.Group();
        const core = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1.5, 1),
            new THREE.MeshStandardMaterial({ color: th.idleA, emissive: th.idleA, emissiveIntensity: th.name === 'dark' ? 0.5 : 0.1, wireframe: true, transparent: true, opacity: 0.7 })
        );
        core.position.y = 1.8;
        idle.add(core);
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(2.6 + i * 0.85, 0.018, 8, 128),
                new THREE.MeshBasicMaterial({ color: i % 2 ? th.idleB : th.idleA, transparent: true, opacity: 0.55, blending: th.blend, depthWrite: false })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 1.8;
            ring.userData.spin = (i % 2 ? -1 : 1) * (0.15 + i * 0.08);
            idle.add(ring);
        }
        const hint = makeLabel([{ text: 'Press F5 to build the world', weight: 500, color: th.label.sub }], { theme: th, size: 1.05 });
        hint.position.set(0, -0.05, 2.9);
        idle.add(hint);
        idle.userData.core = core;
        idle.visible = wasVisible;
        idle.scale.setScalar(wasVisible ? 1 : 0.001);
        this.idle = idle;
        this.scene.add(idle);
    }

    _setIdleVisible(visible) {
        if (!this.idle) return;
        gsap.killTweensOf(this.idle.scale);
        if (visible) {
            this.idle.visible = true;
            gsap.to(this.idle.scale, { x: 1, y: 1, z: 1, duration: TWEEN.grow, ease: 'back.out(1.6)' });
        } else {
            gsap.to(this.idle.scale, { x: 0.001, y: 0.001, z: 0.001, duration: TWEEN.shrink, ease: 'power2.in', onComplete: () => { if (this.idle) this.idle.visible = false; } });
        }
    }

    /**
     * Switch palette live. Content is rebuilt in place from the last world snapshot, keeping
     * camera and layout; every old material and label texture is disposed.
     * @param {'light'|'dark'} name
     */
    setTheme(name) {
        const next = WORLD_THEMES[name] || WORLD_THEMES.light;
        if (next === this.theme || this._disposed) return;
        this.theme = next;
        this._applyEnvironment();
        if (this._lastWorld) {
            this.clear({ keepIdleState: true });
            this.update(this._lastWorld, { instant: true });
        }
    }

    _initResize() {
        this._resizeObserver = new ResizeObserver(() => this.resize());
        this._resizeObserver.observe(this.container);
        this._onWindowResize = () => this.resize();
        window.addEventListener('resize', this._onWindowResize);
    }

    _size() {
        const w = Math.max(1, Math.floor(this.container.clientWidth));
        const h = Math.max(1, Math.floor(this.container.clientHeight));
        return { w, h };
    }

    /** Keep the drawing buffer and camera projection in lockstep with the container. */
    resize() {
        if (this._disposed) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w < 2 || h < 2) return; // hidden tab — keep last good aspect
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(Math.floor(w), Math.floor(h), false);
    }

    _initInteraction() {
        this._raycaster = new THREE.Raycaster();
        this._pointer = new THREE.Vector2();
        this._pointerDirty = false;
        this._pointerClient = { x: 0, y: 0 };
        this._downAt = null;

        this._onPointerMove = e => {
            const rect = this.canvas.getBoundingClientRect();
            this._pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
            this._pointerClient = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            this._pointerDirty = true;
        };
        this._onPointerLeave = () => this._setHovered(null);
        this._onPointerDown = e => { this._downAt = { x: e.clientX, y: e.clientY }; };
        this._onPointerUp = e => {
            if (!this._downAt) return;
            const moved = Math.hypot(e.clientX - this._downAt.x, e.clientY - this._downAt.y);
            this._downAt = null;
            if (moved > 4) return; // it was an orbit drag
            const info = this._hovered ? this._hovered.info : null;
            if (this.onSelect) this.onSelect(info);
            if (this._hovered) this.focusNode(this._hovered.id);
        };
        this.canvas.addEventListener('pointermove', this._onPointerMove);
        this.canvas.addEventListener('pointerleave', this._onPointerLeave);
        this.canvas.addEventListener('pointerdown', this._onPointerDown);
        this.canvas.addEventListener('pointerup', this._onPointerUp);
    }

    _pick() {
        if (!this._pointerDirty) return;
        this._pointerDirty = false;
        this._raycaster.setFromCamera(this._pointer, this.camera);
        const hit = this._raycaster.intersectObjects(this.pickables, false)[0];
        const node = hit ? this.nodes.get(hit.object.userData.nodeId) : null;
        this._setHovered(node || null);
    }

    _setHovered(node) {
        if (this._hovered === node) {
            if (node && this.onHover) this.onHover(node.info, this._pointerClient.x, this._pointerClient.y);
            return;
        }
        if (this._hovered?.mesh) {
            gsap.to(this._hovered.mesh.scale, { x: 1, y: 1, z: 1, duration: 0.18 });
        }
        this._hovered = node;
        this.canvas.style.cursor = node ? 'pointer' : '';
        if (node?.mesh) gsap.to(node.mesh.scale, { x: 1.07, y: 1.07, z: 1.07, duration: 0.18 });
        if (this.onHover) this.onHover(node ? node.info : null, this._pointerClient.x, this._pointerClient.y);
    }

    // ── Palette helpers ────────────────────────────────────────────────────

    _typeColor(type, kind) {
        const t = this.theme.types;
        if (kind === 'reference') return t.ref;
        switch (type) {
            case 'int':
            case 'float':
            case 'complex':
            case 'Decimal':
            case 'Fraction': return t.number;
            case 'str': return t.str;
            case 'bool': return t.bool;
            case 'NoneType': return t.none;
            default: return t.other;
        }
    }

    _objectColor(type) {
        const o = this.theme.objects;
        return o[type] ?? o.other;
    }

    _solidMaterial(color) {
        const th = this.theme;
        return new THREE.MeshPhysicalMaterial({
            color,
            emissive: color,
            emissiveIntensity: th.emissive,
            metalness: 0.08,
            roughness: th.roughness,
            clearcoat: th.clearcoat,
            clearcoatRoughness: 0.2,
            sheen: th.name === 'light' ? 0.4 : 0,
            sheenColor: new THREE.Color(0xffffff),
        });
    }

    // ── Reconciliation ─────────────────────────────────────────────────────

    /**
     * Reconcile the 3D world to a WorldModel snapshot.
     * @param {ReturnType<import('./WorldModel.js').buildWorldModel>} world
     * @param {{instant?: boolean, fit?: boolean}} [opts]
     */
    update(world, { instant = false, fit = false } = {}) {
        if (this._disposed) return;
        this._lastWorld = world;
        const live = new Set();
        const slots = this._layout(world);

        for (const f of world.frames) {
            live.add(f.id);
            this._upsertFrame(f, slots.get(f.id), instant);
            for (const v of f.vars) {
                live.add(v.id);
                this._upsertVar(v, slots.get(v.id), instant, Boolean(world.exception) && f.active);
            }
        }

        for (const o of world.objects) {
            live.add(o.id);
            this._upsertObject(o, slots.get(o.id), instant);
        }

        // Remove stale nodes (cells are owned by their object)
        for (const [id, node] of this.nodes) {
            if (node.kind === 'cell') continue;
            if (!live.has(id)) this._removeNode(id, instant);
        }

        const liveEdges = new Set();
        for (const e of world.edges) {
            liveEdges.add(e.id);
            this._upsertEdge(e);
        }
        for (const id of [...this.edges.keys()]) {
            if (!liveEdges.has(id)) this._removeEdge(id);
        }

        // Any live frame means a trace is loaded: retire the idle "press F5" scene even
        // before the first variable exists, so it never overlaps an empty scope plate.
        const hasContent = world.frames.length > 0 || world.objects.length > 0;
        if (hasContent !== this._hasContent) {
            this._hasContent = hasContent;
            this._setIdleVisible(!hasContent);
        }
        this._bounds = this._computeBounds(slots);
        if (fit) this.fitView(instant);
        else if (this._bounds && this._fitted && !this._userMoved && !this._fitted.containsBox(this._bounds)) {
            // The program grew past what is framed (new frames / objects): follow it smoothly.
            this.fitView(instant);
        }
    }

    _layout(world) {
        const slots = new Map();

        // Stack zone (left): active frame at the front, callers recede into depth.
        let zCursor = 1.2;
        const frames = [...world.frames].reverse();
        for (const f of frames) {
            const cols = Math.min(VAR_COLS, Math.max(1, f.vars.length));
            const rows = Math.max(1, Math.ceil(f.vars.length / VAR_COLS));
            const width = cols * VAR_SPACING + 0.8;
            const depth = rows * VAR_SPACING + 0.6;
            const x0 = STACK_RIGHT_EDGE - width;
            const zFront = zCursor;
            slots.set(f.id, { x: x0 + width / 2, y: TRAY_Y, z: zFront - depth / 2, width, depth });
            f.vars.forEach((v, i) => {
                const c = i % VAR_COLS;
                const r = Math.floor(i / VAR_COLS);
                slots.set(v.id, {
                    x: x0 + 0.4 + VAR_SPACING / 2 + c * VAR_SPACING,
                    y: TRAY_Y,
                    z: zFront - 0.3 - VAR_SPACING / 2 - r * VAR_SPACING,
                });
            });
            zCursor -= depth + 1.0;
        }

        // Heap zone (right): one row of cells per object (or a rows × columns grid for
        // tables), stacked in depth with the first object at the front.
        let hz = 0.6;
        for (const o of world.objects) {
            if (o.grid) {
                const cols = Math.max(1, o.grid.columns.length);
                const rows = Math.max(1, o.grid.rows.length);
                const width = TABLE_ROW_LABEL + cols * CELL + 0.5;
                const depth = TABLE_HEADER + rows * CELL + 0.5;
                // Keep the front edge where a one-row tray's would be; the grid grows backwards.
                slots.set(o.id, { x: HEAP_LEFT_EDGE + width / 2, y: TRAY_Y, z: hz + 0.625 - depth / 2, width, depth, grid: true });
                hz -= depth + 2.6;
                continue;
            }
            const n = Math.max(1, o.cells.length + (o.overflow > 0 ? 1 : 0));
            const width = n * CELL + 0.5;
            slots.set(o.id, { x: HEAP_LEFT_EDGE + width / 2, y: TRAY_Y, z: hz, width, n, depth: 1.25 });
            hz -= 3.8;
        }
        return slots;
    }

    _computeBounds(slots) {
        const box = new THREE.Box3();
        let any = false;
        for (const s of slots.values()) {
            const hw = (s.width || 1.4) / 2;
            const hd = (s.depth || 1.4) / 2;
            box.expandByPoint(new THREE.Vector3(s.x - hw, s.y - 0.6, s.z - hd));
            box.expandByPoint(new THREE.Vector3(s.x + hw, s.y + 2.2, s.z + hd));
            any = true;
        }
        return any ? box : null;
    }

    _moveTo(obj, slot, instant) {
        gsap.killTweensOf(obj.position);
        if (instant) obj.position.set(slot.x, slot.y, slot.z);
        else gsap.to(obj.position, { x: slot.x, y: slot.y, z: slot.z, duration: TWEEN.move, ease: TWEEN.ease });
    }

    _grow(obj, instant) {
        if (instant) { obj.scale.setScalar(1); return; }
        obj.scale.setScalar(0.001);
        gsap.to(obj.scale, { x: 1, y: 1, z: 1, duration: TWEEN.grow, ease: 'back.out(1.7)' });
    }

    _upsertFrame(f, slot, instant) {
        const th = this.theme;
        let node = this.nodes.get(f.id);
        if (!node) {
            const group = new THREE.Group();
            const plateMat = new THREE.MeshStandardMaterial({ color: th.plate, metalness: 0.05, roughness: 0.6, transparent: true, opacity: th.plateOpacity });
            const plate = new THREE.Mesh(new RoundedBoxGeometry(1, 0.12, 1, 2, 0.05), plateMat);
            plate.receiveShadow = true;
            group.add(plate);
            // No outline geometry: separate edge/lip meshes read as stray rails once the camera orbits.
            // The active frame is marked by a soft tint of the tray itself (plus its coloured caption).
            node = { id: f.id, kind: 'frame', group, plate, labelKey: null, info: { kind: 'frame', name: f.name } };
            this.nodes.set(f.id, node);
            this.root.add(group);
            if (slot) group.position.set(slot.x, slot.y, slot.z);
            this._grow(group, instant);
        }
        gsap.to(node.plate.scale, { x: slot.width, z: slot.depth, duration: instant ? 0 : TWEEN.move, ease: TWEEN.ease });
        node.plate.material.emissive.setHex(f.active ? th.frameEdgeActive : 0x000000);
        node.plate.material.emissiveIntensity = f.active ? (th.name === 'dark' ? 0.06 : 0.07) : 0;

        const labelKey = `${f.name}|${f.active}|${f.depth}`;
        if (node.labelKey !== labelKey) {
            node.labelKey = labelKey;
            const title = f.name === '<module>' ? 'Global scope' : `${f.name}()`;
            const accentHex = f.active ? th.frameEdgeActive : th.frameEdge;
            const label = makeLabel([{ text: title, mono: f.name !== '<module>', weight: 600, color: f.active ? cssHex(accentHex) : th.label.sub }], { theme: th, size: 1.05 });
            replaceLabel(node.group, 'label', label);
        }
        const lbl = node.group.userData.label;
        lbl.position.set(-slot.width / 2 + lbl.scale.x / 2 + 0.05, 0.38, slot.depth / 2 + 0.25);
        this._moveTo(node.group, slot, instant);
    }

    _upsertVar(v, slot, instant, inException) {
        const th = this.theme;
        let node = this.nodes.get(v.id);
        const color = inException && v.changed ? th.danger : this._typeColor(v.type, v.kind);
        if (node && node.varKind !== v.kind) {
            this._removeNode(v.id, true);
            node = null;
        }
        if (!node) {
            const group = new THREE.Group();
            // Blocks rest directly on the frame tray (no pedestal / halo ring), matching heap cells.
            const mesh = new THREE.Mesh(v.kind === 'reference' ? this.geo.socket : this.geo.block, this._solidMaterial(color));
            mesh.position.y = v.kind === 'reference' ? SOCKET_Y : BLOCK_Y;
            mesh.castShadow = true;
            mesh.userData.nodeId = v.id;
            group.add(mesh);
            node = { id: v.id, kind: 'var', varKind: v.kind, group, mesh, color, labelKey: null };
            this.nodes.set(v.id, node);
            this.pickables.push(mesh);
            this.root.add(group);
            if (slot) group.position.set(slot.x, slot.y, slot.z);
            this._grow(group, instant);
        }
        node.info = { kind: 'variable', name: v.name, type: v.type, value: v.fullDisplay, objectId: v.objectId };

        if (node.color !== color) {
            node.color = color;
            node.mesh.material.color.setHex(color);
            node.mesh.material.emissive.setHex(color);
        }

        const labelKey = `${v.name}=${v.display}|${color}`;
        if (node.labelKey !== labelKey) {
            node.labelKey = labelKey;
            const label = makeLabel([
                { text: v.name, weight: 600, scale: 0.82, color: th.label.sub },
                { text: v.display, mono: true, weight: 600, color: cssHex(color) },
            ], { theme: th, size: 1.22 });
            label.position.set(0, v.kind === 'reference' ? SOCKET_Y + 0.95 : BLOCK_Y + 1.35, 0);
            replaceLabel(node.group, 'label', label);
        }

        if (v.changed && !instant) this._flash(node, v.isNew);
        this._moveTo(node.group, slot, instant);
    }

    _flash(node, isNew) {
        const th = this.theme;
        const mat = node.mesh.material;
        gsap.killTweensOf(mat);
        mat.emissive.setHex(isNew ? node.color : th.changed);
        gsap.fromTo(mat, { emissiveIntensity: th.flash }, {
            emissiveIntensity: th.emissive, duration: 0.7, ease: 'power2.out',
            onComplete: () => mat.emissive.setHex(node.color),
        });
        const restY = node.varKind === 'reference' ? SOCKET_Y : BLOCK_Y;
        gsap.fromTo(node.mesh.position, { y: restY + 0.35 }, { y: restY, duration: 0.45, ease: 'bounce.out' });
    }

    _upsertObject(o, slot, instant) {
        const th = this.theme;
        let node = this.nodes.get(o.id);
        const color = this._objectColor(o.type);
        if (!node) {
            const group = new THREE.Group();
            const baseMat = new THREE.MeshStandardMaterial({ color: th.plate, metalness: 0.05, roughness: 0.55, transparent: true, opacity: th.plateOpacity });
            const base = new THREE.Mesh(new RoundedBoxGeometry(1, 0.12, 1.25, 2, 0.05), baseMat);
            base.receiveShadow = true;
            group.add(base);
            node = { id: o.id, kind: 'object', group, base, cells: new Map(), labelKey: null };
            this.nodes.set(o.id, node);
            this.root.add(group);
            if (slot) group.position.set(slot.x, slot.y, slot.z);
            this._grow(group, instant);
        }
        node.info = { kind: 'object', name: o.className, type: o.type, value: `${o.className} with ${o.cells.length + o.overflow} item(s)`, objectId: o.objectId };
        node.width = slot.width;

        const depth = slot.depth || 1.25;
        gsap.to(node.base.scale, { x: slot.width, z: depth / 1.25, duration: instant ? 0 : TWEEN.move, ease: TWEEN.ease });

        const caption = o.grid
            ? `${o.className}  ·  ${o.grid.totalRows} × ${o.grid.totalCols}`
            : `${o.className}  ·  ${o.cells.length + o.overflow} ${countNoun(o.type, o.cells.length + o.overflow)}`;
        const labelKey = `${caption}|${color}`;
        if (node.labelKey !== labelKey) {
            node.labelKey = labelKey;
            replaceLabel(node.group, 'label', makeLabel([
                { text: caption, mono: true, weight: 600, color: cssHex(color) },
            ], { theme: th, size: 0.95 }));
        }
        // Caption sits in front of the tray (like frame captions) so it never floats over the object behind.
        const lbl = node.group.userData.label;
        lbl.position.set(-slot.width / 2 + lbl.scale.x / 2, 0.25, depth / 2 + 0.42);

        if (o.grid) {
            this._upsertGrid(node, o, slot, color, instant);
            this._moveTo(node.group, slot, instant);
            return;
        }
        this._clearGridHeaders(node);

        const liveCells = new Set();
        const total = slot.n;
        o.cells.forEach((c, i) => {
            liveCells.add(c.id);
            const local = { x: -((total - 1) * CELL) / 2 + i * CELL, y: CELL_Y, z: 0 };
            let cell = node.cells.get(c.id);
            if (!cell) {
                const mesh = new THREE.Mesh(this.geo.cell, this._solidMaterial(color));
                mesh.castShadow = true;
                mesh.userData.nodeId = c.id;
                const g = new THREE.Group();
                g.add(mesh);
                g.position.set(local.x, local.y, local.z);
                node.group.add(g);
                cell = { id: c.id, kind: 'cell', group: g, mesh, parent: node, color, labelKey: null };
                node.cells.set(c.id, cell);
                this.nodes.set(c.id, cell);
                this.pickables.push(mesh);
                this._grow(g, instant);
            }
            cell.info = { kind: 'cell', name: `${o.className}[${c.label}]`, type: o.type, value: c.display, objectId: c.objectId };
            const labelKey = `${c.label}|${c.display}`;
            if (cell.labelKey !== labelKey) {
                const changed = cell.labelKey !== null;
                cell.labelKey = labelKey;
                const rows = [{ text: c.display, mono: true, weight: 600, color: th.label.text }];
                if (c.label !== '') rows.push({ text: c.label, mono: true, weight: 500, scale: 0.72, color: th.label.sub });
                const label = makeLabel(rows, { theme: th, size: 0.74, plate: false });
                label.position.set(0, 0.72, 0);
                replaceLabel(cell.group, 'label', label);
                if (changed && !instant) {
                    gsap.fromTo(cell.mesh.material, { emissiveIntensity: th.flash }, { emissiveIntensity: th.emissive, duration: 0.7 });
                }
            }
            this._moveTo(cell.group, local, instant);
        });

        if (o.overflow > 0) {
            const key = `+${o.overflow}`;
            if (node.overflowKey !== key) {
                node.overflowKey = key;
                replaceLabel(node.group, 'overflow', makeLabel([{ text: `+${o.overflow} more`, weight: 500, color: th.label.sub }], { theme: th, size: 0.55, plate: false }));
            }
            node.group.userData.overflow.position.set(-((total - 1) * CELL) / 2 + (total - 1) * CELL, CELL_Y, 0);
        } else if (node.group.userData.overflow) {
            disposeObject3D(node.group.userData.overflow);
            node.group.userData.overflow = null;
            node.overflowKey = null;
        }

        for (const cid of [...node.cells.keys()]) {
            if (!liveCells.has(cid)) this._removeCell(node, cid, instant);
        }
        this._moveTo(node.group, slot, instant);
    }

    /** Tables: cells laid out rows (back → front) × columns (left → right), with headers. */
    _upsertGrid(node, o, slot, color, instant) {
        const th = this.theme;
        const { columns, rows } = o.grid;
        const x0 = -slot.width / 2 + 0.25 + TABLE_ROW_LABEL + CELL / 2;
        const z0 = -slot.depth / 2 + 0.25 + TABLE_HEADER + CELL / 2;
        const live = new Set();

        rows.forEach((row, r) => {
            row.cells.forEach((c, ci) => {
                live.add(c.id);
                const local = { x: x0 + ci * CELL, y: TABLE_CELL_Y, z: z0 + r * CELL };
                // Each table cell is coloured by its own value type (number, text, bool, ref…).
                const cellColor = c.display === '' ? th.plate : this._typeColor(c.type, c.objectId ? 'reference' : 'primitive');
                let cell = node.cells.get(c.id);
                if (cell && cell.color !== cellColor) {
                    cell.color = cellColor;
                    cell.mesh.material.color.setHex(cellColor);
                    cell.mesh.material.emissive?.setHex(cellColor);
                }
                if (!cell) {
                    const mesh = new THREE.Mesh(this.geo.cell, this._solidMaterial(cellColor));
                    mesh.scale.y = TABLE_CELL_SCALE_Y;
                    mesh.castShadow = true;
                    mesh.userData.nodeId = c.id;
                    const g = new THREE.Group();
                    g.add(mesh);
                    g.position.set(local.x, local.y, local.z);
                    node.group.add(g);
                    cell = { id: c.id, kind: 'cell', group: g, mesh, parent: node, color: cellColor, labelKey: null };
                    node.cells.set(c.id, cell);
                    this.nodes.set(c.id, cell);
                    this.pickables.push(mesh);
                    this._grow(g, instant);
                }
                const colName = columns[ci] ?? String(ci);
                cell.info = { kind: 'cell', name: `${o.className}[${row.label}][${colName}]`, type: o.type, value: c.display, objectId: c.objectId };
                const labelKey = c.display;
                if (cell.labelKey !== labelKey) {
                    const changed = cell.labelKey !== null;
                    cell.labelKey = labelKey;
                    const label = makeLabel([{ text: c.display || ' ', mono: true, weight: 600, color: th.label.text }], { theme: th, size: 0.72, plate: false });
                    label.position.set(0, 0.3, 0.16);
                    replaceLabel(cell.group, 'label', label);
                    if (changed && !instant) {
                        gsap.fromTo(cell.mesh.material, { emissiveIntensity: th.flash }, { emissiveIntensity: th.emissive, duration: 0.7 });
                    }
                }
                this._moveTo(cell.group, local, instant);
            });
        });
        for (const cid of [...node.cells.keys()]) {
            if (!live.has(cid)) this._removeCell(node, cid, instant);
        }

        // Column headers along the back edge, row labels down the left edge.
        const hidden = [o.grid.hiddenRows ? `+${o.grid.hiddenRows} rows` : '', o.grid.hiddenCols ? `+${o.grid.hiddenCols} cols` : ''].filter(Boolean).join(' · ');
        const headerKey = `${columns.join('\u0001')}|${rows.map(r => r.label).join('\u0001')}|${hidden}|${slot.width}|${slot.depth}`;
        if (node.headerKey !== headerKey) {
            this._clearGridHeaders(node);
            node.headerKey = headerKey;
            const headers = new THREE.Group();
            columns.forEach((name, ci) => {
                const l = makeLabel([{ text: name, mono: true, weight: 600, color: cssHex(color) }], { theme: th, size: 0.6, plate: false });
                l.position.set(x0 + ci * CELL, 0.3, z0 - CELL * 1.05);
                headers.add(l);
            });
            rows.forEach((row, r) => {
                const l = makeLabel([{ text: row.label, mono: true, weight: 500, color: th.label.sub }], { theme: th, size: 0.56, plate: false });
                l.position.set(x0 - CELL * 0.95, 0.3, z0 + r * CELL);
                headers.add(l);
            });
            if (hidden) {
                const l = makeLabel([{ text: hidden, weight: 500, color: th.label.sub }], { theme: th, size: 0.55, plate: false });
                l.position.set(slot.width / 2 - l.scale.x / 2 - 0.2, 0.3, slot.depth / 2 - 0.1);
                headers.add(l);
            }
            node.group.add(headers);
            node.headers = headers;
        }
        if (node.group.userData.overflow) {
            disposeObject3D(node.group.userData.overflow);
            node.group.userData.overflow = null;
            node.overflowKey = null;
        }
    }

    _clearGridHeaders(node) {
        if (!node.headers) return;
        node.group.remove(node.headers);
        disposeObject3D(node.headers, this._shared);
        node.headers = null;
        node.headerKey = null;
    }

    _removeCell(objNode, cid, instant) {
        const cell = objNode.cells.get(cid);
        if (!cell) return;
        objNode.cells.delete(cid);
        this.nodes.delete(cid);
        this.pickables = this.pickables.filter(m => m !== cell.mesh);
        if (this._hovered === cell) this._setHovered(null);
        this._retire(cell.group, instant);
    }

    _removeNode(id, instant) {
        const node = this.nodes.get(id);
        if (!node) return;
        if (node.cells) {
            for (const cid of [...node.cells.keys()]) {
                const cell = node.cells.get(cid);
                this.nodes.delete(cid);
                this.pickables = this.pickables.filter(m => m !== cell.mesh);
                if (this._hovered === cell) this._setHovered(null);
            }
            node.cells.clear();
        }
        this.nodes.delete(id);
        if (node.mesh) this.pickables = this.pickables.filter(m => m !== node.mesh);
        if (this._hovered === node) this._setHovered(null);
        this._retire(node.group, instant);
    }

    _retire(obj, instant) {
        gsap.killTweensOf(obj.position);
        gsap.killTweensOf(obj.scale);
        if (instant) {
            disposeObject3D(obj, this._shared);
            return;
        }
        gsap.to(obj.scale, {
            x: 0.001, y: 0.001, z: 0.001, duration: TWEEN.shrink, ease: 'power2.in',
            onComplete: () => disposeObject3D(obj, this._shared),
        });
    }

    // ── Reference arcs ─────────────────────────────────────────────────────

    _anchor(nodeId, out) {
        const node = this.nodes.get(nodeId);
        if (!node) return null;
        if (node.kind === 'cell') {
            node.group.getWorldPosition(out);
            out.y += 0.3;
            return out;
        }
        if (node.kind === 'object') {
            node.group.getWorldPosition(out);
            out.x -= (node.width || 1) / 2;
            out.y += CELL_Y;
            return out;
        }
        node.mesh.getWorldPosition(out);
        out.y += node.varKind === 'reference' ? 0.3 : 0.6;
        return out;
    }

    _upsertEdge(e) {
        const th = this.theme;
        let edge = this.edges.get(e.id);
        if (!edge) {
            // Solid and depth-writing once faded in, so the floor grid never shows through an arc.
            const mat = new THREE.MeshBasicMaterial({ color: th.edge, transparent: true, opacity: 0, depthWrite: true });
            const tube = new THREE.Mesh(new THREE.BufferGeometry(), mat);
            const cone = new THREE.Mesh(this.geo.cone, mat);
            const pulseMat = new THREE.MeshBasicMaterial({ color: th.pulse, transparent: true, opacity: 0.95, blending: th.blend, depthWrite: false });
            const pulse = new THREE.Mesh(this.geo.pulse, pulseMat);
            const group = new THREE.Group();
            group.add(tube, cone, pulse);
            this.edgeRoot.add(group);
            edge = { id: e.id, group, tube, cone, pulse, from: e.from, to: e.to, a: new THREE.Vector3(Infinity), b: new THREE.Vector3(Infinity), curve: null, phase: Math.random() };
            this.edges.set(e.id, edge);
            gsap.to(mat, { opacity: 1, duration: TWEEN.grow, onComplete: () => { mat.transparent = false; mat.needsUpdate = true; } });
        }
        edge.from = e.from;
        edge.to = e.to;
        edge.active = e.active;
    }

    _removeEdge(id) {
        const edge = this.edges.get(id);
        if (!edge) return;
        this.edges.delete(id);
        edge.tube.material.transparent = true;
        edge.tube.material.needsUpdate = true;
        gsap.to(edge.tube.material, {
            opacity: 0, duration: TWEEN.shrink,
            onComplete: () => disposeObject3D(edge.group, this._shared),
        });
    }

    _updateEdges(time) {
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        for (const edge of this.edges.values()) {
            if (!this._anchor(edge.from, a) || !this._anchor(edge.to, b)) {
                edge.group.visible = false;
                continue;
            }
            edge.group.visible = true;
            if (a.distanceToSquared(edge.a) > 1e-5 || b.distanceToSquared(edge.b) > 1e-5) {
                edge.a.copy(a);
                edge.b.copy(b);
                const lift = 1.6 + a.distanceTo(b) * 0.18;
                const c1 = a.clone().add(new THREE.Vector3(0, lift, 0));
                const c2 = b.clone().add(new THREE.Vector3(-0.6, lift * 0.85, 0));
                edge.curve = new THREE.CubicBezierCurve3(a.clone(), c1, c2, b.clone());
                const geo = new THREE.TubeGeometry(edge.curve, 48, edge.active ? 0.045 : 0.03, 8, false);
                edge.tube.geometry.dispose();
                edge.tube.geometry = geo;

                const tip = edge.curve.getPoint(1);
                const tangent = edge.curve.getTangent(0.98).normalize();
                edge.cone.position.copy(tip).addScaledVector(tangent, -0.12);
                edge.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
            }
            if (edge.curve) {
                const t = (time * 0.45 + edge.phase) % 1;
                edge.pulse.position.copy(edge.curve.getPoint(t));
            }
        }
    }

    // ── Camera ─────────────────────────────────────────────────────────────

    /** Frame all content in view with a smooth camera glide. */
    fitView(instant = false) {
        const box = this._bounds;
        if (!box) return;
        // Remember a slightly generous frame so small growth doesn't re-trigger a glide every step.
        this._fitted = box.clone().expandByScalar(0.75);
        this._userMoved = false;
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const vFov = THREE.MathUtils.degToRad(this.camera.fov);
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
        const halfW = Math.max(size.x, 6) / 2;
        const halfD = Math.max(size.z, 4) / 2;
        const distW = halfW / Math.tan(hFov / 2);
        const distD = halfD / Math.tan(vFov / 2);
        const dist = Math.max(distW, distD * 0.9, 8) * 1.08 + halfD * 0.5;
        const dir = new THREE.Vector3(0, 0.62, 1).normalize();
        const pos = center.clone().addScaledVector(dir, dist);
        this._glide(pos, center, instant);
    }

    /** Smoothly orbit the camera target to a node. */
    focusNode(id) {
        const node = this.nodes.get(id);
        if (!node) return;
        const target = node.group.getWorldPosition(new THREE.Vector3());
        const offset = this.camera.position.clone().sub(this.controls.target);
        offset.setLength(Math.min(offset.length(), 14));
        this._glide(target.clone().add(offset), target, false);
    }

    _glide(pos, target, instant) {
        gsap.killTweensOf(this.camera.position);
        gsap.killTweensOf(this.controls.target);
        if (instant) {
            this.camera.position.copy(pos);
            this.controls.target.copy(target);
            return;
        }
        gsap.to(this.camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: 0.8, ease: 'power3.inOut' });
        gsap.to(this.controls.target, { x: target.x, y: target.y, z: target.z, duration: 0.8, ease: 'power3.inOut' });
    }

    // ── Loop & lifecycle ───────────────────────────────────────────────────

    _tick() {
        // Skip all GPU work while the visualizer tab is hidden.
        if (this.container.offsetParent === null) return;
        this._timer.update();
        const dt = this._timer.getDelta();
        const time = this._timer.getElapsed();
        this.controls.update();
        this._pick();
        this._updateEdges(time);
        this._dust.rotation.y += dt * 0.01;
        if (this.idle?.visible) {
            this.idle.userData.core.rotation.y += dt * 0.3;
            this.idle.userData.core.rotation.x += dt * 0.1;
            for (const c of this.idle.children) if (c.userData.spin) c.rotation.z += dt * c.userData.spin;
        }
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Remove and dispose all trace-driven content.
     * @param {{keepIdleState?: boolean}} [opts] - keepIdleState skips the idle-scene transition (used for theme swaps)
     */
    clear({ keepIdleState = false } = {}) {
        for (const edge of this.edges.values()) {
            gsap.killTweensOf(edge.tube.material);
            disposeObject3D(edge.group, this._shared);
        }
        this.edges.clear();
        for (const node of this.nodes.values()) {
            gsap.killTweensOf(node.group.position);
            gsap.killTweensOf(node.group.scale);
            if (node.mesh) gsap.killTweensOf(node.mesh.material);
        }
        for (const child of [...this.root.children]) disposeObject3D(child, this._shared);
        this.nodes.clear();
        this.pickables = [];
        this._hovered = null;
        this._bounds = null;
        this._fitted = null;
        if (keepIdleState) return;
        this._lastWorld = null;
        if (this._hasContent) {
            this._hasContent = false;
            this._setIdleVisible(true);
        }
    }

    /** Count of live GPU-backed nodes (diagnostics / leak checks). */
    stats() {
        return { nodes: this.nodes.size, edges: this.edges.size, ...this.renderer.info.memory };
    }

    dispose() {
        if (this._disposed) return;
        this.clear();
        this._disposed = true;
        this.renderer.setAnimationLoop(null);
        this._resizeObserver.disconnect();
        window.removeEventListener('resize', this._onWindowResize);
        this.canvas.removeEventListener('pointermove', this._onPointerMove);
        this.canvas.removeEventListener('pointerleave', this._onPointerLeave);
        this.canvas.removeEventListener('pointerdown', this._onPointerDown);
        this.canvas.removeEventListener('pointerup', this._onPointerUp);
        disposeObject3D(this.idle);
        disposeObject3D(this._dust);
        disposeObject3D(this._grid);
        disposeObject3D(this._ground);
        for (const g of this._shared) g.dispose();
        this.controls.dispose();
        this.renderer.dispose();
    }
}
