import * as THREE from 'three';
import { gsap } from 'gsap';

export function initLandingPage(onLaunchApp) {
    // --- 1. Three.js Hero 3D Background & Interactive Objects ---
    initHeroScene();

    // --- 2. Interactive Code Demo Sandbox ---
    initInteractiveSandbox();

    // --- 3. FAQ Accordion ---
    initFAQAccordion();

    // --- 4. Smooth Navigation & Header Sticky effect ---
    initNavigation();

    // --- 5. App Launch Buttons & Auth Modals ---
    initAppLaunchTriggers(onLaunchApp);
}

function initHeroScene() {
    const canvas = document.querySelector('#hero-canvas');
    if (!canvas) return;

    const container = canvas.parentElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x38bdf8, 3, 50); // Cyan light
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 3, 50); // Purple light
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Group for main hero objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Central Floating Wireframe Icosahedron & TorusKnot
    const icoGeo = new THREE.IcosahedronGeometry(4.5, 2);
    const icoMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
        roughness: 0.2,
        metalness: 0.8
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    mainGroup.add(icoMesh);

    // Inner Glowing Core
    const innerGeo = new THREE.TorusKnotGeometry(2, 0.6, 120, 16);
    const innerMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.1,
        metalness: 0.9,
        wireframe: false
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    mainGroup.add(innerMesh);

    // Floating 3D Cubes/Nodes (Simulating 3D Array Blocks)
    const blocksGroup = new THREE.Group();
    mainGroup.add(blocksGroup);

    const blockCount = 8;
    const blockMeshes = [];
    for (let i = 0; i < blockCount; i++) {
        const size = 0.9;
        const boxGeo = new THREE.BoxGeometry(size, size, size);
        const boxMat = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0x6366f1 : 0x10b981,
            metalness: 0.6,
            roughness: 0.2
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);

        const angle = (i / blockCount) * Math.PI * 2;
        const radius = 7.5;
        boxMesh.position.set(
            Math.cos(angle) * radius,
            Math.sin(angle * 2) * 2,
            Math.sin(angle) * radius
        );
        blocksGroup.add(boxMesh);
        blockMeshes.push({ mesh: boxMesh, angle, radius, speed: 0.008 + i * 0.002 });
    }

    // Particle Background Field
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 60;
        positions[i + 1] = (Math.random() - 0.5) * 40;
        positions[i + 2] = (Math.random() - 0.5) * 40;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.15,
        transparent: true,
        opacity: 0.6
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Mouse Parallax Effect
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.001;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.001;
    });

    // Resize Handler
    window.addEventListener('resize', () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || 500;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Smooth rotation
        icoMesh.rotation.x += 0.003;
        icoMesh.rotation.y += 0.005;

        innerMesh.rotation.x -= 0.006;
        innerMesh.rotation.y += 0.008;

        // Animate satellite blocks
        blockMeshes.forEach(b => {
            b.angle += b.speed;
            b.mesh.position.x = Math.cos(b.angle) * b.radius;
            b.mesh.position.z = Math.sin(b.angle) * b.radius;
            b.mesh.position.y = Math.sin(b.angle * 2) * 2;
            b.mesh.rotation.x += 0.01;
            b.mesh.rotation.y += 0.01;
        });

        // Parallax easing
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        mainGroup.rotation.y = targetX;
        mainGroup.rotation.x = targetY;

        particleSystem.rotation.y += 0.0005;

        renderer.render(scene, camera);
    }
    animate();
}

function initInteractiveSandbox() {
    const sandboxCanvas = document.querySelector('#sandbox-canvas');
    const codeDisplay = document.querySelector('#sandbox-code-preview');
    const tabBtns = document.querySelectorAll('.sandbox-tab-btn');

    if (!sandboxCanvas || !codeDisplay) return;

    // Sandbox 3D Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');

    const camera = new THREE.PerspectiveCamera(45, sandboxCanvas.clientWidth / sandboxCanvas.clientHeight, 0.1, 100);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas: sandboxCanvas, antialias: true });
    renderer.setSize(sandboxCanvas.clientWidth, sandboxCanvas.clientHeight);

    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(5, 10, 7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    // Axis Grid Helper
    const grid = new THREE.GridHelper(10, 10, 0x3b82f6, 0x1e293b);
    grid.position.y = -1.5;
    scene.add(grid);

    const group = new THREE.Group();
    scene.add(group);

    // Sandbox presets data
    const presets = {
        array: {
            code: `# Python 3D Array Mutation
import visualizer

# Spawn initial array: [10, 20, 30, 40]
visualizer.spawn_array([10, 20, 30, 40], color="CYAN")

# Highlight max element & update value
visualizer.highlight(index=3, color="EMERALD")
visualizer.update_value(index=3, new_value=99)`,
            render: () => {
                clearGroup(group);
                const values = [10, 20, 30, 99];
                const colors = [0x06b6d4, 0x06b6d4, 0x06b6d4, 0x10b981];
                values.forEach((val, i) => {
                    const box = createLabeledBlock(String(val), colors[i]);
                    box.position.set(-3 + i * 2, 0, 0);
                    group.add(box);

                    gsap.from(box.scale, { x: 0, y: 0, z: 0, duration: 0.6, delay: i * 0.15, ease: "back.out(1.7)" });
                });
            }
        },
        vector: {
            code: `# Python 3D Vector Addition
import visualizer

v1 = visualizer.Vector3D(3, 4, 0, color="BLUE")
v2 = visualizer.Vector3D(1, -2, 3, color="PURPLE")

# Resultant Vector
result = v1 + v2
visualizer.plot_resultant(result, color="GOLD")`,
            render: () => {
                clearGroup(group);
                const arrow1 = new THREE.ArrowHelper(new THREE.Vector3(3, 2, 0).normalize(), new THREE.Vector3(0, -1.5, 0), 4, 0x3b82f6, 0.8, 0.5);
                const arrow2 = new THREE.ArrowHelper(new THREE.Vector3(1, -1, 2).normalize(), new THREE.Vector3(3, 0.5, 0), 3, 0xa855f7, 0.8, 0.5);
                const resultArrow = new THREE.ArrowHelper(new THREE.Vector3(4, 1, 2).normalize(), new THREE.Vector3(0, -1.5, 0), 5.5, 0xf59e0b, 1, 0.6);

                group.add(arrow1);
                group.add(arrow2);
                group.add(resultArrow);

                gsap.from(group.rotation, { y: Math.PI * 2, duration: 1.2, ease: "power2.out" });
            }
        },
        matrix: {
            code: `# 3D Matrix Transformation
import numpy as np
import visualizer

# Define 2x2 Transformation Matrix
T = np.array([[2, 0], [0, 1.5]])
mesh = visualizer.create_grid(rows=3, cols=3)

# Apply Linear Map in 3D Space
visualizer.apply_transform(mesh, matrix=T)`,
            render: () => {
                clearGroup(group);
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        const s = createLabeledBlock(`${r},${c}`, 0x8b5cf6);
                        s.position.set(-2 + c * 2.2, -1 + r * 1.5, 0);
                        group.add(s);
                    }
                }
                gsap.to(group.rotation, { y: Math.PI * 0.5, duration: 1, ease: "power2.inOut" });
            }
        }
    };

    function clearGroup(g) {
        while (g.children.length > 0) g.remove(g.children[0]);
    }

    function createLabeledBlock(textStr, colorHex) {
        const size = 1.3;
        const cvs = document.createElement('canvas');
        cvs.width = 128;
        cvs.height = 128;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = '#' + colorHex.toString(16).padStart(6, '0');
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textStr, 64, 64);

        const tex = new THREE.CanvasTexture(cvs);
        const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.2, metalness: 0.3 });
        const plainMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
        return new THREE.Mesh(new THREE.BoxGeometry(size, size, size * 0.2), [plainMat, plainMat, plainMat, plainMat, mat, plainMat]);
    }

    // Default tab
    presets.array.render();
    codeDisplay.textContent = presets.array.code;

    // Tab buttons event
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const key = btn.dataset.preset;
            if (presets[key]) {
                codeDisplay.textContent = presets[key].code;
                presets[key].render();
            }
        });
    });

    // Resize handler
    window.addEventListener('resize', () => {
        if (!sandboxCanvas) return;
        camera.aspect = sandboxCanvas.clientWidth / sandboxCanvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(sandboxCanvas.clientWidth, sandboxCanvas.clientHeight);
    });

    // Animation Loop
    function renderSandbox() {
        requestAnimationFrame(renderSandbox);
        group.rotation.y += 0.003;
        renderer.render(scene, camera);
    }
    renderSandbox();
}

function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionHeader = item.querySelector('.faq-question');
        questionHeader?.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            faqItems.forEach(i => i.classList.remove('active'));
            if (!isOpen) {
                item.classList.add('active');
            }
        });
    });
}

function initNavigation() {
    const navbar = document.querySelector('#landing-navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    });

    // Nav smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

function initAppLaunchTriggers(onLaunchApp) {
    const launchBtns = document.querySelectorAll('.btn-launch-app');
    const homeBtns = document.querySelectorAll('.btn-back-home');
    const landingSection = document.querySelector('#landing-page');
    const appLayout = document.querySelector('#layout-container');
    const loginOverlay = document.querySelector('#login-overlay');

    launchBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (onLaunchApp) {
                onLaunchApp();
            } else {
                if (landingSection) landingSection.style.display = 'none';
                if (loginOverlay) loginOverlay.style.display = 'flex';
            }
        });
    });

    homeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (appLayout) appLayout.style.display = 'none';
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (landingSection) landingSection.style.display = 'block';
        });
    });
}
