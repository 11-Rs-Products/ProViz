import * as THREE from 'three';
import { gsap } from 'gsap';

export class VisualizerAPI {
    constructor(scene, camera, group) {
        this.scene = scene;
        this.camera = camera;
        this.group = group;
        
        this.blocks = {}; // id -> { mesh, text, color }
        this.actionQueue = []; // array of actions
        this.isPlaying = false;
        
        // Colors
        this.colors = {
            DEFAULT: 0x334155, // slate-700
            RED: 0xef4444,
            GREEN: 0x10b981,
            YELLOW: 0xf59e0b,
            BLUE: 0x2563eb,
            PURPLE: 0x8b5cf6
        };
    }

    createBlockMesh(char, colorHex) {
        const size = 1.4;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Background - Sharper corners for pro look
        ctx.fillStyle = '#' + colorHex.toString(16).padStart(6, '0');
        ctx.beginPath();
        ctx.roundRect(8, 8, 240, 240, 16);
        ctx.fill();
        
        // Text
        ctx.fillStyle = '#ffffff';
        let fontSize = 120;
        ctx.font = `bold ${fontSize}px Inter, monospace`;
        
        let textWidth = ctx.measureText(char).width;
        while (textWidth > 210 && fontSize > 20) {
            fontSize -= 5;
            ctx.font = `bold ${fontSize}px Inter, monospace`;
            textWidth = ctx.measureText(char).width;
        }
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, 128, 138); 

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        
        const material = new THREE.MeshStandardMaterial({ 
            map: texture, 
            transparent: true,
            roughness: 0.1,
            metalness: 0.2
        });
        
        const plainMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, metalness: 0.5, transparent: true });
        const materials = [plainMat, plainMat, plainMat, plainMat, material, plainMat];
        
        const geometry = new THREE.BoxGeometry(size, size, size * 0.15);
        const mesh = new THREE.Mesh(geometry, materials);
        
        const edges = new THREE.EdgesGeometry(geometry);
        const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 }));
        mesh.add(edgeLines);
        
        return mesh;
    }

    // --- Action Queue Builders ---
    
    // Call these methods to queue actions
    spawn(id, value, colorKey = 'DEFAULT', x = 0, y = 0, z = 0, delay = 0) {
        this.actionQueue.push({ type: 'SPAWN', id, value, colorKey, x, y, z, delay });
    }

    remove(id, delay = 0) {
        this.actionQueue.push({ type: 'REMOVE', id, delay });
    }

    update(id, newValue, colorKey = null, delay = 0) {
        this.actionQueue.push({ type: 'UPDATE', id, newValue, colorKey, delay });
    }

    move(id, targetX, targetY, targetZ, delay = 0) {
        this.actionQueue.push({ type: 'MOVE', id, x: targetX, y: targetY, z: targetZ, delay });
    }
    
    highlight(id, colorKey, delay = 0) {
        this.actionQueue.push({ type: 'HIGHLIGHT', id, colorKey, delay });
    }

    clearAll() {
        this.blocks = {};
        while(this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
        this.actionQueue = [];
    }

    // --- Execution ---

    async play(onComplete = () => {}) {
        this.isPlaying = true;
        for (let i = 0; i < this.actionQueue.length; i++) {
            if (!this.isPlaying) break; // If stopped
            await this.playAction(this.actionQueue[i]);
        }
        this.isPlaying = false;
        onComplete();
    }

    stop() {
        this.isPlaying = false;
    }

    playAction(action) {
        return new Promise((resolve) => {
            let delay = action.delay || 0;
            const duration = 0.8;
            
            if (action.type === 'SPAWN') {
                const colorHex = this.colors[action.colorKey] || this.colors.DEFAULT;
                const mesh = this.createBlockMesh(String(action.value), colorHex);
                mesh.position.set(action.x, action.y, action.z);
                mesh.scale.set(0, 0, 0); // start small
                
                this.group.add(mesh);
                this.blocks[action.id] = { mesh, value: action.value, colorKey: action.colorKey };
                
                gsap.to(mesh.scale, {
                    x: 1, y: 1, z: 1,
                    duration,
                    delay,
                    ease: "back.out",
                    onComplete: resolve
                });
            }
            else if (action.type === 'REMOVE') {
                const block = this.blocks[action.id];
                if (block) {
                    const mesh = block.mesh;
                    // Blur/fade effect
                    mesh.material.forEach(m => {
                        gsap.to(m, { opacity: 0, duration, delay });
                    });
                    
                    gsap.to(mesh.scale, {
                        x: 0, y: 0, z: 0,
                        duration,
                        delay,
                        ease: "power2.in",
                        onComplete: () => {
                            this.group.remove(mesh);
                            delete this.blocks[action.id];
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            }
            else if (action.type === 'UPDATE') {
                const block = this.blocks[action.id];
                if (block) {
                    const colorHex = action.colorKey ? (this.colors[action.colorKey] || this.colors.DEFAULT) : (this.colors[block.colorKey]);
                    const newMesh = this.createBlockMesh(String(action.newValue), colorHex);
                    
                    newMesh.position.copy(block.mesh.position);
                    newMesh.scale.set(0, 0, 0);
                    
                    this.group.add(newMesh);
                    
                    // Pop old one out, pop new one in
                    gsap.to(block.mesh.scale, {
                        x: 0, y: 0, z: 0,
                        duration: duration / 2,
                        delay,
                        ease: "power2.in",
                        onComplete: () => {
                            this.group.remove(block.mesh);
                            block.mesh = newMesh;
                            block.value = action.newValue;
                            if (action.colorKey) block.colorKey = action.colorKey;
                            
                            gsap.to(newMesh.scale, {
                                x: 1, y: 1, z: 1,
                                duration: duration / 2,
                                ease: "back.out",
                                onComplete: resolve
                            });
                        }
                    });
                } else {
                    resolve();
                }
            }
            else if (action.type === 'MOVE') {
                const block = this.blocks[action.id];
                if (block) {
                    gsap.to(block.mesh.position, {
                        x: action.x,
                        y: action.y,
                        z: action.z,
                        duration,
                        delay,
                        ease: "power2.inOut",
                        onComplete: resolve
                    });
                } else {
                    resolve();
                }
            }
            else if (action.type === 'HIGHLIGHT') {
                const block = this.blocks[action.id];
                if (block) {
                    const colorHex = this.colors[action.colorKey] || this.colors.DEFAULT;
                    // For highlighting, we might just recreate the block to change its color cleanly
                    // Or change materials
                    
                    const newMesh = this.createBlockMesh(String(block.value), colorHex);
                    newMesh.position.copy(block.mesh.position);
                    this.group.add(newMesh);
                    
                    // small jump animation
                    gsap.to(newMesh.position, {
                        y: block.mesh.position.y + 0.5,
                        duration: duration / 2,
                        delay,
                        yoyo: true,
                        repeat: 1,
                        ease: "power2.out"
                    });
                    
                    this.group.remove(block.mesh);
                    block.mesh = newMesh;
                    block.colorKey = action.colorKey;
                    
                    // Wait for jump to finish
                    setTimeout(resolve, (delay + duration) * 1000);
                } else {
                    resolve();
                }
            } else {
                resolve(); // unknown action
            }
        });
    }
}
