import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';

import { VisualizerAPI } from './src/VisualizerAPI.js';
import { CodeRunner } from './src/CodeRunner.js';
import { questions as fallbackQuestions } from './src/questions.js';
import { loginWithGoogle, onAuthChange } from './src/firebase.js';
import { fetchQuestions, saveUserEmail } from './src/sanity.js';
import { initLandingPage } from './src/landing.js';

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

const selectEl = document.getElementById('question-select');
const titleEl = document.getElementById('question-title');
const descEl = document.getElementById('question-desc');
const errorMsg = document.getElementById('error-msg');
const btnRun = document.getElementById('btn-run');
const btnReset = document.getElementById('btn-reset');

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
    loginOverlay.style.display = 'flex';
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
    
    if (user && !isAppInitialized) {
        isAppInitialized = true;
        loginError.innerText = "";
        lastAuthError = null;
        
        // Save to Sanity
        await saveUserEmail(user.email);
        
        // Hide login, show app
        loginOverlay.style.display = 'none';
        layoutContainer.style.display = 'flex';

        // Initialize App
        await initApp();

        // Trigger resize calculation
        setTimeout(handleResize, 100);
    } else if (!user) {
        // Not logged in
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
                extensions: [basicSetup, python()]
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

    // Events
    btnRun.addEventListener('click', runUserCode);
    btnReset.addEventListener('click', () => {
        if (currentQuestion) loadQuestion(currentQuestion);
    });
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
}

async function runUserCode() {
    if (!currentQuestion) return;
    if (vAPI.isPlaying) return;

    errorMsg.innerText = "";
    btnRun.disabled = true;
    btnRun.innerText = "Running...";

    // Reset scene to initial state before running
    currentQuestion.setupScene(vAPI);

    const code = editor.state.doc.toString();
    const result = await codeRunner.runCode(code);

    if (result.success) {
        // Play animations
        btnRun.innerText = "Visualizing...";
        await vAPI.play(() => {
            btnRun.innerText = "Run Code";
            btnRun.disabled = false;
        });
    } else {
        errorMsg.innerText = result.error;
        btnRun.innerText = "Run Code";
        btnRun.disabled = false;
    }
}
