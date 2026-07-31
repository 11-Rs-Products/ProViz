import * as THREE from 'three';
import { gsap } from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Scene Setup ---
const canvas = document.querySelector('#app-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0f172a'); // Slate 900

const canvasContainer = document.getElementById('canvas-container');
const width = canvasContainer.clientWidth;
const height = canvasContainer.clientHeight;

const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
camera.position.set(0, 0, 16); // Move camera closer since canvas is narrower

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false; // keep framing consistent

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// --- State and UI Elements ---
let currentStep = 0;
let steps = [];
let blockObjects = [];
const group = new THREE.Group();
scene.add(group);

const uiTitle = document.getElementById('step-title');
const uiDesc = document.getElementById('step-desc');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');
const implementBtn = document.getElementById('btn-implement');
const btnModeEq = document.getElementById('btn-mode-eq');
const btnModeDiv = document.getElementById('btn-mode-div');
const btnModePoly = document.getElementById('btn-mode-poly');
const btnModeTodo = document.getElementById('btn-mode-todo');
const btnModeBarchart = document.getElementById('btn-mode-barchart');
const inputGroupEq = document.getElementById('input-group-eq');
const inputGroupDiv = document.getElementById('input-group-div');
const inputGroupPoly = document.getElementById('input-group-poly');
const inputGroupTodo = document.getElementById('input-group-todo');
const inputGroupBarchart = document.getElementById('input-group-barchart');
const eqInput = document.getElementById('eq-input');
const generateBtnEq = document.getElementById('btn-generate-eq');
const generateBtnDiv = document.getElementById('btn-generate-div');
const generateBtnPoly = document.getElementById('btn-generate-poly');
const generateBtnTodo = document.getElementById('btn-generate-todo');
const generateBtnBarchart = document.getElementById('btn-generate-barchart');
const nInput = document.getElementById('n-input');
const kInput = document.getElementById('k-input');
const polyInput = document.getElementById('poly-input');
const xInput = document.getElementById('x-input');
const todoIndices = document.getElementById('todo-indices');
const todoItems = document.getElementById('todo-items');
const barchartData = document.getElementById('barchart-data');
const errorMsg = document.getElementById('error-msg');
const stepCode = document.getElementById('step-code');
const codeContainer = document.getElementById('code-container');
const btnFullscreen = document.getElementById('btn-fullscreen');

let isStepImplemented = false;
let currentMode = 'eq'; // 'eq' or 'div'

// Colors - Sleek palette
const COLOR_DEF = 0x334155; // slate-700
const COLOR_X = 0xef4444; // red-500
const COLOR_A = 0x10b981; // emerald-500
const COLOR_B = 0xf59e0b; // amber-500
const COLOR_OP = 0x6366f1; // indigo-500

// Parse equation
function parseEquation(str) {
    // clean input to avoid extreme errors
    str = str.toLowerCase().trim();
    if (!str.includes('=') || !str.includes('x')) {
        throw new Error("Equation must contain 'x' and '='");
    }

    const eqParts = str.split('=');
    let leftSide = eqParts[0];
    let rightSide = eqParts[1];
    
    const xParts = leftSide.split('x');
    
    let aStr = xParts[0].replace(/\s/g, '');
    let bStr = xParts.length > 1 ? xParts[1].replace(/\s/g, '') : '';
    let cStr = rightSide.replace(/\s/g, '');
    
    let a = 1;
    if (aStr === '-') a = -1;
    else if (aStr !== '' && aStr !== '+') {
        a = parseInt(aStr);
        if (isNaN(a)) throw new Error("Invalid coefficient for x");
    }
    
    let b = 0;
    if (bStr !== '') {
        b = parseInt(bStr);
        if (isNaN(b)) throw new Error("Invalid constant on left side");
    }
    
    let c = parseInt(cStr);
    if (isNaN(c)) throw new Error("Invalid constant on right side");

    // Build initial blocks. To make the "remove spaces" step look good, we add some artificial spaces
    const initialEq = [];
    
    if (aStr !== '') {
        initialEq.push({ char: aStr, type: 'a', color: COLOR_A, val: a });
    }
    initialEq.push({ char: ' ', type: 'space', color: COLOR_DEF, val: null });
    initialEq.push({ char: 'x', type: 'x', color: COLOR_X, val: 'x' });
    
    if (b !== 0) {
        initialEq.push({ char: ' ', type: 'space', color: COLOR_DEF, val: null });
        initialEq.push({ char: b > 0 ? '+' + b : b.toString(), type: 'b', color: COLOR_B, val: b });
    }
    
    initialEq.push({ char: ' ', type: 'space', color: COLOR_DEF, val: null });
    initialEq.push({ char: '=', type: 'op', color: COLOR_OP, val: '=' });
    initialEq.push({ char: ' ', type: 'space', color: COLOR_DEF, val: null });
    initialEq.push({ char: c.toString(), type: 'c', color: COLOR_DEF, val: c });

    return { a, b, c, initialEq, rawStr: str };
}

// Block generator
function createBlock(char, color) {
    const size = 1.4;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background - Sharper corners for pro look
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 240, 16);
    ctx.fill();
    
    // Text
    ctx.fillStyle = '#ffffff';
    let fontSize = 120;
    ctx.font = `bold ${fontSize}px Inter, monospace`;
    
    // Scale down font size if text is too wide
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
    
    const plainMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.5 });
    const materials = [plainMat, plainMat, plainMat, plainMat, material, plainMat];
    
    const geometry = new THREE.BoxGeometry(size, size, size * 0.15);
    const mesh = new THREE.Mesh(geometry, materials);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 }));
    mesh.add(edgeLines);
    
    return mesh;
}

// Engine to generate steps dynamically based on equation data
function generateStepsLogic(parsedData) {
    const { a, b, c, initialEq, rawStr } = parsedData;
    const generatedSteps = [];

    generatedSteps.push({
        title: "Step 0: The Problem",
        desc: `We received the equation string: "${rawStr}". Our goal is to isolate 'x' and find its value programmatically.`,
        codeSnippet: `<div class="question-image-mimic">\n  <h2>Solve Linear Equation</h2>\n  <p>Write a function <code>solve_for_x(equation: str) -> float</code> that takes a linear equation string and solves for <code>x</code>.</p>\n  <p>For example, if the string is <code>2x + 4 = 10</code>, the output should be <code>3.0</code>.</p>\n  <h3>Constraints</h3>\n  <ul>\n    <li>The equation will always contain one <code>x</code> and one <code>=</code>.</li>\n    <li>The input string may contain spaces.</li>\n  </ul>\n  <p class="note">NOTE: This is a function type question, you don't have to take input or print the output, just have to complete the required function definition.</p>\n</div>`,
        animate: (instant) => {
            gsap.to(camera.position, { duration: instant ? 0 : 1 });
            blockObjects.forEach(bo => {
                gsap.to(bo.mesh.position, { x: bo.originX, y: 0, z: 0, duration: instant ? 0 : 0.8, ease: "power2.out" });
                gsap.to(bo.mesh.scale, { 
                    x: bo.data.type === 'space' ? 0.3 : 1, 
                    y: bo.data.type === 'space' ? 0.3 : 1, 
                    z: bo.data.type === 'space' ? 0.3 : 1, 
                    duration: instant ? 0 : 0.8 
                });
                if(bo.data.type === 'space') {
                    bo.mesh.material.forEach(m => gsap.to(m, { opacity: 0.1, duration: instant ? 0 : 0.8 }));
                }
            });
            if(!instant) onAnimationComplete();
        }
    });

    generatedSteps.push({
        title: "Step 1: Sanitize Input",
        desc: "First, we clean the string by removing all whitespace. This normalizes the data for parsing.",
        codeSnippet: `<span class="keyword">def</span> <span class="function">solve_for_x</span>(equation: <span class="variable">str</span>) -> <span class="variable">float</span>:\n    <span class="comment"># Remove spaces to normalize the string</span>\n    eq_clean = equation.replace(<span class="string">" "</span>, <span class="string">""</span>)`,
        animate: (instant) => {
            let activeBlocks = blockObjects.filter(bo => bo.data.type !== 'space');
            let cx = -(activeBlocks.length - 1) * 1.6 / 2;
            
            blockObjects.forEach(bo => {
                if (bo.data.type === 'space') {
                    gsap.to(bo.mesh.scale, { x: 0, y: 0, z: 0, duration: instant ? 0 : 0.5 });
                } else {
                    gsap.to(bo.mesh.position, { x: cx, y: 0, z: 0, duration: instant ? 0 : 0.8, ease: "power2.out" });
                    bo.currX = cx; 
                    cx += 1.6;
                }
            });
            
            if (instant) onAnimationComplete();
            else setTimeout(() => onAnimationComplete(), 800);
        }
    });

    generatedSteps.push({
        title: "Step 2: Split by '='",
        desc: "We split the string using '=' as a delimiter, creating two distinct groups: the Left Hand Side (LHS) and Right Hand Side (RHS).",
        codeSnippet: `    <span class="comment"># Split the string by '='</span>\n    left_side, right_side = eq_clean.split(<span class="string">"="</span>)`,
        animate: (instant) => {
            blockObjects.forEach(bo => {
                if (bo.data.type === 'space') return;
                if (bo.data.type === 'op') { 
                    gsap.to(bo.mesh.position, { z: -3, y: 1.5, duration: instant ? 0 : 0.8 });
                    bo.mesh.material.forEach(m => gsap.to(m, { opacity: 0.3, duration: instant ? 0 : 0.8 }));
                } else if (bo.data.type === 'c') { 
                    gsap.to(bo.mesh.position, { x: bo.currX + 1.5, duration: instant ? 0 : 0.8, ease: "power2.out" });
                    bo.currX = bo.currX + 1.5;
                } else { 
                    gsap.to(bo.mesh.position, { x: bo.currX - 1.5, duration: instant ? 0 : 0.8, ease: "power2.out" });
                    bo.currX = bo.currX - 1.5;
                }
            });
            // delay completion slightly for animations that don't have a single master tween
            setTimeout(() => { if(!instant) onAnimationComplete(); }, instant ? 0 : 800);
            if (instant) onAnimationComplete();
        }
    });

    generatedSteps.push({
        title: "Step 3: Parse LHS Coefficients",
        desc: "We split the LHS by 'x'. The first element is coefficient 'a' and the second is constant 'b'.",
        codeSnippet: `    <span class="comment"># Split left side by 'x' to find 'a' and 'b'</span>\n    a_str, b_str = left_side.split(<span class="string">"x"</span>)\n    \n    a = <span class="number">-1</span> <span class="keyword">if</span> a_str == <span class="string">"-"</span> <span class="keyword">else</span> (<span class="number">1</span> <span class="keyword">if</span> a_str == <span class="string">""</span> <span class="keyword">else</span> <span class="variable">int</span>(a_str))\n    b = <span class="number">0</span> <span class="keyword">if</span> b_str == <span class="string">""</span> <span class="keyword">else</span> <span class="variable">int</span>(b_str)\n    c = <span class="variable">int</span>(right_side)`,
        animate: (instant) => {
            blockObjects.forEach(bo => {
                if (bo.data.type === 'space' || bo.data.type === 'op' || bo.data.type === 'c') {
                    gsap.to(bo.mesh.material[4], { roughness: 0.8, duration: instant ? 0 : 0.5 }); 
                } else {
                    gsap.to(bo.mesh.position, { z: 1, duration: instant ? 0 : 0.5 });
                    gsap.to(bo.mesh.rotation, { y: 0.15, duration: instant ? 0 : 0.5 });
                }
            });
            setTimeout(() => { if(!instant) onAnimationComplete(); }, instant ? 0 : 500);
            if (instant) onAnimationComplete();
        }
    });

    if (b !== 0) {
        const cNew = c - b;
        generatedSteps.push({
            title: "Step 4: Transpose Constant 'b'",
            desc: `Subtract 'b' (${b}) from both sides. This moves the term to the RHS, changing its sign. RHS = ${c} - (${b}) = ${cNew}.`,
            codeSnippet: `    <span class="comment"># Transpose Constant 'b'</span>\n    c_new = c - b`,
            animate: (instant) => {
                const bBlock = blockObjects.find(bk => bk.data.type === 'b');
                const cBlock = blockObjects.find(bk => bk.data.type === 'c');
                const aBlock = blockObjects.find(bk => bk.data.type === 'a');
                const xBlock = blockObjects.find(bk => bk.data.type === 'x');
                
                if(aBlock) gsap.to([aBlock.mesh.rotation, xBlock.mesh.rotation], { y: 0, duration: instant ? 0 : 0.5 });
                if(aBlock) gsap.to([aBlock.mesh.position, xBlock.mesh.position], { z: 0, duration: instant ? 0 : 0.5 });
                if(!aBlock) {
                    gsap.to(xBlock.mesh.rotation, { y: 0, duration: instant ? 0 : 0.5 });
                    gsap.to(xBlock.mesh.position, { z: 0, duration: instant ? 0 : 0.5 });
                }
                
                gsap.to(bBlock.mesh.position, { 
                    x: cBlock.currX + 1.6, z: 0,
                    duration: instant ? 0 : 1, 
                    ease: "power2.inOut",
                    onComplete: () => {
                        gsap.to([bBlock.mesh.scale, cBlock.mesh.scale], { x:0, y:0, z:0, duration: instant ? 0 : 0.5 });
                        if(!group.getObjectByName('block_c_new')) {
                            const res = createBlock(cNew.toString(), COLOR_DEF);
                            res.name = 'block_c_new';
                            res.position.set(cBlock.currX + 0.8, 0, 0);
                            res.scale.set(0,0,0);
                            group.add(res);
                            gsap.to(res.scale, { x:1, y:1, z:1, duration: instant ? 0 : 0.5, ease: "back.out", onComplete: () => { if(!instant) onAnimationComplete(); } });
                            cBlock.currX = cBlock.currX + 0.8; 
                        } else {
                            if(!instant) onAnimationComplete();
                        }
                    }
                });
                
                if (aBlock) gsap.to(aBlock.mesh.position, { x: aBlock.currX + 0.8, duration: instant ? 0 : 0.8 });
                gsap.to(xBlock.mesh.position, { x: xBlock.currX + 0.8, duration: instant ? 0 : 0.8 });
                if (instant) onAnimationComplete();
            }
        });
    }

    if (a !== 1) {
        const cCurr = b !== 0 ? (c - b) : c;
        const finalAns = cCurr / a;
        // round to 2 decimal places if needed
        const ansStr = finalAns % 1 !== 0 ? finalAns.toFixed(2) : finalAns.toString();

        generatedSteps.push({
            title: "Step 5: Isolate x",
            desc: `Divide the RHS by the coefficient 'a' (${a}). RHS = ${cCurr} / ${a} = ${ansStr}.`,
            codeSnippet: `    <span class="comment"># Divide by coefficient 'a'</span>\n    x = c_new / a`,
            animate: (instant) => {
                const aBlock = blockObjects.find(bk => bk.data.type === 'a');
                const xBlock = blockObjects.find(bk => bk.data.type === 'x');
                const resC = group.getObjectByName('block_c_new') || blockObjects.find(bk => bk.data.type === 'c').mesh;
                
                if(resC) {
                    gsap.to(aBlock.mesh.position, { 
                        x: resC.position.x, 
                        y: -1.6, 
                        duration: instant ? 0 : 1, 
                        ease: "power2.inOut",
                        onComplete: () => {
                            gsap.to([aBlock.mesh.scale, resC.scale], { x:0, y:0, z:0, duration: instant ? 0 : 0.5 });
                            if(!group.getObjectByName('block_ans')) {
                                const ans = createBlock(ansStr, COLOR_A);
                                ans.name = 'block_ans';
                                ans.position.set(resC.position.x, 0, 0);
                                ans.scale.set(0,0,0);
                                group.add(ans);
                                gsap.to(ans.scale, { x:1, y:1, z:1, duration: instant ? 0 : 0.5, ease: "back.out", onComplete: () => { if(!instant) onAnimationComplete(); } });
                            } else {
                                if(!instant) onAnimationComplete();
                            }
                        }
                    });
                    
                    gsap.to(xBlock.mesh.position, { x: xBlock.currX + 1.6, duration: instant ? 0 : 0.8 });
                    if (instant) onAnimationComplete();
                } else {
                    if (instant) onAnimationComplete();
                }
            }
        });
    }

    generatedSteps.push({
        title: "Step " + generatedSteps.length + ": Solution Computed",
        desc: "The value of 'x' has been successfully isolated. The algorithm completes.",
        codeSnippet: `<span class="keyword">def</span> <span class="function">solve_for_x</span>(equation: <span class="variable">str</span>) -> <span class="variable">float</span>:\n    eq_clean = equation.replace(<span class="string">" "</span>, <span class="string">""</span>)\n    left_side, right_side = eq_clean.split(<span class="string">"="</span>)\n    a_str, b_str = left_side.split(<span class="string">"x"</span>)\n    \n    a = <span class="number">-1</span> <span class="keyword">if</span> a_str == <span class="string">"-"</span> <span class="keyword">else</span> (<span class="number">1</span> <span class="keyword">if</span> a_str == <span class="string">""</span> <span class="keyword">else</span> <span class="variable">int</span>(a_str))\n    b = <span class="number">0</span> <span class="keyword">if</span> b_str == <span class="string">""</span> <span class="keyword">else</span> <span class="variable">int</span>(b_str)\n    c = <span class="variable">int</span>(right_side)\n    \n    c_new = c - b\n    x = c_new / a\n    <span class="keyword">return</span> x`,
        animate: (instant) => {
            const xBlock = blockObjects.find(bk => bk.data.type === 'x');
            const eqBlock = blockObjects.find(bk => bk.data.type === 'op');
            const finalRes = group.getObjectByName('block_ans') || group.getObjectByName('block_c_new') || blockObjects.find(bk => bk.data.type === 'c').mesh;
            
            gsap.to(eqBlock.mesh.position, { z: 0, y: 0, duration: instant ? 0 : 0.8 });
            eqBlock.mesh.material.forEach(m => gsap.to(m, { opacity: 1, duration: instant ? 0 : 0.8 }));
            
            if(finalRes) {
                gsap.to(finalRes.rotation, { y: Math.PI * 2, duration: instant ? 0 : 1, ease: "power2.out" });
                gsap.to(finalRes.scale, { x: 1.1, y: 1.1, z: 1.1, yoyo: true, repeat: 1, duration: instant ? 0 : 0.5, onComplete: () => { if(!instant) onAnimationComplete(); } });
            } else {
                setTimeout(() => { if(!instant) onAnimationComplete(); }, instant ? 0 : 800);
            }
            gsap.to(xBlock.mesh.rotation, { y: Math.PI * 2, duration: instant ? 0 : 1, ease: "power2.out" });
            if (instant) onAnimationComplete();
        }
    });

    return generatedSteps;
}

function onAnimationComplete() {
    isStepImplemented = true;
    updateUI();
}

function generateDivideStepsLogic(n, k) {
    const generatedSteps = [];
    const base = Math.floor(n / k);
    const rem = n % k;

    generatedSteps.push({
        title: "Step 0: The Problem",
        desc: `Divide n=${n} into k=${k} almost equal parts. Larger numbers go first.`,
        codeSnippet: `<div class="question-image-mimic">\n  <h2>Divide Number Into Almost Equal Parts</h2>\n  <p>Write a function <code>divide_into_almost_equal_parts(n: int, k: int) -> list</code> that takes two integers, <code>n</code> and <code>k</code>, and creates a list of size <code>k</code> where the elements are approximately equal and sum up to <code>n</code>. The list should contain larger numbers towards the beginning.</p>\n  <p>The larger numbers should be prioritized for the earlier parts of the list, and you should ensure that the sum of the list matches <code>n</code>.</p>\n  <h3>Constraints</h3>\n  <ul>\n    <li>The integers <code>n</code> (total) and <code>k</code> (parts) are both positive integers.</li>\n    <li>The output list will always be of length <code>k</code>.</li>\n  </ul>\n  <p class="note">NOTE: This is a function type question, you don't have to take input or print the output, just have to complete the required function definition.</p>\n</div>`,
        animate: (instant) => {
            gsap.to(camera.position, { duration: instant ? 0 : 1 });
            if(!instant) onAnimationComplete();
        }
    });

    generatedSteps.push({
        title: "Step 1: Calculate Base Value",
        desc: `Calculate the base value by integer division: base = n // k = ${n} // ${k} = ${base}.`,
        codeSnippet: `<span class="keyword">def</span> <span class="function">divide_into_almost_equal_parts</span>(n: <span class="variable">int</span>, k: <span class="variable">int</span>) -> <span class="variable">list</span>:\n    base = n // k`,
        animate: (instant) => {
            if(!group.getObjectByName('block_base')) {
                const baseBlock = createBlock(`base=${base}`, 0x8b5cf6);
                baseBlock.name = 'block_base';
                baseBlock.position.set(-2, 0, 0);
                baseBlock.scale.set(0,0,0);
                group.add(baseBlock);
                gsap.to(baseBlock.scale, {x:1, y:1, z:1, duration: instant ? 0 : 0.8, onComplete: () => { if(!instant) onAnimationComplete(); }});
            } else {
                if(!instant) onAnimationComplete();
            }
        }
    });

    generatedSteps.push({
        title: "Step 2: Calculate Remainder",
        desc: `Calculate the remainder: rem = n % k = ${n} % ${k} = ${rem}. This tells us how many parts need an extra +1.`,
        codeSnippet: `    rem = n % k`,
        animate: (instant) => {
            if(!group.getObjectByName('block_rem')) {
                const remBlock = createBlock(`rem=${rem}`, 0xf59e0b);
                remBlock.name = 'block_rem';
                remBlock.position.set(2, 0, 0);
                remBlock.scale.set(0,0,0);
                group.add(remBlock);
                gsap.to(remBlock.scale, {x:1, y:1, z:1, duration: instant ? 0 : 0.8, onComplete: () => { if(!instant) onAnimationComplete(); }});
            } else {
                if(!instant) onAnimationComplete();
            }
        }
    });

    generatedSteps.push({
        title: "Step 3: Distribute Base",
        desc: `Initialize the list with the base value for all ${k} parts.`,
        codeSnippet: `    result = [base] * k`,
        animate: (instant) => {
            const baseBlock = group.getObjectByName('block_base');
            for(let i=0; i<k; i++) {
                const slotBo = blockObjects.find(b => b.data.type === 'slot' && b.data.idx === i);
                if(slotBo && !group.getObjectByName(`fill_base_${i}`)) {
                    const fill = createBlock(base.toString(), 0x8b5cf6);
                    fill.name = `fill_base_${i}`;
                    fill.position.set(baseBlock.position.x, baseBlock.position.y, baseBlock.position.z);
                    group.add(fill);
                    gsap.to(fill.position, {x: slotBo.mesh.position.x, y: slotBo.mesh.position.y, z: slotBo.mesh.position.z + 0.1, duration: instant? 0 : 0.8, delay: instant ? 0 : i*0.1});
                }
            }
            setTimeout(() => { if(!instant) onAnimationComplete(); }, instant ? 0 : 800 + k*100);
            if (instant) onAnimationComplete();
        }
    });

    generatedSteps.push({
        title: "Step 4: Distribute Remainder",
        desc: `Add +1 to the first ${rem} parts so the total sum matches n.`,
        codeSnippet: `    <span class="keyword">for</span> i <span class="keyword">in</span> <span class="variable">range</span>(rem):\n        result[i] += <span class="number">1</span>`,
        animate: (instant) => {
            const remBlock = group.getObjectByName('block_rem');
            for(let i=0; i<rem; i++) {
                const slotBo = blockObjects.find(b => b.data.type === 'slot' && b.data.idx === i);
                if(slotBo && !group.getObjectByName(`fill_rem_${i}`)) {
                    const fill = createBlock("+1", 0xf59e0b);
                    fill.name = `fill_rem_${i}`;
                    fill.position.set(remBlock.position.x, remBlock.position.y, remBlock.position.z);
                    group.add(fill);
                    gsap.to(fill.position, {x: slotBo.mesh.position.x, y: slotBo.mesh.position.y + 1, z: slotBo.mesh.position.z + 0.2, duration: instant? 0 : 0.5, delay: instant ? 0 : i*0.2});
                }
            }
            setTimeout(() => { if(!instant) onAnimationComplete(); }, instant ? 0 : 500 + rem*200);
            if (instant) onAnimationComplete();
        }
    });

    generatedSteps.push({
        title: "Step 5: Solution Computed",
        desc: "The array has been successfully divided into almost equal parts.",
        codeSnippet: `<span class="keyword">def</span> <span class="function">divide_into_almost_equal_parts</span>(n: <span class="variable">int</span>, k: <span class="variable">int</span>) -> <span class="variable">list</span>:\n    base = n // k\n    rem = n % k\n    result = [base] * k\n    <span class="keyword">for</span> i <span class="keyword">in</span> <span class="variable">range</span>(rem):\n        result[i] += <span class="number">1</span>\n    <span class="keyword">return</span> result`,
        animate: (instant) => {
            for(let i=0; i<k; i++) {
                const slotBo = blockObjects.find(b => b.data.type === 'slot' && b.data.idx === i);
                const val = i < rem ? base + 1 : base;
                
                const fillBase = group.getObjectByName(`fill_base_${i}`);
                const fillRem = group.getObjectByName(`fill_rem_${i}`);
                
                if (fillBase) gsap.to(fillBase.scale, {x:0, y:0, z:0, duration: instant? 0 : 0.4});
                if (fillRem) gsap.to(fillRem.scale, {x:0, y:0, z:0, duration: instant? 0 : 0.4});

                if(!group.getObjectByName(`final_res_${i}`)) {
                    const fill = createBlock(val.toString(), 0x10b981);
                    fill.name = `final_res_${i}`;
                    fill.position.set(slotBo.mesh.position.x, slotBo.mesh.position.y, 0.5);
                    fill.scale.set(0,0,0);
                    group.add(fill);
                    gsap.to(fill.scale, {x:1.1, y:1.1, z:1.1, duration: instant? 0 : 0.5, delay: instant ? 0 : 0.2, ease: "back.out"});
                }
            }
            setTimeout(() => { if(!instant) onAnimationComplete(); }, instant ? 0 : 700);
            if(instant) onAnimationComplete();
        }
    });

    return generatedSteps;
}

function initDivideScene(targetStep = 0) {
    errorMsg.innerText = '';
    const n = parseInt(nInput.value) || 10;
    const k = parseInt(kInput.value) || 3;
    
    if (k <= 0) {
        errorMsg.innerText = "k must be > 0";
        return;
    }
    
    while(group.children.length > 0){ group.remove(group.children[0]); }
    blockObjects = [];
    
    const nBlockMesh = createBlock(`n=${n}`, 0x2563eb);
    nBlockMesh.position.set(-2, 2, 0);
    group.add(nBlockMesh);
    blockObjects.push({ mesh: nBlockMesh, data: { type: 'var_n', val: n }, originX: -2 });

    const kBlockMesh = createBlock(`k=${k}`, 0x10b981);
    kBlockMesh.position.set(2, 2, 0);
    group.add(kBlockMesh);
    blockObjects.push({ mesh: kBlockMesh, data: { type: 'var_k', val: k }, originX: 2 });
    
    for(let i=0; i<k; i++) {
        let slot = createBlock("0", 0x334155);
        slot.position.set(-((k-1)*1.6)/2 + i*1.6, -2, 0);
        group.add(slot);
        blockObjects.push({ mesh: slot, data: { type: 'slot', idx: i }, originX: slot.position.x });
    }
    
    camera.position.z = Math.max(16, k * 1.5);
    
    steps = generateDivideStepsLogic(n, k);
    
    currentStep = -1;
    for(let i = 0; i < targetStep; i++) {
        currentStep = i;
        steps[i].animate(true);
        isStepImplemented = true;
    }
    
    currentStep = targetStep;
    isStepImplemented = false;
    if (targetStep === 0) steps[0].animate(false); 
    else updateUI();
}

function initSceneWithEquation(eqString, targetStep = 0) {
    errorMsg.innerText = '';
    try {
        const parsed = parseEquation(eqString);
        
        while(group.children.length > 0){ group.remove(group.children[0]); }
        blockObjects = [];
        
        let currentX = 0;
        
        parsed.initialEq.forEach((item) => {
            const mesh = createBlock(item.char, item.color);
            mesh.position.set(currentX, 0, 0);
            
            if (item.type === 'space') {
                mesh.scale.set(0.3, 0.3, 0.3);
                mesh.material.forEach(m => { m.opacity = 0.1; m.transparent = true; });
                currentX += 0.6;
            } else {
                currentX += 1.6;
            }
            
            group.add(mesh);
            
            blockObjects.push({
                mesh: mesh,
                data: item,
                startX: mesh.position.x,
                originX: mesh.position.x
            });
        });
        
        const totalWidth = currentX - 1.6;
        const startOffset = -totalWidth / 2;
        blockObjects.forEach(bo => {
            bo.originX += startOffset;
            bo.mesh.position.x = bo.originX;
        });
        
        // Auto-scale camera to fit the equation length
        const reqZ = Math.max(16, totalWidth * 0.9);
        camera.position.z = reqZ;
        
        steps = generateStepsLogic(parsed);
        
        // Fast forward to target step
        currentStep = -1; // initialize so loop works
        for(let i = 0; i < targetStep; i++) {
            currentStep = i;
            steps[i].animate(true);
            isStepImplemented = true;
        }
        
        // Setup the target step UI, wait for implementation
        currentStep = targetStep;
        isStepImplemented = false;
        
        // If it's step 0, we automatically implement it because it's just the intro layout
        if (targetStep === 0) {
            steps[0].animate(false); // Play intro animation
        } else {
            updateUI();
        }

    } catch (e) {
        errorMsg.innerText = e.message;
    }
}

function initScene(targetStep = 0) {
    if (currentMode === 'eq') {
        initSceneWithEquation(eqInput.value, targetStep);
    } else if (currentMode === 'div') {
        initDivideScene(targetStep);
    } else if (currentMode === 'poly') {
        initPolyScene(targetStep);
    } else if (currentMode === 'todo') {
        initTodoScene(targetStep);
    } else {
        initBarChartScene(targetStep);
    }
}

function goToStep(index) {
    if (index < 0 || index >= steps.length) return;
    
    if (index < currentStep) {
        initScene(index);
        return; 
    }
    
    currentStep = index;
    isStepImplemented = false;
    updateUI();
}

function implementCurrentStep() {
    if(isStepImplemented) return;
    implementBtn.disabled = true; // disable during animation
    steps[currentStep].animate(false);
}

function updateUI() {
    uiTitle.innerText = steps[currentStep].title;
    uiDesc.innerText = steps[currentStep].desc;
    if (steps[currentStep].codeSnippet !== undefined) {
        const codeContentBox = document.getElementById('code-content-box');
        if (currentStep === 0) {
            codeContentBox.innerHTML = steps[currentStep].codeSnippet;
            document.querySelector('.code-header').style.display = 'none';
            document.querySelector('.code-container').style.padding = '0';
        } else {
            codeContentBox.innerHTML = `<pre><code id="step-code">${steps[currentStep].codeSnippet}</code></pre>`;
            document.querySelector('.code-header').style.display = 'flex';
            document.querySelector('.code-container').style.padding = '1rem';
        }
    }
    
    prevBtn.disabled = (currentStep === 0);
    
    if (isStepImplemented) {
        implementBtn.disabled = true;
        nextBtn.disabled = (currentStep === steps.length - 1);
    } else {
        implementBtn.disabled = false;
        nextBtn.disabled = true;
    }
}

// Mode Events
btnModeEq.addEventListener('click', () => {
    currentMode = 'eq';
    btnModeEq.classList.add('active');
    btnModeDiv.classList.remove('active');
    btnModePoly.classList.remove('active');
    if(btnModeTodo) btnModeTodo.classList.remove('active');
    if(btnModeBarchart) btnModeBarchart.classList.remove('active');
    inputGroupEq.style.display = 'flex';
    inputGroupDiv.style.display = 'none';
    inputGroupPoly.style.display = 'none';
    if(inputGroupTodo) inputGroupTodo.style.display = 'none';
    if(inputGroupBarchart) inputGroupBarchart.style.display = 'none';
    initScene(0);
});
btnModeDiv.addEventListener('click', () => {
    currentMode = 'div';
    btnModeDiv.classList.add('active');
    btnModeEq.classList.remove('active');
    btnModePoly.classList.remove('active');
    if(btnModeTodo) btnModeTodo.classList.remove('active');
    if(btnModeBarchart) btnModeBarchart.classList.remove('active');
    inputGroupDiv.style.display = 'flex';
    inputGroupEq.style.display = 'none';
    inputGroupPoly.style.display = 'none';
    if(inputGroupTodo) inputGroupTodo.style.display = 'none';
    if(inputGroupBarchart) inputGroupBarchart.style.display = 'none';
    initScene(0);
});
btnModePoly.addEventListener('click', () => {
    currentMode = 'poly';
    btnModePoly.classList.add('active');
    btnModeEq.classList.remove('active');
    btnModeDiv.classList.remove('active');
    if(btnModeTodo) btnModeTodo.classList.remove('active');
    if(btnModeBarchart) btnModeBarchart.classList.remove('active');
    inputGroupPoly.style.display = 'flex';
    inputGroupEq.style.display = 'none';
    inputGroupDiv.style.display = 'none';
    if(inputGroupTodo) inputGroupTodo.style.display = 'none';
    if(inputGroupBarchart) inputGroupBarchart.style.display = 'none';
    initScene(0);
});
if(btnModeTodo) {
    btnModeTodo.addEventListener('click', () => {
        currentMode = 'todo';
        btnModeTodo.classList.add('active');
        btnModeEq.classList.remove('active');
        btnModeDiv.classList.remove('active');
        btnModePoly.classList.remove('active');
        if(btnModeBarchart) btnModeBarchart.classList.remove('active');
        inputGroupTodo.style.display = 'flex';
        inputGroupEq.style.display = 'none';
        inputGroupDiv.style.display = 'none';
        inputGroupPoly.style.display = 'none';
        if(inputGroupBarchart) inputGroupBarchart.style.display = 'none';
        initScene(0);
    });
}
if(btnModeBarchart) {
    btnModeBarchart.addEventListener('click', () => {
        currentMode = 'barchart';
        btnModeBarchart.classList.add('active');
        btnModeEq.classList.remove('active');
        btnModeDiv.classList.remove('active');
        btnModePoly.classList.remove('active');
        if(btnModeTodo) btnModeTodo.classList.remove('active');
        inputGroupBarchart.style.display = 'flex';
        inputGroupEq.style.display = 'none';
        inputGroupDiv.style.display = 'none';
        inputGroupPoly.style.display = 'none';
        if(inputGroupTodo) inputGroupTodo.style.display = 'none';
        initScene(0);
    });
}

// Events
prevBtn.addEventListener('click', () => goToStep(currentStep - 1));
nextBtn.addEventListener('click', () => { if(isStepImplemented) goToStep(currentStep + 1); });
implementBtn.addEventListener('click', () => implementCurrentStep());
document.getElementById('btn-reset').addEventListener('click', () => initScene(0));
generateBtnEq.addEventListener('click', () => initScene(0));
generateBtnDiv.addEventListener('click', () => initScene(0));
if(generateBtnPoly) generateBtnPoly.addEventListener('click', () => initScene(0));
if(generateBtnTodo) generateBtnTodo.addEventListener('click', () => initScene(0));
if(generateBtnBarchart) generateBtnBarchart.addEventListener('click', () => initScene(0));
eqInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') initScene(0) });
nInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') initScene(0) });
kInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') initScene(0) });
if(polyInput) polyInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') initScene(0) });
if(xInput) xInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') initScene(0) });
if(todoIndices) todoIndices.addEventListener('keydown', (e) => { if(e.key === 'Enter') initScene(0) });

btnFullscreen.addEventListener('click', () => {
    codeContainer.classList.toggle('fullscreen');
});

// Animation Loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    if (!canvasContainer) return;
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Start
initScene(0);
animate();
function generatePolyStepsLogic(coeffs, xVal) {
    const generatedSteps = [];
    const n = coeffs.length;
    
    generatedSteps.push({
        title: "Step 0: The Problem",
        desc: `Evaluate the polynomial with coefficients [${coeffs.join(', ')}] at x = ${xVal}.`,
        codeSnippet: `<div class="question-image-mimic">\n  <h2>Compute Polynomial Value</h2>\n  <p>Write a function <code>evaluate_polynomial(coefficients: list, x: float) -> float</code> that computes the value of a polynomial given its coefficients and a value for <code>x</code>. The coefficients will be provided as a list in descending order, where:</p>\n  <ul>\n    <li>The first element is the coefficient for the highest degree,</li>\n    <li>The last element is the constant term.</li>\n  </ul>\n  <p>For example, if the polynomial is represented as ( 2x^3 + 3x^2 + 5x + 7 ), the coefficients list would be <code>[2, 3, 5, 7]</code>.</p>\n  <h3>Constraints</h3>\n  <ul>\n    <li>The coefficients list will have at least one element.</li>\n    <li>The value of <code>x</code> will be of type <code>int</code>.</li>\n  </ul>\n  <p class="note">NOTE: This is a function type question, you don't have to take input or print the output, just have to complete the required function definition.</p>\n</div>`,
        animate: (instant) => {
            gsap.to(camera.position, { duration: instant ? 0 : 1 });
            if(!instant) onAnimationComplete();
        }
    });

    generatedSteps.push({
        title: "Step 1: Initialize Result",
        desc: `Set the initial result to 0. We will iterate through each coefficient using Horner's method to evaluate efficiently.`,
        codeSnippet: `<span class="keyword">def</span> <span class="function">evaluate_polynomial</span>(coefficients: <span class="variable">list</span>, x: <span class="variable">float</span>) -> <span class="variable">float</span>:\n    result = <span class="number">0</span>`,
        animate: (instant) => {
            if(!group.getObjectByName('block_result')) {
                const resBlock = createBlock(`res=0`, 0x10b981);
                resBlock.name = 'block_result';
                resBlock.position.set(0, -2, 0);
                resBlock.scale.set(0,0,0);
                group.add(resBlock);
                gsap.to(resBlock.scale, {x:1.5, y:1.5, z:1.5, duration: instant ? 0 : 0.8, onComplete: () => { if(!instant) onAnimationComplete(); }});
            } else {
                if(!instant) onAnimationComplete();
            }
        }
    });

    let currentRes = 0;
    
    for (let i = 0; i < n; i++) {
        const c = coeffs[i];
        let oldRes = currentRes;
        currentRes = currentRes * xVal + c;
        let stepRes = currentRes;
        
        generatedSteps.push({
            title: `Step ${i+2}: Process Coefficient ${c}`,
            desc: `Update result: result = result * x + coef = ${oldRes} * ${xVal} + ${c} = ${stepRes}.`,
            codeSnippet: `    <span class="keyword">for</span> coef <span class="keyword">in</span> coefficients:\n        <span class="comment"># Processing coef = ${c}</span>\n        result = result * x + coef`,
            animate: (instant) => {
                const slotBo = blockObjects.find(b => b.data.type === 'coef' && b.data.idx === i);
                const xBo = blockObjects.find(b => b.data.type === 'var_x');
                const resBlock = group.getObjectByName('block_result');
                
                if (slotBo && xBo && resBlock) {
                    const cClone = createBlock(c.toString(), 0x334155);
                    cClone.position.copy(slotBo.mesh.position);
                    group.add(cClone);
                    
                    const xClone = createBlock(xVal.toString(), 0x2563eb);
                    xClone.position.copy(xBo.mesh.position);
                    group.add(xClone);
                    
                    gsap.to(xClone.position, {x: resBlock.position.x - 0.8, y: resBlock.position.y + 1, z: 0.5, duration: instant ? 0: 0.5});
                    gsap.to(cClone.position, {x: resBlock.position.x + 0.8, y: resBlock.position.y + 1, z: 0.5, duration: instant ? 0: 0.5, delay: instant ? 0 : 0.2});
                    
                    gsap.to(xClone.scale, {x:0, y:0, z:0, duration: instant? 0: 0.4, delay: instant? 0: 0.8});
                    gsap.to(cClone.scale, {x:0, y:0, z:0, duration: instant? 0: 0.4, delay: instant? 0: 0.8});
                    
                    setTimeout(() => {
                        group.remove(xClone);
                        group.remove(cClone);
                        const newResBlock = createBlock(`res=${stepRes}`, 0x10b981);
                        newResBlock.name = 'block_result';
                        newResBlock.position.copy(resBlock.position);
                        newResBlock.scale.set(0,0,0);
                        group.add(newResBlock);
                        gsap.to(newResBlock.scale, {x:1.5, y:1.5, z:1.5, duration: instant? 0 : 0.4, ease: "back.out"});
                        
                        group.remove(resBlock);
                        if(!instant) onAnimationComplete();
                    }, instant ? 0 : 1200);
                    if (instant) onAnimationComplete();
                } else {
                    if (instant) onAnimationComplete();
                }
            }
        });
    }

    generatedSteps.push({
        title: `Step ${n+2}: Solution Computed`,
        desc: `The polynomial value has been successfully computed: ${currentRes}.`,
        codeSnippet: `<span class="keyword">def</span> <span class="function">evaluate_polynomial</span>(coefficients: <span class="variable">list</span>, x: <span class="variable">float</span>) -> <span class="variable">float</span>:\n    result = <span class="number">0</span>\n    <span class="keyword">for</span> coef <span class="keyword">in</span> coefficients:\n        result = result * x + coef\n    <span class="keyword">return</span> result`,
        animate: (instant) => {
            const resBlock = group.getObjectByName('block_result');
            if (resBlock) {
                gsap.to(resBlock.rotation, { y: Math.PI * 2, duration: instant ? 0 : 1, ease: "power2.out" });
                gsap.to(resBlock.scale, { x: 1.8, y: 1.8, z: 1.8, yoyo: true, repeat: 1, duration: instant ? 0 : 0.5, onComplete: () => { if(!instant) onAnimationComplete(); } });
            } else {
                if(!instant) onAnimationComplete();
            }
            if (instant) onAnimationComplete();
        }
    });

    return generatedSteps;
}

function initPolyScene(targetStep = 0) {
    errorMsg.innerText = '';
    const polyStr = document.getElementById('poly-input').value || "2, 3, 5, 7";
    const xVal = parseInt(document.getElementById('x-input').value) || 2;
    
    let coeffs = [];
    try {
        coeffs = polyStr.split(',').map(s => {
            const parsed = parseFloat(s.trim());
            if(isNaN(parsed)) throw new Error();
            return parsed;
        });
    } catch(e) {
        errorMsg.innerText = "Invalid coefficients. Use comma separated numbers.";
        return;
    }
    
    while(group.children.length > 0){ group.remove(group.children[0]); }
    blockObjects = [];
    
    const n = coeffs.length;
    
    // x block
    const xBlockMesh = createBlock(`x=${xVal}`, 0x2563eb);
    xBlockMesh.position.set(0, 2, 0);
    group.add(xBlockMesh);
    blockObjects.push({ mesh: xBlockMesh, data: { type: 'var_x', val: xVal }, originX: 0 });

    // array slots
    for(let i=0; i<n; i++) {
        let slot = createBlock(coeffs[i].toString(), 0x334155);
        slot.position.set(-((n-1)*1.6)/2 + i*1.6, 0, 0);
        group.add(slot);
        blockObjects.push({ mesh: slot, data: { type: 'coef', idx: i }, originX: slot.position.x });
    }
    
    camera.position.z = Math.max(16, n * 1.5);
    
    steps = generatePolyStepsLogic(coeffs, xVal);
    
    currentStep = -1;
    for(let i = 0; i < targetStep; i++) {
        currentStep = i;
        steps[i].animate(true);
        isStepImplemented = true;
    }
    
    currentStep = targetStep;
    isStepImplemented = false;
    if (targetStep === 0) steps[0].animate(false); 
    else updateUI();
}

// Todo mode setup
function createWideBlock(char, color, width = 8) {
    const size = 1.4;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.beginPath();
    ctx.roundRect(8, 8, 1008, 240, 16);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    let fontSize = 100;
    ctx.font = `bold ${fontSize}px monospace`;
    
    let textWidth = ctx.measureText(char).width;
    while (textWidth > 960 && fontSize > 20) {
        fontSize -= 5;
        ctx.font = `bold ${fontSize}px monospace`;
        textWidth = ctx.measureText(char).width;
    }
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 48, 138); 

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    
    const plainMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.5 });
    const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.1, metalness: 0.2 });
    const materials = [plainMat, plainMat, plainMat, plainMat, material, plainMat];
    
    const geometry = new THREE.BoxGeometry(width, size, size * 0.15);
    const mesh = new THREE.Mesh(geometry, materials);
    
    return mesh;
}

function generateTodoStepsLogic(indices, items) {
    const generatedSteps = [];
    
    generatedSteps.push({
        title: "Step 0: The Problem",
        desc: `Given ${items.length} items, mark indices [${indices.join(', ')}] as completed.`,
        codeSnippet: `<div class="question-image-mimic">\n  <h2>Update Todo List Based on Given Indices</h2>\n  <p>Given a todo list formatted as multiple lines, where each todo item is represented as <code>- [ ] item</code>. Your task is to mark the todo items as completed based on the indices provided in the first line of the input. The completed items should be marked with <code>- [x]</code>.</p>\n  <p class="note">NOTE: This is an I/O type question. You need to write the complete code to read the input and print the output.</p>\n  <h3>Input Format</h3>\n  <ul>\n    <li>The first line contains the number of items in the todo list</li>\n    <li>The second line contains a space-separated list of indices (0-based) indicating which items in the todo list should be marked as completed.</li>\n    <li>The subsequent lines contain the todo list items.</li>\n  </ul>\n  <h3>Output Format</h3>\n  <ul>\n    <li>Print the updated todo list with the specified items marked as completed.</li>\n  </ul>\n</div>`,
        animate: (instant) => {
            gsap.to(camera.position, { duration: instant ? 0 : 1 });
            if(!instant) onAnimationComplete();
        }
    });

    generatedSteps.push({
        title: "Step 1: Read Inputs",
        desc: `Read n, indices, and the list of items. Initialize the UI state.`,
        codeSnippet: `n = <span class="variable">int</span>(<span class="function">input</span>())\nindices = <span class="variable">list</span>(<span class="function">map</span>(<span class="variable">int</span>, <span class="function">input</span>().split()))\nitems = []\n<span class="keyword">for</span> _ <span class="keyword">in</span> <span class="variable">range</span>(n):\n    items.append(<span class="function">input</span>())`,
        animate: (instant) => {
            gsap.to(camera.position, { duration: instant ? 0 : 0.5, onComplete: () => { if(!instant) onAnimationComplete(); }});
        }
    });

    for (let i = 0; i < indices.length; i++) {
        let idx = indices[i];
        if(idx < 0 || idx >= items.length) continue;
        
        generatedSteps.push({
            title: `Step ${i+2}: Mark index ${idx} completed`,
            desc: `Update item at index ${idx} to [x].`,
            codeSnippet: `<span class="keyword">for</span> idx <span class="keyword">in</span> indices:\n    <span class="comment"># Processing index ${idx}</span>\n    items[idx] = items[idx].replace(<span class="string">"- [ ]"</span>, <span class="string">"- [x]"</span>)`,
            animate: (instant) => {
                const targetBo = blockObjects.find(b => b.data.type === 'todo' && b.data.idx === idx);
                if (targetBo) {
                    const newText = `- [x] ${targetBo.data.rawText}`;
                    const completedBlock = createWideBlock(newText, 0x10b981);
                    completedBlock.position.copy(targetBo.mesh.position);
                    completedBlock.scale.set(0, 0, 0);
                    group.add(completedBlock);
                    
                    gsap.to(targetBo.mesh.scale, {x:0, y:0, z:0, duration: instant ? 0 : 0.4});
                    gsap.to(completedBlock.scale, {x:1.05, y:1.05, z:1.05, duration: instant ? 0 : 0.5, ease: "back.out", delay: instant ? 0 : 0.2, onComplete: () => {
                        gsap.to(completedBlock.scale, {x:1, y:1, z:1, duration: instant ? 0 : 0.3});
                        if(!instant) onAnimationComplete();
                    }});
                } else {
                    if(!instant) onAnimationComplete();
                }
                if(instant) onAnimationComplete();
            }
        });
    }

    generatedSteps.push({
        title: `Final Step: Print Output`,
        desc: `Print the updated list line by line.`,
        codeSnippet: `n = <span class="variable">int</span>(<span class="function">input</span>())\nindices = <span class="variable">list</span>(<span class="function">map</span>(<span class="variable">int</span>, <span class="function">input</span>().split()))\nitems = []\n<span class="keyword">for</span> _ <span class="keyword">in</span> <span class="variable">range</span>(n):\n    items.append(<span class="function">input</span>())\n\n<span class="keyword">for</span> idx <span class="keyword">in</span> indices:\n    <span class="keyword">if</span> <span class="number">0</span> <= idx < n:\n        items[idx] = items[idx].replace(<span class="string">"- [ ]"</span>, <span class="string">"- [x]"</span>)\n\n<span class="keyword">for</span> item <span class="keyword">in</span> items:\n    <span class="function">print</span>(item)`,
        animate: (instant) => {
            gsap.to(camera.position, {z: Math.max(18, items.length * 2.5), duration: instant ? 0 : 1});
            if(!instant) onAnimationComplete();
        }
    });

    return generatedSteps;
}

function initTodoScene(targetStep = 0) {
    errorMsg.innerText = '';
    const indicesStr = document.getElementById('todo-indices').value || "0, 2";
    const itemsStr = document.getElementById('todo-items').value || "Buy milk, Walk dog, Write code";
    
    let indices = [];
    try {
        indices = indicesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    } catch(e) {
        errorMsg.innerText = "Invalid indices.";
        return;
    }
    
    let items = itemsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    while(group.children.length > 0){ group.remove(group.children[0]); }
    blockObjects = [];
    
    const n = items.length;
    let startY = (n * 1.8) / 2 - 0.9;
    
    for(let i=0; i<n; i++) {
        let block = createWideBlock(`- [ ] ${items[i]}`, 0x334155);
        block.position.set(0, startY - i * 1.8, 0);
        group.add(block);
        blockObjects.push({ mesh: block, data: { type: 'todo', idx: i, rawText: items[i] } });
    }
    
    camera.position.z = Math.max(16, n * 2.5);
    camera.position.y = 0;
    camera.position.x = 0;
    
    steps = generateTodoStepsLogic(indices, items);
    
    currentStep = -1;
    for(let i = 0; i < targetStep; i++) {
        currentStep = i;
        steps[i].animate(true);
        isStepImplemented = true;
    }
    
    currentStep = targetStep;
    isStepImplemented = false;
    if (targetStep === 0) steps[0].animate(false); 
    else updateUI();
}

function generateBarChartStepsLogic(pairs) {
    const generatedSteps = [];
    
    // HTML representation
    const questionHtml = `<div class="question-image-mimic">
  <h2>Horizontal Bar Chart</h2>
  <p>Given a set of key-value pairs, where each key is a string (representing a category) and the value is an integer (representing a count). Your task is to generate a horizontal bar chart using the <code>#</code> character, with the following formatting:</p>
  <ul>
    <li>Each line should contain the key, followed by a colon <code>:</code>, and then a number of <code>#</code> characters equal to the corresponding count.</li>
    <li>The keys should be <b>right-aligned</b> based on the length of the longest key, so that the colons <code>:</code> are vertically aligned in the output.</li>
  </ul>
  <h3>Input Format</h3>
  <p>The input consists of:</p>
  <ul>
    <li>An integer <code>n</code> - the number of key-value pairs.</li>
    <li>Followed by <code>n</code> lines, each containing a string <code>key</code> and an integer <code>value</code> separated by a colon (<code>:</code>), with <b>no spaces</b>.</li>
  </ul>
</div>`;

    generatedSteps.push({
        title: "Step 0: The Problem",
        desc: `Generate a horizontally aligned bar chart based on key-value pairs.`,
        codeSnippet: questionHtml,
        animate: (instant) => {
            gsap.to(camera.position, { duration: instant ? 0 : 1 });
            if(!instant) onAnimationComplete();
        }
    });

    let max_len = 0;
    pairs.forEach(p => {
        if (p.key.length > max_len) max_len = p.key.length;
    });

    generatedSteps.push({
        title: "Step 1: Read Inputs and Find Max Length",
        desc: `Read ${pairs.length} pairs and find the maximum key length, which is ${max_len}.`,
        codeSnippet: `n = <span class="variable">int</span>(<span class="function">input</span>())\npairs = []\nmax_len = <span class="number">0</span>\n<span class="keyword">for</span> _ <span class="keyword">in</span> <span class="variable">range</span>(n):\n    line = <span class="function">input</span>()\n    key, val_str = line.split(<span class="string">":"</span>)\n    val = <span class="variable">int</span>(val_str)\n    pairs.append((key, val))\n    <span class="keyword">if</span> <span class="function">len</span>(key) > max_len:\n        max_len = <span class="function">len</span>(key)`,
        animate: (instant) => {
            gsap.to(camera.position, {z: Math.max(16, pairs.length * 3), y: 0, x: 0, duration: instant ? 0 : 1});
            if(!instant) setTimeout(() => onAnimationComplete(), 500);
        }
    });

    for (let i = 0; i < pairs.length; i++) {
        let p = pairs[i];
        
        generatedSteps.push({
            title: `Step 2.${i+1}: Process Category '${p.key}'`,
            desc: `Right-align '${p.key}' to ${max_len} spaces, and draw ${p.val} '#' marks.`,
            codeSnippet: `<span class="keyword">for</span> key, val <span class="keyword">in</span> pairs:\n    <span class="comment"># Processing ${p.key}</span>\n    padded_key = key.rjust(max_len)\n    bar = <span class="string">"#"</span> * val\n    <span class="function">print</span>(<span class="string">f"{padded_key}:{bar}"</span>)`,
            animate: (instant) => {
                let startY = (pairs.length * 2) / 2 - 1 - (i * 2);
                
                // create the padded key block
                let keyText = p.key.padStart(max_len, ' ') + ":";
                let keyBlock = createWideBlock(keyText, 0x334155, 6);
                keyBlock.position.set(-3.5, startY, 0);
                keyBlock.scale.set(0, 0, 0);
                group.add(keyBlock);
                
                gsap.to(keyBlock.scale, {x: 1, y: 1, z: 1, duration: instant ? 0 : 0.4});
                
                // create the # blocks
                let totalDelay = instant ? 0 : 0.5;
                for (let j = 0; j < p.val; j++) {
                    let hashBlock = createBlock('#', 0x3b82f6);
                    hashBlock.position.set(0.5 + (j * 1.0), startY, 0);
                    hashBlock.scale.set(0, 0, 0);
                    group.add(hashBlock);
                    
                    gsap.to(hashBlock.scale, {
                        x: 0.75, y: 0.75, z: 0.75, 
                        duration: instant ? 0 : 0.2, 
                        delay: instant ? 0 : totalDelay + (j * 0.1)
                    });
                }
                
                let completionDelay = instant ? 0 : totalDelay + (p.val * 0.1) + 0.2;
                if(!instant) {
                    setTimeout(() => onAnimationComplete(), completionDelay * 1000);
                }
            }
        });
    }

    const finalCode = `n = <span class="variable">int</span>(<span class="function">input</span>())
pairs = []
max_len = <span class="number">0</span>
<span class="keyword">for</span> _ <span class="keyword">in</span> <span class="variable">range</span>(n):
    line = <span class="function">input</span>()
    key, val_str = line.split(<span class="string">":"</span>)
    val = <span class="variable">int</span>(val_str)
    pairs.append((key, val))
    <span class="keyword">if</span> <span class="function">len</span>(key) > max_len:
        max_len = <span class="function">len</span>(key)

<span class="keyword">for</span> key, val <span class="keyword">in</span> pairs:
    padded_key = key.rjust(max_len)
    bar = <span class="string">"#"</span> * val
    <span class="function">print</span>(<span class="string">f"{padded_key}:{bar}"</span>)`;

    generatedSteps.push({
        title: `Final Step: Print Output`,
        desc: `The complete solution that prints the padded keys and bar values.`,
        codeSnippet: finalCode,
        animate: (instant) => {
            gsap.to(camera.position, {z: Math.max(20, pairs.length * 3), duration: instant ? 0 : 1});
            if(!instant) onAnimationComplete();
        }
    });

    return generatedSteps;
}

function initBarChartScene(targetStep = 0) {
    errorMsg.innerText = '';
    const rawData = document.getElementById('barchart-data').value || "3\nApple:5\nBanana:2\nCherry:7";
    const lines = rawData.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let pairs = [];
    if (lines.length > 0) {
        // Assume first line is N, ignore it for parsing logic or just parse the rest
        let startIndex = 0;
        if (!isNaN(parseInt(lines[0])) && lines[0].indexOf(':') === -1) {
            startIndex = 1;
        }
        
        for (let i = startIndex; i < lines.length; i++) {
            if (lines[i].includes(':')) {
                let parts = lines[i].split(':');
                pairs.push({ key: parts[0], val: parseInt(parts[1]) || 0 });
            }
        }
    }
    
    if (pairs.length === 0) {
        errorMsg.innerText = "Invalid input format. Provide key:value pairs.";
        return;
    }
    
    while(group.children.length > 0){ group.remove(group.children[0]); }
    blockObjects = [];
    
    camera.position.z = Math.max(16, pairs.length * 3);
    camera.position.y = 0;
    camera.position.x = 0;
    
    steps = generateBarChartStepsLogic(pairs);
    
    currentStep = -1;
    for(let i = 0; i < targetStep; i++) {
        currentStep = i;
        steps[i].animate(true);
        isStepImplemented = true;
    }
    
    currentStep = targetStep;
    isStepImplemented = false;
    if (targetStep === 0) steps[0].animate(false); 
    else updateUI();
}
