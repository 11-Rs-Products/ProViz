/**
 * BaseVisualizer — Three.js block rendering engine.
 *
 * Provides the primitive operations used by all concrete visualizers:
 *  - spawn(id, label, colorKey, x, y, z)
 *  - update(id, newLabel, colorKey)
 *  - remove(id)
 *  - move(id, x, y, z)
 *  - highlight(id, colorKey)
 *  - clearAll()
 *
 * All operations are synchronous — they return a Promise so the caller
 * can await animations to complete before advancing to the next frame.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';

export const COLORS = {
    DEFAULT:  0x334155,  // slate-700
    BLUE:     0x2563eb,
    GREEN:    0x10b981,
    RED:      0xef4444,
    YELLOW:   0xf59e0b,
    PURPLE:   0x8b5cf6,
    ORANGE:   0xf97316,
    TEAL:     0x0d9488,
    PINK:     0xec4899,
    CYAN:     0x06b6d4,
    WHITE:    0xe2e8f0,
};

const BLOCK_SIZE = 1.25;
const ANIM_DURATION = 0.45;

export class BaseVisualizer {
    constructor(scene, group) {
        this.scene = scene;
        this.group = group;
        this.blocks = {};  // id -> { mesh, label, colorKey }
    }

    /** Resolve a color key (string) to a THREE hex color. */
    _color(key) {
        return COLORS[key] || COLORS.DEFAULT;
    }

    /** Create a sleek, smooth 3D Rounded Cuboid / Cube mesh. */
    _createMesh(label, colorHex) {
        const text = String(label);
        const isLong = text.length > 5;
        
        // Sleek proportions (no bulk, balanced depth)
        const width  = isLong ? 2.3 : BLOCK_SIZE;
        const height = BLOCK_SIZE;
        const depth  = 0.65; // Slim, elegant 3D depth

        // High-resolution canvas texture for face
        const canvas = document.createElement('canvas');
        canvas.width = isLong ? 512 : 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Main face background with rounded rect
        ctx.fillStyle = '#' + colorHex.toString(16).padStart(6, '0');
        ctx.beginPath();
        ctx.roundRect(8, 8, canvas.width - 16, 240, 24);
        ctx.fill();

        // Subtle gradient highlight
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(8, 8, canvas.width - 16, 240, 24);
        ctx.fill();

        // Soft face border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Crisp typography
        ctx.fillStyle = '#ffffff';
        let fontSize = 92;
        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        const maxTextWidth = canvas.width - 36;
        while (ctx.measureText(text).width > maxTextWidth && fontSize > 16) {
            fontSize -= 4;
            ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, 132);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;

        // Premium Materials with Specular Highlights
        const frontMat = new THREE.MeshStandardMaterial({ 
            map: texture, 
            roughness: 0.2, 
            metalness: 0.15 
        });
        const sideMat = new THREE.MeshStandardMaterial({ 
            color: colorHex, 
            roughness: 0.25, 
            metalness: 0.2 
        });

        // 6 faces: Right (+X), Left (-X), Top (+Y), Bottom (-Y), Front (+Z), Back (-Z)
        const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];

        // Smooth Rounded Geometry!
        const geo = new RoundedBoxGeometry(width, height, depth, 4, 0.12);
        const mesh = new THREE.Mesh(geo, materials);

        // Soft, subtle wireframe edge outline
        const edges = new THREE.EdgesGeometry(geo);
        mesh.add(new THREE.LineSegments(
            edges, 
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
        ));

        // Elegant subtle 3D tilt
        mesh.rotation.y = 0.18;
        mesh.rotation.x = 0.08;

        return mesh;
    }

    /** Spawn a new block at a 3D position. Returns a Promise. */
    spawn(id, label, colorKey = 'DEFAULT', x = 0, y = 0, z = 0) {
        return new Promise(resolve => {
            if (this.blocks[id]) { this.update(id, label, colorKey).then(resolve); return; }

            const mesh = this._createMesh(label, this._color(colorKey));
            mesh.position.set(x, y, z);
            mesh.scale.set(0, 0, 0);
            this.group.add(mesh);
            this.blocks[id] = { mesh, label, colorKey };

            gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: ANIM_DURATION, ease: 'back.out(1.6)', onComplete: resolve });
        });
    }

    /** Update an existing block's label and/or color. Returns a Promise. */
    update(id, newLabel, colorKey = null) {
        return new Promise(resolve => {
            const block = this.blocks[id];
            if (!block) { resolve(); return; }

            const resolvedColor = colorKey || block.colorKey;
            const newMesh = this._createMesh(newLabel, this._color(resolvedColor));
            newMesh.position.copy(block.mesh.position);
            newMesh.scale.set(0, 0, 0);
            this.group.add(newMesh);

            gsap.to(block.mesh.scale, {
                x: 0, y: 0, z: 0,
                duration: ANIM_DURATION / 2,
                ease: 'power2.in',
                onComplete: () => {
                    this.group.remove(block.mesh);
                    block.mesh    = newMesh;
                    block.label   = newLabel;
                    block.colorKey = resolvedColor;
                    gsap.to(newMesh.scale, { x: 1, y: 1, z: 1, duration: ANIM_DURATION / 2, ease: 'back.out', onComplete: resolve });
                },
            });
        });
    }

    /** Remove a block with a shrink animation. Returns a Promise. */
    remove(id) {
        return new Promise(resolve => {
            const block = this.blocks[id];
            if (!block) { resolve(); return; }
            gsap.to(block.mesh.scale, {
                x: 0, y: 0, z: 0,
                duration: ANIM_DURATION,
                ease: 'power2.in',
                onComplete: () => {
                    this.group.remove(block.mesh);
                    delete this.blocks[id];
                    resolve();
                },
            });
        });
    }

    /** Move a block to a new 3D position. Returns a Promise. */
    move(id, x, y, z) {
        return new Promise(resolve => {
            const block = this.blocks[id];
            if (!block) { resolve(); return; }
            gsap.to(block.mesh.position, { x, y, z, duration: ANIM_DURATION, ease: 'power2.inOut', onComplete: resolve });
        });
    }

    /** Flash highlight a block with a bounce. Returns a Promise. */
    highlight(id, colorKey) {
        return new Promise(resolve => {
            const block = this.blocks[id];
            if (!block) { resolve(); return; }
            const newMesh = this._createMesh(block.label, this._color(colorKey));
            newMesh.position.copy(block.mesh.position);
            this.group.add(newMesh);
            this.group.remove(block.mesh);
            block.mesh    = newMesh;
            block.colorKey = colorKey;

            gsap.to(newMesh.position, {
                y: newMesh.position.y + 0.4,
                duration: ANIM_DURATION / 2,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out',
                onComplete: resolve,
            });
        });
    }

    /** Remove all blocks instantly. */
    clearAll() {
        for (const id of Object.keys(this.blocks)) {
            this.group.remove(this.blocks[id].mesh);
        }
        this.blocks = {};
    }

    /** Get position of an existing block. */
    getPosition(id) {
        const block = this.blocks[id];
        if (!block) return null;
        return block.mesh.position.clone();
    }
}
