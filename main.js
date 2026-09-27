/**
 * main.js — ProViz App Orchestrator
 *
 * Wires together:
 *  - Three.js scene
 *  - PythonExecutor (Pyodide)
 *  - TraceTransformer
 *  - PlaybackEngine
 *  - ExplanationEngine
 *  - BaseVisualizer / VariableVisualizer / ArrayVisualizer / CallStackVisualizer
 *  - Question registry
 *  - Auth (Firebase) + Question sync (Sanity)
 *  - CodeMirror editor
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EditorState, StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';

import { PythonExecutor }    from './src/engine/PythonExecutor.js';
import { TraceTransformer }  from './src/engine/TraceTransformer.js';
import { createExecutionRequest } from './src/trace/ExecutionRequest.js';
import { PlaybackEngine }    from './src/PlaybackEngine.js';
import { ExplanationEngine } from './src/ExplanationEngine.js';
import { BaseVisualizer }    from './src/visualizers/BaseVisualizer.js';
import { VariableVisualizer }  from './src/visualizers/VariableVisualizer.js';
import { ArrayVisualizer }   from './src/visualizers/ArrayVisualizer.js';
import { CallStackVisualizer } from './src/visualizers/CallStackVisualizer.js';
import { questions }         from './src/questions/registry.js';
import { initLandingPage }   from './src/landing.js';
import { onAuthChange, loginWithGoogle, logoutUser } from './src/firebase.js';
import { fetchQuestions, saveUserEmail } from './src/sanity.js';

// Scratchpad configuration for Freeform Python execution
const SCRATCHPAD_OPTION = {
    id: '__scratchpad__',
    title: '✨ Freeform Scratchpad (Custom Code)',
    description: 'Write, execute, and step through arbitrary Python code in 3D. Variables, loops, branches, and call stacks are traced automatically.',
    isScratchpad: true,
    starter_code: `# Write any Python code here
x = 10
y = 20
total = x + y
print(f"Total is: {total}")
`,
    visualization: {
        primary_visualizer: 'variables',
        tracked_variables: [],
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Three.js Scene Setup
// ─────────────────────────────────────────────────────────────────────────────

const canvas = document.querySelector('#app-canvas');
const scene  = new THREE.Scene();
scene.background = new THREE.Color('#0f172a');

const canvasContainer = document.getElementById('canvas-container');
const getContainerSize = () => ({
    w: canvasContainer ? canvasContainer.clientWidth  : window.innerWidth,
    h: canvasContainer ? canvasContainer.clientHeight : window.innerHeight,
});

const { w: initW, h: initH } = getContainerSize();
const camera = new THREE.PerspectiveCamera(45, initW / initH, 0.1, 100);
camera.position.set(0, 0, 16);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(initW, initH);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

const group = new THREE.Group();
scene.add(group);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    const { w, h } = getContainerSize();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});

// ─────────────────────────────────────────────────────────────────────────────
// Engine Instances
// ─────────────────────────────────────────────────────────────────────────────

const baseVis    = new BaseVisualizer(scene, group);
const varViz     = new VariableVisualizer(scene, group);
const arrayViz   = new ArrayVisualizer(scene, group);
const callStackViz = new CallStackVisualizer(document.getElementById('call-stack-container'));
const executor   = new PythonExecutor();
const transformer = new TraceTransformer();
const playback   = new PlaybackEngine();
const explainer  = new ExplanationEngine();

// ─────────────────────────────────────────────────────────────────────────────
// CodeMirror Setup
// ─────────────────────────────────────────────────────────────────────────────

const addLineHighlight = StateEffect.define();
const lineHighlightField = StateField.define({
    create() { return Decoration.none; },
    update(lines, tr) {
        lines = lines.map(tr.changes);
        for (const e of tr.effects) {
            if (e.is(addLineHighlight)) {
                lines = Decoration.none;
                if (e.value > 0 && e.value <= tr.state.doc.lines) {
                    lines = lines.update({
                        add: [Decoration.line({ class: 'cm-highlightLine' })
                              .range(tr.state.doc.line(e.value).from)],
                    });
                }
            }
        }
        return lines;
    },
    provide: f => EditorView.decorations.from(f),
});

let editor;

function highlightLine(lineNo) {
    if (!editor) return;
    editor.dispatch({ effects: addLineHighlight.of(lineNo) });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM References
// ─────────────────────────────────────────────────────────────────────────────

const landingPage     = document.getElementById('landing-page');
const loginOverlay    = document.getElementById('login-overlay');
const layoutContainer = document.getElementById('layout-container');
const btnLogin        = document.getElementById('btn-login');
const loginError      = document.getElementById('login-error');

const navBtnSignIn      = document.getElementById('nav-btn-signin');
const navUserProfile   = document.getElementById('nav-user-profile');
const navUserAvatar     = document.getElementById('nav-user-avatar');
const navUserEmail      = document.getElementById('nav-user-email');
const navBtnLogout      = document.getElementById('nav-btn-logout');
const btnLogoutSidebar  = document.getElementById('btn-logout-sidebar');
const sidebarUserPill   = document.getElementById('sidebar-user-pill');
const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
const sidebarUserEmail  = document.getElementById('sidebar-user-email');

const selectEl        = document.getElementById('question-select');
const titleEl         = document.getElementById('question-title');
const descEl          = document.getElementById('question-desc');
const errorMsg        = document.getElementById('error-msg');

const btnRun          = document.getElementById('btn-run');
const btnReset        = document.getElementById('btn-reset');
const btnNext         = document.getElementById('btn-next');
const btnPrev         = document.getElementById('btn-prev');
const btnPlayPause    = document.getElementById('btn-play-pause');
const btnRestart      = document.getElementById('btn-restart');
const speedSlider     = document.getElementById('speed-slider');
const speedLabel      = document.getElementById('speed-label');
const pbCounter       = document.getElementById('pb-counter');
const pbBarFill       = document.getElementById('pb-bar-fill');

const playbackControls = document.getElementById('playback-controls');
const callStackPanel   = document.getElementById('call-stack-panel');
const expBadges        = document.getElementById('exp-badges');
const expPrimary       = document.getElementById('exp-primary');
const expSecondary     = document.getElementById('exp-secondary');

const tabUser     = document.getElementById('tab-user');
const tabSolution = document.getElementById('tab-solution');
const codeHeaderTitle = document.getElementById('code-header-title');

// ─────────────────────────────────────────────────────────────────────────────
// App State
// ─────────────────────────────────────────────────────────────────────────────

let currentQuestion   = null;
let activeMode        = 'user';      // 'user' | 'solution'
let isAppInitialized  = false;
let currentUser       = null;
let lastAuthError     = null;
let allQuestions      = [];
let isPlayingBack     = false;

// ─────────────────────────────────────────────────────────────────────────────
// Landing Page + Auth
// ─────────────────────────────────────────────────────────────────────────────

function updateAuthUI(user) {
    if (user) {
        const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
        const email = user.email || '';

        if (navBtnSignIn) navBtnSignIn.style.display = 'none';
        if (navUserProfile) navUserProfile.style.display = 'flex';
        if (navUserAvatar) navUserAvatar.textContent = initial;
        if (navUserEmail) navUserEmail.textContent = email;

        if (sidebarUserPill) sidebarUserPill.style.display = 'flex';
        if (sidebarUserAvatar) sidebarUserAvatar.textContent = initial;
        if (sidebarUserEmail) sidebarUserEmail.textContent = email;
    } else {
        if (navBtnSignIn) navBtnSignIn.style.display = 'inline-flex';
        if (navUserProfile) navUserProfile.style.display = 'none';
        if (sidebarUserPill) sidebarUserPill.style.display = 'none';
    }
}

async function handleLogout(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    try {
        await logoutUser();
    } catch (err) {
        console.warn('[Auth] logout error:', err);
    }
    currentUser = null;
    updateAuthUI(null);
    window.location.reload();
}

if (navBtnLogout) {
    navBtnLogout.addEventListener('click', handleLogout);
}

if (btnLogoutSidebar) {
    btnLogoutSidebar.addEventListener('click', handleLogout);
}

if (navBtnSignIn) {
    navBtnSignIn.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginError) loginError.innerText = '';
        if (loginOverlay) loginOverlay.style.display = 'flex';
    });
}

initLandingPage(() => {
    landingPage.style.display = 'none';
    if (currentUser) {
        loginOverlay.style.display = 'none';
        layoutContainer.style.display = 'flex';
    } else {
        loginOverlay.style.display = 'flex';
        layoutContainer.style.display = 'none';
    }
});

onAuthChange(async (user, error) => {
    if (error) {
        lastAuthError = error.message;
        if (loginError) loginError.innerText = error.message;
        if (btnLogin) { btnLogin.innerText = 'Sign in with Google'; btnLogin.disabled = false; }
        return;
    }

    currentUser = user;
    updateAuthUI(user);

    if (user && !isAppInitialized) {
        isAppInitialized = true;
        if (loginError) loginError.innerText = '';
        lastAuthError = null;

        try { await saveUserEmail(user.email); } catch (e) { console.warn('[Auth] saveUserEmail failed:', e.message); }
        console.log('[Auth] User logged in, showing app...');
        landingPage.style.display = 'none';
        loginOverlay.style.display = 'none';
        layoutContainer.style.display = 'flex';
        await initApp();
        console.log('[Auth] initApp complete');
        setTimeout(() => {
            const { w, h } = getContainerSize();
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }, 100);
    } else if (!user) {
        if (btnLogin) { btnLogin.innerText = 'Sign in with Google'; btnLogin.disabled = false; }
        if (loginError && lastAuthError) loginError.innerText = lastAuthError;
    }
});

if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        if (loginError) loginError.innerText = '';
        lastAuthError = null;
        btnLogin.innerText = 'Redirecting...';
        btnLogin.disabled = true;
        try {
            await loginWithGoogle();
        } catch (err) {
            if (loginError) loginError.innerText = err.message;
            btnLogin.innerText = 'Sign in with Google';
            btnLogin.disabled = false;
        }
    });
}

// Back-to-home buttons
document.querySelectorAll('.btn-back-home').forEach(btn => {
    btn.addEventListener('click', () => {
        landingPage.style.display = 'block';
        loginOverlay.style.display = 'none';
        layoutContainer.style.display = 'none';
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// App Initialization
// ─────────────────────────────────────────────────────────────────────────────

async function initApp() {
    // Load questions (Sanity first, local fallback)
    let sanityQs = [];
    try { sanityQs = await fetchQuestions(); } catch (e) { /* ignore */ }
    const fetchedOrLocal = (sanityQs && sanityQs.length > 0) ? sanityQs : questions;
    // Scratchpad is the first option for freeform execution
    allQuestions = [SCRATCHPAD_OPTION, ...fetchedOrLocal];

    // Populate selector
    selectEl.innerHTML = '';
    allQuestions.forEach((q, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = q.isScratchpad ? q.title : `${q.difficulty ? `[${q.difficulty.toUpperCase()}] ` : ''}${q.title}`;
        selectEl.appendChild(opt);
    });

    selectEl.addEventListener('change', () => loadQuestion(allQuestions[selectEl.value]));

    // Init CodeMirror
    if (!editor) {
        editor = new EditorView({
            state: EditorState.create({ doc: '', extensions: [basicSetup, python(), lineHighlightField] }),
            parent: document.getElementById('editor-container'),
        });
    }

    // Mode tabs
    tabUser?.addEventListener('click', () => switchMode('user'));
    tabSolution?.addEventListener('click', () => switchMode('solution'));

    // Init Pyodide
    btnRun.innerText = '⏳ Loading Python...';
    btnRun.disabled = true;
    try {
        await executor.init();
        btnRun.innerText = '▶ Run Code';
        btnRun.disabled = false;
    } catch (e) {
        errorMsg.innerText = 'Failed to load Pyodide. Check network.';
    }

    // Wire buttons
    btnRun.addEventListener('click', runCode);
    btnReset.addEventListener('click', doReset);
    btnNext.addEventListener('click', () => { playback.nextFrame(); });
    btnPrev.addEventListener('click', () => { playback.prevFrame(); });
    btnPlayPause.addEventListener('click', togglePlayPause);
    btnRestart.addEventListener('click', () => {
        playback.restart();
        updateUI(null);
        setupScene(currentQuestion);
    });

    speedSlider?.addEventListener('input', () => {
        const ms = parseInt(speedSlider.value);
        playback.setSpeed(ms);
        speedLabel.innerText = `${(ms / 1000).toFixed(1)}s`;
    });

    // Fullscreen toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            const cc = document.querySelector('.code-container');
            cc.classList.toggle('fullscreen-editor');
            btnFullscreen.innerText = cc.classList.contains('fullscreen-editor') ? '✕' : '⛶';
        });
    }

    // Playback engine listener
    playback.onFrameChange((frame, event) => {
        if (event === 'restart' || event === 'reset') {
            updateUI(null);
            return;
        }
        if (event === 'end') {
            if (btnPlayPause) btnPlayPause.innerText = '▶ Play';
            isPlayingBack = false;
            return;
        }
        if (frame) renderFrame(frame);
    });

    // Load first item (Scratchpad)
    if (allQuestions.length > 0) loadQuestion(allQuestions[0]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Question Loading
// ─────────────────────────────────────────────────────────────────────────────

function loadQuestion(q) {
    currentQuestion = q || SCRATCHPAD_OPTION;
    titleEl.innerText = currentQuestion.title;
    descEl.innerText = currentQuestion.description;
    errorMsg.innerText = '';

    if (currentQuestion.isScratchpad) {
        if (tabSolution) tabSolution.style.display = 'none';
        switchMode('user');
    } else {
        if (tabSolution) tabSolution.style.display = 'inline-block';
    }

    const code = activeMode === 'user'
        ? (currentQuestion.starter_code || currentQuestion.initialCode || '')
        : (currentQuestion.solution_code || '');
    const newState = EditorState.create({ doc: code, extensions: [basicSetup, python(), lineHighlightField] });
    editor.setState(newState);

    doReset();
}

function setupScene(q) {
    baseVis.clearAll();
    varViz.reset();
    arrayViz.clearAll();
    callStackViz.reset();

    // Let question configure initial scene if provided
    if (q && q.visualization?.initial_scene) {
        const ctx = { baseVis, varViz, arrayViz };
        q.visualization.initial_scene(ctx);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode Switching
// ─────────────────────────────────────────────────────────────────────────────

function switchMode(mode) {
    activeMode = mode;
    tabUser?.classList.toggle('mode-tab--active', mode === 'user');
    tabSolution?.classList.toggle('mode-tab--active', mode === 'solution');

    const q = currentQuestion || SCRATCHPAD_OPTION;
    const code = mode === 'user'
        ? (q.starter_code || q.initialCode || '')
        : (q.solution_code || '# No solution code for freeform scratchpad.\n');
    const newState = EditorState.create({ doc: code, extensions: [basicSetup, python(), lineHighlightField] });
    editor.setState(newState);

    codeHeaderTitle.innerText = mode === 'user' ? 'Python Editor' : '💡 Solution Code (Read-Only)';
    doReset();
}

// ─────────────────────────────────────────────────────────────────────────────
// Code Execution
// ─────────────────────────────────────────────────────────────────────────────

async function runCode() {
    errorMsg.innerText = '';
    btnRun.disabled = true;
    btnRun.innerText = '⏳ Running...';

    // Setup the scene (handles both problem mode and freeform scratchpad)
    setupScene(currentQuestion);

    const code = editor ? editor.state.doc.toString() : '';
    const isProblem = currentQuestion && !currentQuestion.isScratchpad;
    const request = createExecutionRequest({
        code,
        language: 'python',
        context: isProblem ? {
            problemId: currentQuestion.id,
            visualization: currentQuestion.visualization,
        } : null,
    });

    let trace;
    try {
        trace = await executor.execute(request);
    } catch (e) {
        errorMsg.innerText = `Execution error: ${e.message}`;
        btnRun.innerText = '▶ Run Code';
        btnRun.disabled = false;
        return;
    }

    if (trace.result?.error && (!trace.events || trace.events.length === 0)) {
        const err = trace.result.error;
        errorMsg.innerText = `${err.type}: ${err.message}${err.line ? ` (line ${err.line})` : ''}`;
        btnRun.innerText = '▶ Run Code';
        btnRun.disabled = false;
        return;
    }

    // Transform UET trace → visualization frames
    const frames = transformer.transform(trace, currentQuestion?.visualization || {});

    if (frames.length === 0) {
        errorMsg.innerText = 'No trace events captured. Did your code run any statements?';
        btnRun.innerText = '▶ Run Code';
        btnRun.disabled = false;
        return;
    }

    // Load trace into playback engine with StateReconstructor & checkpoints
    playback.setFrames(trace, currentQuestion?.visualization || {});

    // Show playback controls
    playbackControls.style.display = 'block';
    const hasRecursion = frames.some(f => f.event_type === 'call' || f.event_type === 'return');
    callStackPanel.style.display = hasRecursion ? 'block' : 'none';

    btnRun.innerText = '▶ Run Code';
    btnRun.disabled = false;

    // Auto-play visualization immediately!
    isPlayingBack = true;
    if (btnPlayPause) btnPlayPause.innerText = '⏸ Pause';
    playback.play();
}

// ─────────────────────────────────────────────────────────────────────────────
// Frame Rendering
// ─────────────────────────────────────────────────────────────────────────────

let _renderBusy = false;

async function renderFrame(frame) {
    if (!frame) return;

    // Update CodeMirror line highlight
    if (frame.current_line) highlightLine(frame.current_line);

    // Update explanation panel
    updateUI(frame);

    // Update call stack
    callStackViz.consumeFrame(frame);

    // Update 3D visualizers (don't block on these — fire and forget)
    if (!_renderBusy) {
        _renderBusy = true;
        try {
            // Variable visualizer
            await varViz.consumeFrame(frame);
            // Array visualizer pointer tracking
            const trackedVars = currentQuestion?.visualization?.tracked_variables || [];
            if (trackedVars.length > 0 && arrayViz) {
                await arrayViz.consumeFrame(frame, trackedVars.filter(v =>
                    ['i', 'j', 'left', 'right', 'mid', 'idx'].includes(v)
                ));
            }
        } catch (e) {
            // Visualization errors should never crash the app
            console.warn('[renderFrame] Visualization error:', e);
        }
        _renderBusy = false;
    }

    // Update playback progress UI
    const progress = playback.getProgress();
    if (pbCounter) pbCounter.innerText = `${progress.current} / ${progress.total}`;
    if (pbBarFill) pbBarFill.style.width = `${progress.percent}%`;
    if (btnNext) btnNext.disabled = playback.isAtEnd;
    if (btnPrev) btnPrev.disabled = playback.isAtStart;
}

function updateUI(frame) {
    if (!frame) {
        expBadges.innerHTML = '<span class="exp-badge exp-badge--idle">Idle</span>';
        expPrimary.innerText = 'Run your code to start the visualization.';
        expSecondary.innerText = '';
        highlightLine(0);
        if (pbCounter) pbCounter.innerText = '0 / 0';
        if (pbBarFill) pbBarFill.style.width = '0%';
        return;
    }

    const { primary, secondary, badges } = explainer.explain(frame);
    expPrimary.innerText = primary;
    expSecondary.innerText = secondary;

    const badgeClass = {
        'call': 'exp-badge--call',
        'return': 'exp-badge--return',
        'exception': 'exp-badge--error',
    }[frame.event_type] || 'exp-badge--assign';

    expBadges.innerHTML = badges.length > 0
        ? badges.map(b => `<span class="exp-badge ${badgeClass}">${b}</span>`).join('')
        : `<span class="exp-badge ${badgeClass}">Line ${frame.current_line}</span>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Playback Controls
// ─────────────────────────────────────────────────────────────────────────────

function togglePlayPause() {
    if (isPlayingBack) {
        playback.pause();
        isPlayingBack = false;
        if (btnPlayPause) btnPlayPause.innerText = '▶ Play';
    } else {
        isPlayingBack = true;
        if (btnPlayPause) btnPlayPause.innerText = '⏸ Pause';
        playback.play();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────────────────────────────────────

function doReset() {
    playback.pause();
    isPlayingBack = false;
    playback.setFrames([]);
    playbackControls.style.display = 'none';
    callStackPanel.style.display = 'none';
    if (btnPlayPause) btnPlayPause.innerText = '▶ Play';

    updateUI(null);
    highlightLine(0);
    if (currentQuestion) setupScene(currentQuestion);
}
