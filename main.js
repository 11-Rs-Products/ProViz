import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EditorState, StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { signOut } from 'firebase/auth';

import { VisualizerAPI } from './src/VisualizerAPI.js';
import { CodeRunner } from './src/CodeRunner.js';
import { questions as fallbackQuestions } from './src/questions.js';
import { initLandingPage } from './src/landing.js';
import { onAuthChange, loginWithGoogle, logoutUser } from './src/firebase.js';
import { fetchQuestions, saveUserEmail } from './src/sanity.js';

// --- Scene Setup ---
const canvas = document.querySelector('#app-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0f172a'); // Slate 900

const canvasContainer = document.getElementById('canvas-container');
const width = canvasContainer ? canvasContainer.clientWidth : window.innerWidth;
const height = canvasContainer ? canvasContainer.clientHeight : window.innerHeight;

const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
camera.position.set(0, 0, 16);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

const group = new THREE.Group();
scene.add(group);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- Initialization ---
const vAPI = new VisualizerAPI(scene, camera, group);
const codeRunner = new CodeRunner(vAPI);

let editor;
let currentQuestion = null;
let activeQuestions = [];
let isAppInitialized = false;
let currentUser = null;

const selectEl = document.getElementById('question-select');
const titleEl = document.getElementById('question-title');
const descEl = document.getElementById('question-desc');
const errorMsg = document.getElementById('error-msg');
const btnRun = document.getElementById('btn-run');
const btnReset = document.getElementById('btn-reset');
const btnSolution = document.getElementById('btn-solution');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnNext = document.getElementById('btn-next');

// --- CodeMirror Stepper Highlighting ---
const addLineHighlight = StateEffect.define();
const lineHighlightField = StateField.define({
    create() { return Decoration.none },
    update(lines, tr) {
        lines = lines.map(tr.changes)
        for (let e of tr.effects) {
            if (e.is(addLineHighlight)) {
                lines = Decoration.none;
                if (e.value > 0 && e.value <= tr.state.doc.lines) {
                    lines = lines.update({
                        add: [Decoration.line({class: "cm-highlightLine"}).range(tr.state.doc.line(e.value).from)]
                    });
                }
            }
        }
        return lines;
    },
    provide: f => EditorView.decorations.from(f)
});

function highlightLine(lineNo) {
    if (!editor) return;
    editor.dispatch({ effects: addLineHighlight.of(lineNo) });
}

// Elements
const landingPage = document.getElementById('landing-page');
const loginOverlay = document.getElementById('login-overlay');
const layoutContainer = document.getElementById('layout-container');
const btnLogin = document.getElementById('btn-login');
const loginError = document.getElementById('login-error');

// --- 1. Init Landing Page ---
initLandingPage(() => {
    // When "Launch App" or "Sign In" is clicked from landing page:
    landingPage.style.display = 'none';
    if (currentUser) {
        loginOverlay.style.display = 'none';
        layoutContainer.style.display = 'flex';
    } else {
        loginOverlay.style.display = 'flex';
        layoutContainer.style.display = 'none';
    }
});

// Auth Flow
let lastAuthError = null;

onAuthChange(async (user, error) => {
    if (error) {
        console.error(error);
        lastAuthError = error.message;
        loginError.innerText = error.message;
        btnLogin.innerText = "Sign in with Google";
        btnLogin.disabled = false;
        return;
    }
    
    currentUser = user;
    const navBtnAuth = document.getElementById('nav-btn-auth');
    
    if (user && !isAppInitialized) {
        isAppInitialized = true;
        loginError.innerText = "";
        lastAuthError = null;
        
        if (navBtnAuth) {
            navBtnAuth.innerText = "Log Out";
            navBtnAuth.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                logoutUser().then(() => window.location.reload());
            };
        }
        
        // Save to Sanity
        await saveUserEmail(user.email);
        
        // Hide landing page and login, show app
        landingPage.style.display = 'none';
        loginOverlay.style.display = 'none';
        layoutContainer.style.display = 'flex';

        // Initialize App
        await initApp();

        // Trigger resize calculation
        setTimeout(handleResize, 100);
    } else if (!user) {
        // Not logged in
        if (navBtnAuth) {
            navBtnAuth.innerText = "Sign In";
            navBtnAuth.onclick = null; // Revert to default behavior
        }
        loginOverlay.style.display = 'flex';
        layoutContainer.style.display = 'none';
        btnLogin.innerText = "Sign in with Google";
        btnLogin.disabled = false;

        // Preserve the error message if we just kicked them out
        if (lastAuthError) {
            loginError.innerText = lastAuthError;
        }
    }
});

btnLogin.addEventListener('click', async () => {
    loginError.innerText = "";
    lastAuthError = null;
    btnLogin.innerText = "Redirecting...";
    btnLogin.disabled = true;

    try {
        await loginWithGoogle();
    } catch (error) {
        console.error(error);
        loginError.innerText = error.message;
        btnLogin.innerText = "Sign in with Google";
        btnLogin.disabled = false;
    }
});

function handleResize() {
    if (!canvasContainer) return;
    const w = canvasContainer.clientWidth || window.innerWidth;
    const h = canvasContainer.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

window.addEventListener('resize', handleResize);

async function initApp() {
    // Fetch Questions from Sanity
    activeQuestions = await fetchQuestions();
    
    if (!activeQuestions || activeQuestions.length === 0) {
        console.log("Using local fallback questions.");
        activeQuestions = fallbackQuestions;
    }

    // Populate Select
    selectEl.innerHTML = "";
    activeQuestions.forEach((q, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = q.title;
        selectEl.appendChild(opt);
    });

    // Init Editor
    if (!editor) {
        editor = new EditorView({
            state: EditorState.create({
                doc: "",
                extensions: [basicSetup, python(), lineHighlightField]
            }),
            parent: document.getElementById('editor-container')
        });
    }

    selectEl.addEventListener('change', () => {
        loadQuestion(activeQuestions[selectEl.value]);
    });

    // Load first question
    if (activeQuestions.length > 0) {
        loadQuestion(activeQuestions[0]);
    }

    // Init Pyodide in background
    btnRun.innerText = "Loading Pyodide...";
    btnRun.disabled = true;
    try {
        await codeRunner.init();
        btnRun.innerText = "Run Code";
        btnRun.disabled = false;
    } catch (e) {
        errorMsg.innerText = "Failed to load Pyodide. Check console.";
    }

    btnRun.addEventListener('click', runUserCode);
    btnReset.addEventListener('click', () => {
        btnNext.style.display = 'none';
        btnRun.style.display = 'block';
        btnRun.innerText = "Run Code";
        btnRun.disabled = false;
        
        document.getElementById('editor-container').style.display = 'block';
        document.getElementById('solution-stepper').style.display = 'none';
        document.getElementById('code-header-title').innerText = "Python Editor";
        stepperMode = 'USER';
        
        highlightLine(0);
        if (currentQuestion) loadQuestion(currentQuestion);
    });
    
    btnNext.addEventListener('click', handleNextStep);

    btnSolution.addEventListener('click', () => {
        if (currentQuestion && currentQuestion.generateSolutionSteps) {
            document.getElementById('editor-container').style.display = 'none';
            document.getElementById('solution-stepper').style.display = 'flex';
            document.getElementById('code-header-title').innerText = "Solution Walkthrough";
            
            btnRun.style.display = 'none';
            btnNext.style.display = 'block';
            btnNext.innerText = "Start Solution ➔";
            btnNext.disabled = false;
            
            // Reset scene
            if (vAPI.isPlaying) vAPI.stop();
            currentQuestion.setupScene(vAPI);
            vAPI.actionQueue.forEach(a => vAPI.playAction(a));
            vAPI.actionQueue = []; // clear so we don't replay setup
            
            currentSolutionSteps = currentQuestion.generateSolutionSteps();
            currentSolutionStepIdx = -1;
            stepperMode = 'SOLUTION';
            
            // Initial slide text
            document.getElementById('step-title').innerText = "Solution Simulation";
            document.getElementById('step-desc').innerText = "Click Start Solution to walk through the steps.";
            document.getElementById('step-code').innerText = "# Ready to begin";
        } else {
            errorMsg.innerText = "No solution steps available for this question.";
        }
    });

    if (btnFullscreen) {
        const codeContainer = document.querySelector('.code-container');
        btnFullscreen.addEventListener('click', () => {
            codeContainer.classList.toggle('fullscreen-editor');
            if (codeContainer.classList.contains('fullscreen-editor')) {
                btnFullscreen.innerText = "✕";
            } else {
                btnFullscreen.innerText = "⛶";
            }
        });
    }
}

function loadQuestion(q) {
    currentQuestion = q;
    titleEl.innerText = q.title;
    descEl.innerText = q.description;
    errorMsg.innerText = "";
    
    // Update Editor
    const newState = EditorState.create({
        doc: q.initialCode,
        extensions: [basicSetup, python()]
    });
    editor.setState(newState);

// Setup 3D Scene
    if (vAPI.isPlaying) vAPI.stop();
    q.setupScene(vAPI);
    vAPI.actionQueue.forEach(a => vAPI.playAction(a));
    highlightLine(0);
}

let traceSteps = [];
let currentStepIdx = -1;
let autoVarBlocks = {};
let lastQLen = 0;

let stepperMode = 'USER';
let currentSolutionSteps = [];
let currentSolutionStepIdx = -1;

async function runUserCode() {
    if (!currentQuestion) return;
    if (vAPI.isPlaying) return;

    errorMsg.innerText = "";
    btnRun.disabled = true;
    btnRun.innerText = "Running...";

    // Reset scene to initial state before running
    currentQuestion.setupScene(vAPI);
    highlightLine(0);
    
    // Instantly play setup actions in parallel so they are visible
    await Promise.all(vAPI.actionQueue.map(a => vAPI.playAction(a)));

    const code = editor.state.doc.toString();
    const result = await codeRunner.runCode(code);

    if (result.success && result.steps) {
        traceSteps = result.steps;
        if (traceSteps.length > 0) {
            currentStepIdx = -1;
            lastQLen = vAPI.actionQueue.length;
            autoVarBlocks = {};
            
            btnRun.style.display = 'none';
            btnNext.style.display = 'block';
            btnNext.disabled = false;
            btnNext.innerText = "Start Stepping ➔";
        } else {
            btnRun.innerText = "Run Code";
            btnRun.disabled = false;
        }
    } else {
        errorMsg.innerText = result.error || "Failed to run code.";
        btnRun.innerText = "Run Code";
        btnRun.disabled = false;
    }
}

async function handleNextStep() {
    btnNext.disabled = true;
    
    if (stepperMode === 'SOLUTION') {
        currentSolutionStepIdx++;
        if (currentSolutionStepIdx >= currentSolutionSteps.length) {
            btnNext.innerText = "Done!";
            return;
        }
        
        btnNext.innerText = "Next Step ➔";
        const step = currentSolutionSteps[currentSolutionStepIdx];
        
        document.getElementById('step-title').innerText = `Step ${currentSolutionStepIdx + 1} of ${currentSolutionSteps.length}`;
        document.getElementById('step-desc').innerText = step.desc;
        document.getElementById('step-code').innerText = step.code;
        
        // Execute manual animations for this step
        vAPI.actionQueue = [];
        step.animate(vAPI);
        for (let a of vAPI.actionQueue) {
            await vAPI.playAction(a);
        }
        
        btnNext.disabled = false;
        return;
    }
    
    currentStepIdx++;
    
    if (currentStepIdx >= traceSteps.length) {
        // We reached the end
        if (lastQLen < vAPI.actionQueue.length) {
            const actions = vAPI.actionQueue.slice(lastQLen);
            for (let a of actions) await vAPI.playAction(a);
        }
        btnNext.innerText = "Done!";
        highlightLine(0);
        return;
    }
    
    const step = traceSteps[currentStepIdx];
    highlightLine(step.line);
    
    // Play any actions from previous steps
    const actions = vAPI.actionQueue.slice(lastQLen, step.q_len);
    lastQLen = step.q_len;
    for (let a of actions) {
        await vAPI.playAction(a);
    }
    
    // Auto-variables
    const newLocals = step.locals;
    const varPromises = [];
    let x = -5, y = -3;
    for (const [k, v] of Object.entries(newLocals)) {
        if (!autoVarBlocks[k]) {
            const bId = `auto_${k}`;
            autoVarBlocks[k] = { id: bId, val: v };
            varPromises.push(vAPI.playAction({ type: 'SPAWN', id: bId, value: `${k} = ${v}`, colorKey: "ORANGE", x, y, z: 0, delay: 0 }));
        } else if (autoVarBlocks[k].val !== v) {
            autoVarBlocks[k].val = v;
            varPromises.push(vAPI.playAction({ type: 'UPDATE', id: autoVarBlocks[k].id, newValue: `${k} = ${v}`, colorKey: "YELLOW", delay: 0 }));
        }
        x += 3.5;
        if (x > 5) { x = -5; y -= 1.8; }
    }
    await Promise.all(varPromises);
    
    btnNext.innerText = "Next Step ➔";
    btnNext.disabled = false;
}
