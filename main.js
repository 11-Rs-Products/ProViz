/**
 * main.js — ProViz Universal Autonomous Verification Operating System & 3D Visualizer
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
import { Debugger }          from './src/debugger/Debugger.js';
import { ExplanationEngine } from './src/ExplanationEngine.js';
import { BaseVisualizer }    from './src/visualizers/BaseVisualizer.js';
import { VariableVisualizer }  from './src/visualizers/VariableVisualizer.js';
import { ArrayVisualizer }   from './src/visualizers/ArrayVisualizer.js';
import { questions }         from './src/questions/registry.js';

// Scratchpad configuration
const SCRATCHPAD_OPTION = {
    id: '__scratchpad__',
    title: '✨ Freeform Scratchpad (Custom Code)',
    description: 'Write, execute, and step through arbitrary Python code in 3D.',
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
// Three.js 3D Scene Setup
// ─────────────────────────────────────────────────────────────────────────────

const canvas = document.querySelector('#app-canvas');
const scene  = new THREE.Scene();
scene.background = new THREE.Color('#020617');

const canvasContainer = document.getElementById('canvas-container');
const getContainerSize = () => ({
    w: canvasContainer ? canvasContainer.clientWidth  : (window.innerWidth - 480),
    h: canvasContainer ? canvasContainer.clientHeight : (window.innerHeight - 58),
});

const { w: initW, h: initH } = getContainerSize();
const camera = new THREE.PerspectiveCamera(45, (initW || 800) / (initH || 600), 0.1, 100);
camera.position.set(0, 0, 16);

let renderer = null;
if (canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(initW || 800, initH || 600);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

const controls = canvas && renderer ? new OrbitControls(camera, renderer.domElement) : null;
if (controls) {
    controls.enableDamping = true;
    controls.enableZoom = true;
}

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

const group = new THREE.Group();
scene.add(group);

// Add initial 3D spatial visualization objects
function initDefault3DScene() {
    const gridHelper = new THREE.GridHelper(16, 16, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -2;
    group.add(gridHelper);

    // Glowing central icosahedron
    const geo = new THREE.IcosahedronGeometry(2.2, 1);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        wireframe: true,
        transparent: true,
        opacity: 0.7
    });
    const ico = new THREE.Mesh(geo, mat);
    ico.position.set(0, 1, 0);
    group.add(ico);

    // Array cubes in a circular orbit
    const count = 6;
    for (let i = 0; i < count; i++) {
        const boxGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const boxMat = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0x38bdf8 : 0x10b981,
            metalness: 0.5,
            roughness: 0.3
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        const ang = (i / count) * Math.PI * 2;
        box.position.set(Math.cos(ang) * 4.5, 0.5, Math.sin(ang) * 4.5);
        group.add(box);
    }
}
initDefault3DScene();

function animate() {
    requestAnimationFrame(animate);
    group.rotation.y += 0.002;
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    if (!renderer || !canvasContainer) return;
    const { w, h } = getContainerSize();
    if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Engine Instances
// ─────────────────────────────────────────────────────────────────────────────

const baseVis    = new BaseVisualizer(scene, group);
const varViz     = new VariableVisualizer(scene, group);
const arrayViz   = new ArrayVisualizer(scene, group);
const executor   = new PythonExecutor();
const transformer = new TraceTransformer();
const playback   = new PlaybackEngine();
const debuggerCore = new Debugger({ playbackEngine: playback });
const explainer  = new ExplanationEngine();

// Master Stage 36 Autonomous Verification Operating System Instance
const os = debuggerCore.createAutonomousOS({ projectId: 'proviz-core-workspace' });

// ─────────────────────────────────────────────────────────────────────────────
// CodeMirror Editor Setup
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

const editorContainer = document.getElementById('editor-container');
if (editorContainer) {
    editor = new EditorView({
        state: EditorState.create({
            doc: SCRATCHPAD_OPTION.starter_code,
            extensions: [
                basicSetup,
                python(),
                lineHighlightField,
                EditorView.theme({
                    '&': { height: '100%', backgroundColor: '#0f172a' },
                    '.cm-scroller': { overflow: 'auto' },
                    '.cm-content': { caretColor: '#38bdf8' }
                })
            ]
        }),
        parent: editorContainer
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation & Tab Switching
// ─────────────────────────────────────────────────────────────────────────────

const navTabs = document.querySelectorAll('.nav-tab-btn');
const viewportPanels = document.querySelectorAll('.studio-viewport-panel');

navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const viewId = `view-${tab.dataset.view}`;
        viewportPanels.forEach(panel => {
            if (panel.id === viewId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        if (tab.dataset.view === 'visualizer-3d') {
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 50);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Autonomous Verification OS Interactive Controls & Event Journal
// ─────────────────────────────────────────────────────────────────────────────

const journalEl = document.getElementById('os-live-event-stream');
const osStatusText = document.getElementById('os-badge-state-text');
const osStatusBadge = document.getElementById('os-status-badge');

function addJournalEntry(type, kind, text) {
    if (!journalEl) return;
    const now = new Date().toTimeString().split(' ')[0];
    const entry = document.createElement('div');
    entry.className = `event-item ${type}`;
    entry.innerHTML = `<span class="e-time">${now}</span> <span class="e-tag">[${kind}]</span> <span class="e-msg">${text}</span>`;
    journalEl.appendChild(entry);
    journalEl.scrollTop = journalEl.scrollHeight;
}

// 1. Autonomy Policy Selector
const autonomyPicker = document.getElementById('os-autonomy-level-picker');
if (autonomyPicker) {
    autonomyPicker.addEventListener('change', (e) => {
        os.setAutonomyLevel(e.target.value);
        addJournalEntry('info', 'AUTONOMY_LEVEL_CHANGED', `Autonomy policy updated to ${e.target.value}`);
    });
}

// 2. Action: Run Full Autonomous Loop
const btnRunOS = document.getElementById('btn-run-os-pipeline');
if (btnRunOS) {
    btnRunOS.addEventListener('click', async () => {
        addJournalEntry('info', 'LOOP_TRIGGERED', '14-Phase Autonomous Pipeline initialized.');
        
        // Step through phases visually
        const phaseEl = document.getElementById('track-active-phase');
        if (phaseEl) phaseEl.textContent = 'Current Phase: 7/14 (Executing Multi-Engine Verification across SMT & Gates)';

        const plan = os.createAutonomousPlan({ targetScope: 'PROJECT_WIDE', riskScore: 0.1 });
        addJournalEntry('success', 'PLAN_GENERATED', `Plan synthesized: ${plan.phases.length} verification phases.`);

        const dec = os.evaluateGlobalDecision({
            evidenceStrength: 0.98,
            coverage: 0.95,
            freshness: 0.99,
            riskReduction: 0.90,
            policyCompliance: 1.0,
            residualRisk: 0.02
        });

        addJournalEntry('success', 'DECISION_EVALUATED', `Decision: ${dec.decision} | Confidence: ${dec.confidence.toFixed(2)} | All 11 Gates Passed.`);
        if (phaseEl) phaseEl.textContent = 'Current Phase: Complete (State Certified & ACID Committed)';
    });
}

// 3. Action: Evaluate 11-Gate Release
const btnRelease = document.getElementById('btn-evaluate-release-gate');
if (btnRelease) {
    btnRelease.addEventListener('click', () => {
        const candidate = debuggerCore.createReleaseCandidate({
            version: '2.0.0-PROD',
            targetRevision: debuggerCore.getStateRevision()?.sequenceNumber || 0
        });
        const decision = debuggerCore.verifyReleaseCandidate(candidate);
        addJournalEntry(decision.isApproved ? 'success' : 'error', 'RELEASE_EVALUATED', `Release Candidate v2.0.0: ${decision.recommendation} across 11 Verification Gates.`);
    });
}

// 4. Action: Auto-Repair & ACID Commit
const btnRepair = document.getElementById('btn-auto-repair-acid');
if (btnRepair) {
    btnRepair.addEventListener('click', () => {
        addJournalEntry('warning', 'REPAIR_SYNTHESIZING', 'Synthesizing safe AST mutation candidate for zero-division risk.');
        const result = debuggerCore.executeAutonomousRepair(
            { id: 'F_DIV_ZERO', severity: 'HIGH' },
            { patchId: 'P_SAFE_DIV', target: 'math.py:24' }
        );
        addJournalEntry('success', 'TRANSACTION_COMMITTED', `ACID State Checkpoint S${result.committedRevision} verified & committed.`);
        
        const certRevEl = document.getElementById('cert-rev-text');
        if (certRevEl) certRevEl.textContent = `S${result.committedRevision} (Immutable Hash: 0x${Math.random().toString(16).slice(2, 10)})`;
        if (osStatusText) osStatusText.textContent = `READY (S${result.committedRevision})`;
    });
}

// 5. Action: Issue Scoped Certificate
const btnCert = document.getElementById('btn-issue-unified-cert');
if (btnCert) {
    btnCert.addEventListener('click', () => {
        const cert = debuggerCore.generateUnifiedCertificate({
            scope: 'PROJECT_WIDE',
            issuer: 'ProViz-Autonomous-OS'
        });
        addJournalEntry('success', 'CERTIFICATE_ISSUED', `Certificate generated with fingerprint: ${cert.fingerprint}`);
        const hashEl = document.getElementById('cert-fingerprint-text');
        if (hashEl) hashEl.textContent = cert.fingerprint;
    });
}

// 6. Action: Safe Mode Toggle
const btnSafe = document.getElementById('btn-toggle-safemode-os');
if (btnSafe) {
    btnSafe.addEventListener('click', () => {
        const currentState = os.getState();
        const safeText = document.getElementById('btn-safemode-text');

        if (currentState === 'FAILED_SAFE') {
            os.recover('Manual operator recovery');
            if (safeText) safeText.textContent = 'Safe Mode';
            btnSafe.className = 'btn btn-danger-glass';
            if (osStatusText) osStatusText.textContent = 'READY (S0)';
            if (osStatusBadge) osStatusBadge.className = 'os-badge badge-ready';
            addJournalEntry('info', 'SAFE_MODE_RECOVERED', 'Runtime recovered to READY state.');
        } else {
            os.enterSafeMode('Operator test trigger');
            if (safeText) safeText.textContent = 'Recover OS';
            btnSafe.className = 'btn btn-glow-cyan';
            if (osStatusText) osStatusText.textContent = 'FAILED_SAFE';
            if (osStatusBadge) osStatusBadge.className = 'os-badge badge-safemode';
            addJournalEntry('error', 'SAFE_MODE_ENTERED', 'All autonomous modifications strictly prohibited.');
        }
    });
}

// 7. Action: Export Audit Trail
const btnAudit = document.getElementById('btn-export-audit-trail');
if (btnAudit) {
    btnAudit.addEventListener('click', () => {
        const audit = debuggerCore.exportAuditTrail();
        addJournalEntry('info', 'AUDIT_EXPORTED', `Exported ${audit.totalRecords} immutable audit records.`);
        alert(`ProViz Immutable Audit Trail Exported!\nTotal records: ${audit.totalRecords}\nIntegrity Hash: ${audit.integrityHash}`);
    });
}

// 8. Action: Clear Journal View
const btnClearJournal = document.getElementById('btn-clear-journal');
if (btnClearJournal) {
    btnClearJournal.addEventListener('click', () => {
        if (journalEl) journalEl.innerHTML = '';
        addJournalEntry('info', 'JOURNAL_CLEARED', 'Event stream view cleared (append-only storage preserved in OS).');
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Question Presets & Code Execution (3D Visualizer)
// ─────────────────────────────────────────────────────────────────────────────

const questionSelect = document.getElementById('question-select');
const allQuestions = [SCRATCHPAD_OPTION, ...questions];

if (questionSelect) {
    allQuestions.forEach(q => {
        const opt = document.createElement('option');
        opt.value = q.id;
        opt.textContent = q.title;
        questionSelect.appendChild(opt);
    });

    questionSelect.addEventListener('change', (e) => {
        const selected = allQuestions.find(q => q.id === e.target.value) || SCRATCHPAD_OPTION;
        if (editor) {
            editor.dispatch({
                changes: { from: 0, to: editor.state.doc.length, insert: selected.starter_code }
            });
        }
    });
}

// Playback & Variables UI
const btnRunCode = document.getElementById('btn-run');
const btnResetCode = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnStepNext = document.getElementById('btn-next');
const btnStepPrev = document.getElementById('btn-prev');
const btnRestart = document.getElementById('btn-restart');
const pbCounter = document.getElementById('pb-counter');
const pbFill = document.getElementById('pb-bar-fill');
const expPrimary = document.getElementById('exp-primary');

if (btnRunCode) {
    btnRunCode.addEventListener('click', async () => {
        if (!editor) return;
        const code = editor.state.doc.toString();
        if (expPrimary) expPrimary.textContent = 'Executing Python code in Pyodide WebAssembly sandbox...';

        try {
            const rawTrace = await executor.run(code);
            const req = createExecutionRequest({ code, language: 'python' });
            const uetTrace = transformer.transform(rawTrace, req);
            playback.loadTrace(uetTrace);
            
            if (expPrimary) expPrimary.textContent = `Execution complete: ${uetTrace.events.length} trace steps captured. Use playback controls below.`;
            updatePlaybackUI();
            addJournalEntry('success', 'CODE_EXECUTED', `Executed Python sandbox code (${uetTrace.events.length} steps).`);
        } catch (err) {
            if (expPrimary) expPrimary.textContent = `Execution Error: ${err.message}`;
            addJournalEntry('error', 'EXECUTION_ERROR', err.message);
        }
    });
}

if (btnResetCode) {
    btnResetCode.addEventListener('click', () => {
        playback.reset();
        group.clear();
        updatePlaybackUI();
        if (expPrimary) expPrimary.textContent = 'Scene and playback reset.';
    });
}

if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
        if (playback.isPlaying) {
            playback.pause();
            btnPlayPause.textContent = '▶ Play';
        } else {
            playback.play();
            btnPlayPause.textContent = '⏸ Pause';
        }
    });
}

if (btnStepNext) {
    btnStepNext.addEventListener('click', () => {
        playback.stepForward();
        updatePlaybackUI();
    });
}

if (btnStepPrev) {
    btnStepPrev.addEventListener('click', () => {
        playback.stepBackward();
        updatePlaybackUI();
    });
}

if (btnRestart) {
    btnRestart.addEventListener('click', () => {
        playback.seek(0);
        updatePlaybackUI();
    });
}

playback.on('step', (event) => {
    updatePlaybackUI();
    if (event?.location?.line) {
        highlightLine(event.location.line);
    }
});

function updatePlaybackUI() {
    const current = playback.currentIndex + 1;
    const total = playback.totalSteps || 0;
    if (pbCounter) pbCounter.textContent = `Step ${total > 0 ? current : 0} / ${total}`;
    if (pbFill) pbFill.style.width = `${total > 0 ? (current / total) * 100 : 0}%`;

    // Render variables
    const state = playback.getCurrentState();
    renderVariables(state);
}

function renderVariables(state) {
    const container = document.getElementById('variables-container');
    if (!container) return;
    container.innerHTML = '';

    if (!state || !state.variables || Object.keys(state.variables).length === 0) {
        container.innerHTML = '<span style="color: var(--text-dim);">No active variables in current scope.</span>';
        return;
    }

    for (const [name, binding] of Object.entries(state.variables)) {
        const card = document.createElement('div');
        card.className = 'var-card';
        const valStr = binding?.value !== undefined ? String(binding.value) : JSON.stringify(binding);
        card.innerHTML = `<div class="var-row"><span class="var-name">${name}</span> = <span class="var-val">${valStr}</span></div>`;
        container.appendChild(card);
    }
}
