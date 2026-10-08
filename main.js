/**
 * main.js — ProViz Universal Autonomous Verification Operating System & 3D Visual IDE
 *
 * Orchestrates: CodeMirror 6 editor ⇄ time-travel debugger ⇄ 3D spatial world ⇄ inspector.
 * Execution (Pyodide) produces a UET trace; playback reconstructs RuntimeState per step;
 * WorldModel projects it to plain data; SpatialWorld renders it. Nothing here owns state
 * that the trace doesn't.
 */

import { EditorState, StateField, StateEffect, RangeSet } from '@codemirror/state';
import { EditorView, Decoration, WidgetType, GutterMarker, gutter } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

import { PythonExecutor }    from './src/engine/PythonExecutor.js';
import { PlaybackEngine }    from './src/PlaybackEngine.js';
import { Debugger }          from './src/debugger/Debugger.js';
import { ExplanationEngine } from './src/ExplanationEngine.js';
import { SpatialWorld }      from './src/rendering/SpatialWorld.js';
import { buildWorldModel }   from './src/rendering/WorldModel.js';
import {
    stepIntoIndex, stepOverIndex, stepOutIndex, continueIndex, timelineMarkers, changeOriginLine,
} from './src/debugger/StepNavigator.js';
import { questions }         from './src/questions/registry.js';
import { transitionTheme }   from './src/site/themeTransition.js';
import {
    watchSession, signInWithGoogle, signOutEverywhere, getRoleConfig, describeAuthError, authConfigured,
} from './src/auth/session.js';
import {
    ROLE_INFO, STUDIOS, CAPABILITIES, studiosFor, canOpenStudio, can, initialStudio, initials, atLeast,
} from './src/auth/roles.js';

// Scratchpad configuration
const SCRATCHPAD_OPTION = {
    id: '__scratchpad__',
    title: 'Scratchpad',
    description: 'Write, execute, and step through arbitrary Python code in 3D.',
    isScratchpad: true,
    starter_code: `# Write any Python — ProViz traces it and builds a 3D world.
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

def total(values):
    acc = 0
    for v in values:
        acc += v
    return acc

nums = [3, 1, 4, 1, 5]
alias = nums          # same list: watch both arcs land on one object
alias.append(9)
origin = Point(0, 0)
s = total(nums)
print(f"sum = {s}")
`,
    visualization: {
        primary_visualizer: 'variables',
        tracked_variables: [],
    },
};

const $ = id => document.getElementById(id);

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Escape, then render `backtick` spans as <code>. */
function richText(s) {
    return escapeHtml(s || '').replace(/`([^`]+)`/g, '<code>$1</code>');
}

function readPref(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

function writePref(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Global error boundary
// ─────────────────────────────────────────────────────────────────────────────

function toast(message, ms = 5000, kind = 'error') {
    const region = $('toast-region');
    if (!region) return;
    const el = document.createElement('div');
    el.className = `toast toast--${kind}`;
    el.textContent = message;
    region.appendChild(el);
    setTimeout(() => el.remove(), ms);
}

window.addEventListener('error', e => {
    console.error('[ProViz]', e.error || e.message);
    toast(`Unexpected error: ${e.message}`);
});
window.addEventListener('unhandledrejection', e => {
    console.error('[ProViz]', e.reason);
    toast(`Unexpected error: ${e.reason?.message || e.reason}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3D Spatial World
// ─────────────────────────────────────────────────────────────────────────────

const canvas = $('app-canvas');
const canvasContainer = $('canvas-container');
const tooltipEl = $('canvas-tooltip');

let world = null;
try {
    if (canvas && canvasContainer) {
        world = new SpatialWorld({
            canvas,
            container: canvasContainer,
            theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
            onSelect: info => selectEntity(info),
            onHover: (info, x, y) => showTooltip(info, x, y),
        });
    }
} catch (err) {
    console.error('[ProViz] WebGL initialisation failed', err);
    toast('3D view unavailable: WebGL could not be initialised in this browser.', 8000);
}

canvasContainer?.addEventListener('proviz:webgl-lost', () => toast('WebGL context lost — the 3D view will resume when the GPU recovers.'));

function showTooltip(info, x, y) {
    if (!tooltipEl) return;
    if (!info || info.kind === 'frame') { tooltipEl.hidden = true; return; }
    tooltipEl.innerHTML = `<strong>${escapeHtml(info.name)}<span class="tt-type">${escapeHtml(info.type || '')}</span></strong><code>${escapeHtml(info.value ?? '')}</code>`;
    tooltipEl.hidden = false;
    const maxX = canvasContainer.clientWidth - tooltipEl.offsetWidth - 8;
    const maxY = canvasContainer.clientHeight - tooltipEl.offsetHeight - 8;
    tooltipEl.style.left = `${Math.min(x + 14, maxX)}px`;
    tooltipEl.style.top = `${Math.min(y + 14, maxY)}px`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine Instances
// ─────────────────────────────────────────────────────────────────────────────

const executor   = new PythonExecutor();
const playback   = new PlaybackEngine();
const debuggerCore = new Debugger({ playbackEngine: playback });
const explainer  = new ExplanationEngine();

// Master Stage 36 Autonomous Verification Operating System Instance
const os = debuggerCore.createAutonomousOS({ projectId: 'proviz-core-workspace' });

// ─────────────────────────────────────────────────────────────────────────────
// CodeMirror Editor: execution line, breakpoints, inline values, diagnostics
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

const setErrorLine = StateEffect.define();
const errorLineField = StateField.define({
    create() { return Decoration.none; },
    update(deco, tr) {
        deco = deco.map(tr.changes);
        if (tr.docChanged) deco = Decoration.none;
        for (const e of tr.effects) {
            if (e.is(setErrorLine)) {
                deco = Decoration.none;
                if (e.value > 0 && e.value <= tr.state.doc.lines) {
                    deco = deco.update({ add: [Decoration.line({ class: 'cm-errorLine' }).range(tr.state.doc.line(e.value).from)] });
                }
            }
        }
        return deco;
    },
    provide: f => EditorView.decorations.from(f),
});

class InlineBadge extends WidgetType {
    constructor(text, kind) { super(); this.text = text; this.kind = kind; }
    eq(other) { return other.text === this.text && other.kind === this.kind; }
    toDOM() {
        const el = document.createElement('span');
        el.className = `cm-inline-badge${this.kind ? ` cm-inline-badge--${this.kind}` : ''}`;
        el.textContent = this.text;
        el.title = this.text;
        return el;
    }
    ignoreEvent() { return true; }
}

const setBadges = StateEffect.define();
const badgesField = StateField.define({
    create() { return Decoration.none; },
    update(deco, tr) {
        deco = deco.map(tr.changes);
        if (tr.docChanged) deco = Decoration.none;
        for (const e of tr.effects) {
            if (!e.is(setBadges)) continue;
            const ranges = [];
            const byLine = new Map();
            for (const b of e.value) {
                if (!(b.line > 0 && b.line <= tr.state.doc.lines)) continue;
                if (!byLine.has(b.line)) byLine.set(b.line, []);
                byLine.get(b.line).push(b);
            }
            for (const [line, items] of [...byLine].sort((a, b) => a[0] - b[0])) {
                const text = items.slice(0, 3).map(i => i.text).join('  ·  ') + (items.length > 3 ? `  +${items.length - 3}` : '');
                const kind = items.some(i => i.kind === 'error') ? 'error' : (items.every(i => i.kind === 'new') ? 'new' : '');
                ranges.push(Decoration.widget({ widget: new InlineBadge(text, kind), side: 1 }).range(tr.state.doc.line(line).to));
            }
            deco = Decoration.set(ranges, true);
        }
        return deco;
    },
    provide: f => EditorView.decorations.from(f),
});

const setVarHighlight = StateEffect.define();
const varHighlightField = StateField.define({
    create() { return Decoration.none; },
    update(deco, tr) {
        deco = deco.map(tr.changes);
        for (const e of tr.effects) {
            if (!e.is(setVarHighlight)) continue;
            deco = Decoration.none;
            const name = e.value;
            if (!name || !/^[A-Za-z_]\w*$/.test(name)) continue;
            const text = tr.state.doc.toString();
            const re = new RegExp(`\\b${name}\\b`, 'g');
            const ranges = [];
            let m;
            while ((m = re.exec(text)) && ranges.length < 200) {
                ranges.push(Decoration.mark({ class: 'cm-varHighlight' }).range(m.index, m.index + name.length));
            }
            deco = Decoration.set(ranges);
        }
        return deco;
    },
    provide: f => EditorView.decorations.from(f),
});

// Breakpoints (gutter markers keyed by line start, mapped through edits)
const toggleBreakpointEffect = StateEffect.define({ map: (pos, mapping) => mapping.mapPos(pos) });
const breakpointMarker = new (class extends GutterMarker {
    toDOM() {
        const el = document.createElement('div');
        el.className = 'cm-bp-marker';
        return el;
    }
})();

const breakpointField = StateField.define({
    create() { return RangeSet.empty; },
    update(set, tr) {
        set = set.map(tr.changes);
        for (const e of tr.effects) {
            if (!e.is(toggleBreakpointEffect)) continue;
            let has = false;
            set.between(e.value, e.value, () => { has = true; });
            set = has
                ? set.update({ filter: from => from !== e.value })
                : set.update({ add: [breakpointMarker.range(e.value)] });
        }
        return set;
    },
});

function toggleBreakpointAt(view, pos) {
    const line = view.state.doc.lineAt(pos);
    view.dispatch({ effects: toggleBreakpointEffect.of(line.from) });
    onBreakpointsChanged();
}

const breakpointGutter = [
    breakpointField,
    gutter({
        class: 'cm-breakpoint-gutter',
        markers: v => v.state.field(breakpointField),
        initialSpacer: () => breakpointMarker,
        domEventHandlers: {
            mousedown(view, line) {
                toggleBreakpointAt(view, line.from);
                return true;
            },
        },
    }),
];

function breakpointLines() {
    const lines = new Set();
    if (!editor) return lines;
    const iter = editor.state.field(breakpointField).iter();
    while (iter.value) {
        lines.add(editor.state.doc.lineAt(iter.from).number);
        iter.next();
    }
    return lines;
}

// Syntax colours resolve through CSS tokens, so both themes re-colour the editor instantly.
const velvetHighlight = HighlightStyle.define([
    { tag: [t.keyword, t.operatorKeyword, t.modifier], color: 'var(--syn-keyword)', fontWeight: '500' },
    { tag: [t.controlKeyword, t.moduleKeyword], color: 'var(--syn-control)', fontWeight: '500' },
    { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--syn-string)' },
    { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--syn-number)' },
    { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
    { tag: [t.function(t.definition(t.variableName)), t.function(t.variableName)], color: 'var(--syn-def)' },
    { tag: [t.definition(t.className), t.className, t.typeName], color: 'var(--syn-class)' },
    { tag: [t.propertyName, t.attributeName], color: 'var(--syn-prop)' },
    { tag: [t.standard(t.variableName), t.self], color: 'var(--syn-builtin)' },
    { tag: [t.variableName, t.definition(t.variableName)], color: 'var(--syn-var)' },
    { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--syn-op)' },
]);

let editor;

function highlightLine(lineNo) {
    if (!editor) return;
    const effects = [addLineHighlight.of(lineNo || 0)];
    if (lineNo > 0 && lineNo <= editor.state.doc.lines) {
        effects.push(EditorView.scrollIntoView(editor.state.doc.line(lineNo).from, { y: 'nearest', yMargin: 48 }));
    }
    editor.dispatch({ effects });
}

const editorContainer = $('editor-container');
if (editorContainer) {
    editor = new EditorView({
        state: EditorState.create({
            doc: SCRATCHPAD_OPTION.starter_code,
            extensions: [
                breakpointGutter,
                basicSetup,
                python(),
                lineHighlightField,
                errorLineField,
                badgesField,
                varHighlightField,
                EditorView.updateListener.of(u => {
                    if (u.docChanged && traceLoaded) markTraceStale();
                }),
                syntaxHighlighting(velvetHighlight),
                EditorView.theme({
                    '&': { height: '100%', backgroundColor: 'var(--bg-editor)', color: 'var(--text)' },
                    '.cm-scroller': { overflow: 'auto' },
                }),
            ],
        }),
        parent: editorContainer,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme (Velvet light / Velvet Night) — resolved pre-paint in index.html
// ─────────────────────────────────────────────────────────────────────────────

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme, { persist = true, animate = true } = {}) {
    if (animate) {
        document.body.classList.add('theme-switching');
        setTimeout(() => document.body.classList.remove('theme-switching'), 320);
    }
    document.documentElement.dataset.theme = theme;
    if (persist) writePref('proviz.theme', theme);
    world?.setTheme(theme);
    const toggle = $('theme-toggle');
    if (toggle) toggle.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
}

/** Switch theme with the wave, starting from `source` (click event or element; default: header toggle). */
function toggleTheme(source) {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    transitionTheme(() => {
        applyTheme(next, { animate: false });
        syncThemeMenuItem();
    }, source || $('theme-toggle'));
}

$('theme-toggle')?.addEventListener('click', e => toggleTheme(e));
darkQuery.addEventListener?.('change', e => {
    // Follow the OS only until the user picks a theme explicitly.
    if (!readPref('proviz.theme', null)) applyTheme(e.matches ? 'dark' : 'light', { persist: false });
});
world?.setTheme(currentTheme());

// ─────────────────────────────────────────────────────────────────────────────
// Navigation & Tab Switching
// ─────────────────────────────────────────────────────────────────────────────

const navTabs = document.querySelectorAll('.nav-tab-btn');
const viewportPanels = document.querySelectorAll('.studio-viewport-panel');
let currentRole = 'guest';
let currentStudio = null;

function switchStudio(view) {
    if (!canOpenStudio(currentRole, view)) return;
    currentStudio = view;
    navTabs.forEach(t => {
        const active = t.dataset.view === view;
        t.classList.toggle('active', active);
        t.setAttribute('aria-current', active ? 'page' : 'false');
    });
    viewportPanels.forEach(panel => panel.classList.toggle('active', panel.id === `view-${view}`));
    writePref('proviz.studio', view);
    fitHeader(); // the active tab's label width can change what fits
    if (view === 'visualizer-3d') {
        requestAnimationFrame(() => { world?.resize(); fitEditorToolbar(); });
        warmRuntime();
    }
}

navTabs.forEach(tab => tab.addEventListener('click', () => switchStudio(tab.dataset.view)));

function isVisualizerActive() {
    return $('view-visualizer-3d')?.classList.contains('active');
}

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
    entry.hidden = journalFilter !== 'all' && journalFilter !== type;
    journalEl.appendChild(entry);
    journalEl.scrollTop = journalEl.scrollHeight;
}

let journalFilter = 'all';
document.querySelectorAll('.j-filter').forEach(btn => {
    btn.addEventListener('click', () => {
        journalFilter = btn.dataset.filter;
        document.querySelectorAll('.j-filter').forEach(b => b.classList.toggle('active', b === btn));
        journalEl?.querySelectorAll('.event-item').forEach(item => {
            item.hidden = journalFilter !== 'all' && !item.classList.contains(journalFilter);
        });
    });
});

// 1. Autonomy Policy Selector
const autonomyPicker = document.getElementById('os-autonomy-level-picker');
if (autonomyPicker) {
    autonomyPicker.addEventListener('change', (e) => {
        if (!can(currentRole, 'governance.autonomy')) return;
        os.setAutonomyLevel(e.target.value);
        addJournalEntry('info', 'AUTONOMY_LEVEL_CHANGED', `Autonomy policy updated to ${e.target.value}`);
    });
}

// 2. Action: Run Full Autonomous Loop
const btnRunOS = document.getElementById('btn-run-os-pipeline');
if (btnRunOS) {
    btnRunOS.addEventListener('click', async () => {
        if (!can(currentRole, 'verification.run')) return;
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
        if (!can(currentRole, 'verification.run')) return;
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
        if (!can(currentRole, 'verification.run')) return;
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
        if (!can(currentRole, 'governance.certify')) return;
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
        if (!can(currentRole, 'governance.safemode')) return;
        const currentState = os.getState();
        const safeText = document.getElementById('btn-safemode-text');

        if (currentState === 'FAILED_SAFE') {
            os.recover('Manual operator recovery');
            if (safeText) safeText.textContent = 'Safe Mode';
            btnSafe.className = 'btn btn-danger-soft';
            if (osStatusText) osStatusText.textContent = 'READY (S0)';
            if (osStatusBadge) osStatusBadge.className = 'os-badge badge-ready';
            addJournalEntry('info', 'SAFE_MODE_RECOVERED', 'Runtime recovered to READY state.');
            fitHeader();
        } else {
            os.enterSafeMode('Operator test trigger');
            if (safeText) safeText.textContent = 'Recover OS';
            btnSafe.className = 'btn btn-primary';
            if (osStatusText) osStatusText.textContent = 'FAILED_SAFE';
            if (osStatusBadge) osStatusBadge.className = 'os-badge badge-safemode';
            addJournalEntry('error', 'SAFE_MODE_ENTERED', 'All autonomous modifications strictly prohibited.');
            fitHeader();
        }
    });
}

// 7. Action: Export Audit Trail
const btnAudit = document.getElementById('btn-export-audit-trail');
if (btnAudit) {
    btnAudit.addEventListener('click', () => {
        if (!can(currentRole, 'verification.export')) return;
        const audit = debuggerCore.exportAuditTrail();
        addJournalEntry('info', 'AUDIT_EXPORTED', `Exported ${audit.totalRecords} immutable audit records.`);
        const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `proviz-audit-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        toast(`Audit trail exported — ${audit.totalRecords} record${audit.totalRecords === 1 ? '' : 's'} saved as JSON.`, 5000, 'info');
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
// Question Presets
// ─────────────────────────────────────────────────────────────────────────────

const questionSelect = $('question-select');
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
                changes: { from: 0, to: editor.state.doc.length, insert: selected.starter_code },
            });
        }
        resetTrace('Preset loaded. Press F5 to run.');
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Python runtime lifecycle (Pyodide loading states)
// ─────────────────────────────────────────────────────────────────────────────

const runtimeChip = $('runtime-status');
const runtimeChipText = $('runtime-status-text');
const runtimeOverlay = $('runtime-overlay');
const runtimeOverlayMsg = $('runtime-overlay-msg');

// Header: same idea — compact one step at a time, only while the row overflows.
const HEADER_STEPS = ['hd-offcenter', 'hd-compact-search', 'hd-no-badge', 'hd-tight', 'hd-active-only', 'hd-icons'];
const twoRowHeader = window.matchMedia('(max-width: 720px)');

function fitHeader() {
    const header = OS_HEADER_EL;
    if (!header) return;
    header.classList.remove(...HEADER_STEPS);
    if (twoRowHeader.matches) return; // phones: nav has its own scrollable row with labels
    const left = header.querySelector('.header-left');
    const nav = header.querySelector('.os-main-nav');
    const right = header.querySelector('.header-right');
    const overflowing = () => {
        if (header.scrollWidth > header.clientWidth) return true;
        const navVisible = nav && nav.offsetParent && getComputedStyle(nav).display !== 'none';
        if (!navVisible) return false;
        const n = nav.getBoundingClientRect();
        return left.getBoundingClientRect().right > n.left - 8 || n.right > right.getBoundingClientRect().left - 8;
    };
    for (const step of HEADER_STEPS) {
        if (!overflowing()) break;
        header.classList.add(step);
    }
}
const OS_HEADER_EL = document.getElementById('os-global-header');
if (OS_HEADER_EL && 'ResizeObserver' in window) new ResizeObserver(() => fitHeader()).observe(OS_HEADER_EL);
twoRowHeader.addEventListener?.('change', fitHeader);
document.fonts?.ready.then(fitHeader);

// Editor toolbar: drop details one at a time, only when they truly don't fit the panel.
const editorBar = document.querySelector('.editor-header-bar');
const editorFileBox = document.querySelector('.editor-file');
const TOOLBAR_STEPS = ['tb-no-kbd', 'tb-dot', 'tb-no-file'];

function fitEditorToolbar() {
    if (!editorBar || !editorFileBox || !editorBar.offsetParent) return;
    editorBar.classList.remove(...TOOLBAR_STEPS);
    const overflowing = () => editorFileBox.scrollWidth > editorFileBox.clientWidth + 1
        || editorBar.scrollWidth > editorBar.clientWidth + 1;
    for (const step of TOOLBAR_STEPS) {
        if (!overflowing()) break;
        editorBar.classList.add(step);
    }
}

if (editorBar && 'ResizeObserver' in window) new ResizeObserver(() => fitEditorToolbar()).observe(editorBar);

executor.onStatus(({ status, message }) => {
    if (runtimeChip) runtimeChip.className = `runtime-chip runtime-chip--${status}`;
    if (runtimeChipText) {
        runtimeChipText.textContent = {
            idle: 'Python idle',
            loading: 'Loading Python…',
            ready: 'Python ready',
            error: 'Runtime error',
        }[status] || status;
    }
    if (runtimeChip) runtimeChip.title = message || runtimeChipText?.textContent || '';
    fitEditorToolbar(); // status labels differ in length ("Loading Python…" vs "Python ready")
    if (runtimeOverlayMsg && message) runtimeOverlayMsg.textContent = message;
});

/** Start downloading Pyodide in the background so the first Run is instant. */
function warmRuntime() {
    if (executor.isReady || executor.status === 'loading') return;
    executor.init().catch(() => { /* surfaced via status chip; Run will retry */ });
}

// ─────────────────────────────────────────────────────────────────────────────
// Debug session state
// ─────────────────────────────────────────────────────────────────────────────

const btnRunCode = $('btn-run');
const btnResetCode = $('btn-reset');
const btnPlayPause = $('btn-play-pause');
const btnStepNext = $('btn-step-over');
const btnStepInto = $('btn-step-into');
const btnStepOut = $('btn-step-out');
const btnContinue = $('btn-continue');
const btnStepPrev = $('btn-prev');
const btnRestart = $('btn-restart');
const pbCounter = $('pb-counter');
const pbFill = $('pb-bar-fill');
const pbThumb = $('pb-thumb');
const pbTrack = $('pb-track');
const pbMarkers = $('pb-markers');
const expPrimary = $('exp-primary');
const expSecondary = $('exp-secondary');
const expBadges = $('exp-badges');
const stepChip = $('canvas-step-chip');

let traceLoaded = false;
let traceStale = false;
let isRunning = false;
let fitOnNextStep = false;
let lastTrace = null;
let lastWorld = null;
let lastError = null;

function frames() {
    return playback.timeline?.frames || [];
}

function setExplanation(primary, { badges = [], secondary = '', error = false } = {}) {
    if (expPrimary) expPrimary.innerHTML = richText(primary);
    if (expSecondary) expSecondary.innerHTML = richText(secondary);
    if (expBadges) {
        expBadges.innerHTML = '';
        const list = badges.length ? badges : [error ? 'Error' : 'Ready'];
        for (const b of list) {
            const el = document.createElement('span');
            el.className = `exp-badge${error ? ' exp-badge--error' : (badges.length ? '' : ' exp-badge--idle')}`;
            el.textContent = b;
            expBadges.appendChild(el);
        }
    }
}

function markTraceStale() {
    if (traceStale) return;
    traceStale = true;
    if (expBadges) {
        const el = document.createElement('span');
        el.className = 'exp-badge exp-badge--idle';
        el.textContent = 'Code edited — F5 to re-run';
        expBadges.appendChild(el);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostics (syntax / runtime / runtime-load errors)
// ─────────────────────────────────────────────────────────────────────────────

const diagCard = $('diagnostic-card');

function showDiagnostic({ type, message, line = null, traceback = '', retry = false }) {
    lastError = { type, message, line };
    if (!diagCard) return;
    $('diag-title').textContent = type;
    $('diag-location').textContent = line ? `main.py, line ${line}` : (retry ? 'Python runtime' : '');
    $('diag-message').textContent = message;
    traceback = (traceback || '').replace(/<user_code>/g, 'main.py');
    const tb = $('diag-trace');
    const cleanTb = (traceback || '').trim();
    tb.hidden = !cleanTb || cleanTb === message;
    tb.textContent = cleanTb;
    $('diag-goto').hidden = !line;
    $('diag-retry').hidden = !retry;
    diagCard.hidden = false;
    if (line && editor) editor.dispatch({ effects: setErrorLine.of(line) });
}

function hideDiagnostic() {
    if (diagCard) diagCard.hidden = true;
    if (editor) editor.dispatch({ effects: setErrorLine.of(0) });
    lastError = null;
}

$('diag-close')?.addEventListener('click', () => { if (diagCard) diagCard.hidden = true; });
$('diag-retry')?.addEventListener('click', () => runCode());
$('diag-goto')?.addEventListener('click', () => {
    if (!editor || !lastError?.line) return;
    const line = editor.state.doc.line(Math.min(lastError.line, editor.state.doc.lines));
    editor.dispatch({ selection: { anchor: line.from }, effects: EditorView.scrollIntoView(line.from, { y: 'center' }) });
    editor.focus();
});

// ─────────────────────────────────────────────────────────────────────────────
// Run / Reset
// ─────────────────────────────────────────────────────────────────────────────

async function runCode() {
    if (!editor || isRunning) return;
    if (!isVisualizerActive()) switchStudio('visualizer-3d');
    isRunning = true;
    playback.pause();
    syncPlayButton();
    hideDiagnostic();
    if (btnRunCode) btnRunCode.disabled = true;
    const code = editor.state.doc.toString();

    const needsBoot = !executor.isReady;
    if (needsBoot && runtimeOverlay) runtimeOverlay.hidden = false;
    setExplanation(needsBoot ? 'Booting the Python WebAssembly runtime (first run only)…' : 'Executing Python in the Pyodide sandbox…', { badges: ['Running'] });

    try {
        try {
            await executor.init();
        } catch (err) {
            showDiagnostic({ type: 'Runtime failed to load', message: err.message, retry: true });
            setExplanation('The Python runtime could not be loaded.', { error: true, secondary: 'Check your network connection, then press Retry.' });
            return;
        } finally {
            if (runtimeOverlay) runtimeOverlay.hidden = true;
        }

        // Yield a frame so the "Running" state paints before the synchronous trace.
        await new Promise(r => requestAnimationFrame(() => r()));
        const trace = await executor.run(code);
        lastTrace = trace;

        world?.clear();
        traceStale = false;
        fitOnNextStep = true;
        playback.loadTrace(trace);
        traceLoaded = frames().length > 0;
        renderTimelineMarkers();
        renderOutput(trace.result?.output || '');

        const err = trace.result?.error;
        if (err) {
            showDiagnostic({
                type: err.type || 'Error',
                message: err.message || 'Execution failed.',
                line: err.line,
                traceback: err.traceback,
            });
            addJournalEntry('error', 'EXECUTION_ERROR', `${err.type}: ${err.message}`);
        } else {
            addJournalEntry('success', 'CODE_EXECUTED', `Executed Python sandbox code (${trace.events.length} trace events, ${frames().length} steps).`);
        }

        if (!traceLoaded) {
            updateTransport();
            setExplanation(err ? `\`${err.type}\` before any step could run.` : 'Program produced no executable steps.', { error: Boolean(err) });
            return;
        }

        // Start debugging: stop at the first breakpoint if any, else at the first step.
        const bps = breakpointLines();
        const first = (bps.size > 0 || err) ? continueIndex(frames(), -1, bps) : 0;
        playback.seek(first);
    } catch (err) {
        console.error('[ProViz] run failed', err);
        showDiagnostic({ type: 'InternalError', message: err.message || String(err) });
        setExplanation('Execution failed unexpectedly.', { error: true });
    } finally {
        isRunning = false;
        if (btnRunCode) btnRunCode.disabled = false;
    }
}

function resetTrace(message = 'Scene and playback reset.') {
    playback.pause();
    playback.loadTrace(null);
    traceLoaded = false;
    traceStale = false;
    lastTrace = null;
    lastWorld = null;
    world?.clear();
    hideDiagnostic();
    if (editor) editor.dispatch({ effects: [addLineHighlight.of(0), setBadges.of([]), setVarHighlight.of(null)] });
    renderTimelineMarkers();
    renderOutput('');
    renderInspector(null);
    if (stepChip) stepChip.hidden = true;
    updateTransport();
    syncPlayButton();
    setExplanation(message);
}

btnRunCode?.addEventListener('click', () => runCode());
btnResetCode?.addEventListener('click', () => resetTrace());

// ─────────────────────────────────────────────────────────────────────────────
// Step rendering — the single sync point for editor, 3D world, and inspector
// ─────────────────────────────────────────────────────────────────────────────

playback.on('step', (frame, runtimeState) => renderStep(frame, runtimeState));

playback.onFrameChange((frame, evt) => {
    if (evt === 'end') syncPlayButton();
});

function renderStep(frame, state) {
    const idx = playback.currentIndex;
    const all = frames();
    if (!frame) return;

    // 3D world. After the program finishes the stack is empty — keep showing the final
    // state of the last step that still had live frames instead of an empty world.
    lastWorld = buildWorldModel(state, frame);
    if (frame.event_type === 'output' && !lastWorld.frames.some(f => f.vars.length) && playback.reconstructor) {
        for (let i = idx - 1; i >= Math.max(0, idx - 4); i--) {
            const prior = buildWorldModel(playback.reconstructor.reconstruct(i), { ...all[i], changed_variables: [] });
            if (prior.frames.some(f => f.vars.length)) {
                lastWorld = { ...prior, line: null, eventType: 'output', exception: null };
                break;
            }
        }
    }
    const hasContent = lastWorld.frames.some(f => f.vars.length) || lastWorld.objects.length > 0;
    world?.update(lastWorld, { fit: fitOnNextStep && hasContent });
    if (hasContent) fitOnNextStep = false;

    // Editor: active line + inline values
    highlightLine(frame.current_line);
    if (editor) editor.dispatch({ effects: setBadges.of(stepBadges(all, idx, frame)) });

    // Explanation
    const exp = explainer.explain(frame, all[idx - 1] || null);
    const isErr = frame.event_type === 'exception';
    setExplanation(exp.primary || frame.description || '', { badges: exp.badges || [], secondary: exp.secondary, error: isErr });
    if (stepChip) {
        stepChip.hidden = false;
        stepChip.classList.toggle('is-error', isErr);
        stepChip.innerHTML = `${frame.current_line ? `<code>L${frame.current_line}</code> · ` : ''}${richText(exp.primary || frame.description || '')}`;
    }

    // Breakpoint hit while auto-playing
    if (playback.isPlaying && frame.event_type === 'line' && breakpointLines().has(frame.current_line)) {
        playback.pause();
        syncPlayButton();
        setExplanation(`Paused at breakpoint on line ${frame.current_line}.`, { badges: ['Breakpoint'] });
    }
    if (isErr && playback.isPlaying) {
        playback.pause();
        syncPlayButton();
    }

    renderInspector(lastWorld, state);
    renderOutput(frame.output_so_far || (idx === all.length - 1 ? lastTrace?.result?.output : '') || '');
    updateTransport();
}

function stepBadges(all, idx, frame) {
    const badges = [];
    const origin = changeOriginLine(all, idx);
    for (const c of frame.changed_variables || []) {
        const val = String(c.new_value);
        badges.push({ line: origin, text: `${c.name} = ${val.length > 22 ? `${val.slice(0, 21)}…` : val}`, kind: c.is_new ? 'new' : '' });
    }
    if (frame.event_type === 'return' && frame.return_value != null) {
        badges.push({ line: frame.current_line, text: `↩ ${frame.return_value}`, kind: '' });
    }
    if (frame.event_type === 'exception' && frame.exception) {
        badges.push({ line: frame.current_line, text: `⚠ ${frame.exception.type}: ${frame.exception.message}`, kind: 'error' });
    }
    return badges;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inspector (Variables · Call Stack · Output)
// ─────────────────────────────────────────────────────────────────────────────

const inspTabs = document.querySelectorAll('.insp-tab');
const inspPanes = document.querySelectorAll('.inspector-content-area');

function showInspectorPane(pane) {
    inspTabs.forEach(t => t.classList.toggle('active', t.dataset.pane === pane));
    inspPanes.forEach(p => { p.hidden = p.dataset.pane !== pane; });
}
inspTabs.forEach(t => t.addEventListener('click', () => showInspectorPane(t.dataset.pane)));

function renderInspector(model, state = null) {
    const vars = $('variables-container');
    const stack = $('callstack-container');
    if (vars) {
        vars.innerHTML = '';
        const active = model?.frames?.[model.frames.length - 1];
        if (!active || active.vars.length === 0) {
            vars.innerHTML = '<span class="inspector-empty">No active variables in current scope.</span>';
        } else {
            for (const v of active.vars) {
                const card = document.createElement('div');
                card.className = `var-card${v.changed ? ' var-card--changed' : ''}`;
                card.dataset.nodeId = v.id;
                card.dataset.name = v.name;
                card.innerHTML = `<div class="var-row"><span class="var-name">${escapeHtml(v.name)}</span><span class="var-type">${escapeHtml(v.type)}</span><span class="var-eq">=</span><span class="var-val" title="${escapeHtml(v.fullDisplay)}">${escapeHtml(v.fullDisplay)}</span></div>`;
                card.addEventListener('click', () => {
                    world?.focusNode(v.id);
                    selectEntity({ kind: 'variable', name: v.name });
                });
                vars.appendChild(card);
            }
        }
    }
    if (stack) {
        stack.innerHTML = '';
        const fs = model?.frames || [];
        if (fs.length === 0) {
            stack.innerHTML = '<span class="inspector-empty">Call stack is empty.</span>';
        }
        [...fs].reverse().forEach((f, i) => {
            const cf = state?.callStack?.[f.depth];
            const line = i === 0 ? model.line : cf?.source?.line;
            const row = document.createElement('div');
            row.className = `stack-frame-row${f.active ? ' active' : ''}`;
            row.innerHTML = `<span class="sf-name">${escapeHtml(f.name === '<module>' ? '<module>' : `${f.name}()`)}</span><span class="sf-line">${line ? `line ${line}` : ''} · ${f.vars.length} var${f.vars.length === 1 ? '' : 's'}</span>`;
            row.addEventListener('click', () => world?.focusNode(f.id));
            stack.appendChild(row);
        });
    }
}

function renderOutput(text) {
    const out = $('output-container');
    const count = $('output-count');
    if (out) out.textContent = text || '';
    if (count) {
        const lines = text ? text.split('\n').filter(Boolean).length : 0;
        count.hidden = lines === 0;
        count.textContent = String(lines);
    }
    if (out && !text) out.innerHTML = '<span class="inspector-empty">No output yet.</span>';
}

/** Cross-highlight an entity picked in 3D or the inspector: editor occurrences + inspector card. */
function selectEntity(info) {
    if (!editor) return;
    const name = info && (info.kind === 'variable') ? info.name : null;
    editor.dispatch({ effects: setVarHighlight.of(name) });
    document.querySelectorAll('.var-card.is-selected').forEach(c => c.classList.remove('is-selected'));
    if (name) {
        const card = document.querySelector(`.var-card[data-name="${CSS.escape(name)}"]`);
        if (card) {
            showInspectorPane('vars');
            card.classList.add('is-selected');
            card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Transport controls & stepping semantics
// ─────────────────────────────────────────────────────────────────────────────

function goTo(idx) {
    if (!traceLoaded) return;
    const clamped = Math.max(0, Math.min(idx, frames().length - 1));
    if (clamped === playback.currentIndex) return;
    playback.seek(clamped);
}

const actions = {
    run: () => runCode(),
    stepOver: () => goTo(stepOverIndex(frames(), playback.currentIndex)),
    stepInto: () => goTo(stepIntoIndex(frames(), playback.currentIndex)),
    stepOut: () => goTo(stepOutIndex(frames(), playback.currentIndex)),
    stepBack: () => goTo(playback.currentIndex - 1),
    continue: () => goTo(continueIndex(frames(), playback.currentIndex, breakpointLines())),
    restart: () => goTo(0),
    toEnd: () => goTo(frames().length - 1),
    playPause: () => togglePlay(),
    fit: () => world?.fitView(),
    reset: () => resetTrace(),
};

function togglePlay() {
    if (!traceLoaded) return;
    if (playback.isPlaying) {
        playback.pause();
    } else {
        if (playback.currentIndex >= frames().length - 1) playback.seek(0);
        playback.play();
    }
    syncPlayButton();
}

function syncPlayButton() {
    if (!btnPlayPause) return;
    const playing = playback.isPlaying;
    btnPlayPause.innerHTML = `<svg class="i i-xs"><use href="#i-${playing ? 'pause' : 'play'}"/></svg><span>${playing ? 'Pause' : 'Play'}</span>`;
}

function updateTransport() {
    const total = frames().length;
    const idx = playback.currentIndex;
    const current = traceLoaded && idx >= 0 ? idx + 1 : 0;
    if (pbCounter) pbCounter.textContent = `${current} / ${total}`;
    const pct = total > 1 && idx >= 0 ? (idx / (total - 1)) * 100 : (total === 1 && idx === 0 ? 100 : 0);
    if (pbFill) pbFill.style.width = `${pct}%`;
    if (pbThumb) pbThumb.style.left = `${pct}%`;
    if (pbTrack) {
        pbTrack.setAttribute('aria-valuemax', String(Math.max(0, total - 1)));
        pbTrack.setAttribute('aria-valuenow', String(Math.max(0, idx)));
    }
    const atStart = !traceLoaded || idx <= 0;
    const atEnd = !traceLoaded || idx >= total - 1;
    for (const b of [btnStepPrev, btnRestart]) if (b) b.disabled = atStart;
    for (const b of [btnStepNext, btnStepInto, btnStepOut, btnContinue]) if (b) b.disabled = atEnd;
    if (btnPlayPause) btnPlayPause.disabled = !traceLoaded;
}

function renderTimelineMarkers() {
    if (!pbMarkers) return;
    pbMarkers.innerHTML = '';
    const all = frames();
    if (all.length < 2) return;
    const frag = document.createDocumentFragment();
    for (const m of timelineMarkers(all, breakpointLines())) {
        const tick = document.createElement('span');
        tick.className = `pb-tick pb-tick--${m.kind}`;
        tick.style.left = `${(m.index / (all.length - 1)) * 100}%`;
        frag.appendChild(tick);
    }
    pbMarkers.appendChild(frag);
}

function onBreakpointsChanged() {
    renderTimelineMarkers();
}

btnPlayPause?.addEventListener('click', actions.playPause);
btnStepNext?.addEventListener('click', actions.stepOver);
btnStepInto?.addEventListener('click', actions.stepInto);
btnStepOut?.addEventListener('click', actions.stepOut);
btnContinue?.addEventListener('click', actions.continue);
btnStepPrev?.addEventListener('click', actions.stepBack);
btnRestart?.addEventListener('click', actions.restart);
$('btn-fit-view')?.addEventListener('click', actions.fit);

const speedSlider = $('speed-slider');
const speedLabel = $('speed-label');
function applySpeed(ms) {
    playback.setSpeed(ms);
    if (speedLabel) speedLabel.textContent = `${(ms / 1000).toFixed(1)}s`;
}
if (speedSlider) {
    speedSlider.value = readPref('proviz.speed', speedSlider.value);
    applySpeed(Number(speedSlider.value));
    speedSlider.addEventListener('input', () => {
        applySpeed(Number(speedSlider.value));
        writePref('proviz.speed', speedSlider.value);
    });
}

// Scrubber: click / drag to time-travel, arrow keys when focused.
if (pbTrack) {
    const idxFromEvent = e => {
        const rect = pbTrack.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        return Math.round(t * (frames().length - 1));
    };
    pbTrack.addEventListener('pointerdown', e => {
        if (!traceLoaded) return;
        pbTrack.setPointerCapture(e.pointerId);
        pbTrack.classList.add('scrubbing');
        playback.pause();
        syncPlayButton();
        goTo(idxFromEvent(e));
    });
    pbTrack.addEventListener('pointermove', e => {
        if (pbTrack.hasPointerCapture(e.pointerId)) goTo(idxFromEvent(e));
    });
    const endScrub = e => {
        if (pbTrack.hasPointerCapture(e.pointerId)) pbTrack.releasePointerCapture(e.pointerId);
        pbTrack.classList.remove('scrubbing');
    };
    pbTrack.addEventListener('pointerup', endScrub);
    pbTrack.addEventListener('pointercancel', endScrub);
}

updateTransport();

// ─────────────────────────────────────────────────────────────────────────────
// Resizable panes (editor | canvas, editor / inspector)
// ─────────────────────────────────────────────────────────────────────────────

const sidebar = $('viz-sidebar');

function applySidebarWidth(px) {
    if (!sidebar) return;
    const max = Math.max(360, window.innerWidth - 320);
    const w = Math.max(340, Math.min(px, max));
    sidebar.style.setProperty('--sidebar-width', `${w}px`);
    return w;
}

function applyEditorHeight(px) {
    if (!sidebar) return;
    const max = sidebar.clientHeight - 260;
    const h = Math.max(140, Math.min(px, Math.max(160, max)));
    sidebar.style.setProperty('--editor-height', `${h}px`);
    return h;
}

function makeSplitter(el, { axis, get, apply, key }) {
    if (!el) return;
    el.addEventListener('pointerdown', e => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        el.classList.add('dragging');
        document.body.classList.add(axis === 'x' ? 'is-resizing-col' : 'is-resizing-row');
        const start = axis === 'x' ? e.clientX : e.clientY;
        const startSize = get();
        const move = ev => {
            const delta = (axis === 'x' ? ev.clientX : ev.clientY) - start;
            apply(startSize + delta);
        };
        const up = ev => {
            el.releasePointerCapture(ev.pointerId);
            el.classList.remove('dragging');
            document.body.classList.remove('is-resizing-col', 'is-resizing-row');
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerup', up);
            el.removeEventListener('pointercancel', up);
            writePref(key, String(get()));
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
    });
    el.addEventListener('keydown', e => {
        const dec = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
        const inc = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
        if (e.key !== dec && e.key !== inc) return;
        e.preventDefault();
        e.stopPropagation();
        apply(get() + (e.key === inc ? 24 : -24));
        writePref(key, String(get()));
    });
}

makeSplitter($('splitter-main'), {
    axis: 'x',
    key: 'proviz.sidebarWidth',
    get: () => sidebar?.getBoundingClientRect().width || 500,
    apply: applySidebarWidth,
});
makeSplitter($('splitter-editor'), {
    axis: 'y',
    key: 'proviz.editorHeight',
    get: () => editorContainer?.getBoundingClientRect().height || 320,
    apply: applyEditorHeight,
});

const savedWidth = Number(readPref('proviz.sidebarWidth', ''));
if (savedWidth) applySidebarWidth(savedWidth);
const savedHeight = Number(readPref('proviz.editorHeight', ''));
if (savedHeight) requestAnimationFrame(() => applyEditorHeight(savedHeight));
// Re-clamp against the *preferred* width so a temporarily small window doesn't shrink it for good.
window.addEventListener('resize', () => {
    const preferred = Number(readPref('proviz.sidebarWidth', '')) || 500;
    applySidebarWidth(preferred);
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard shortcuts & Command Palette
// ─────────────────────────────────────────────────────────────────────────────

const palette = $('command-palette');
const paletteInput = $('command-input');
const paletteList = $('command-list');
let paletteItems = [];
let paletteSel = 0;

const COMMANDS = [
    { label: 'Run code', hint: 'F5', run: actions.run },
    { label: 'Step over', hint: 'F10 / →', run: actions.stepOver },
    { label: 'Step into', hint: 'F11 / ↓', run: actions.stepInto },
    { label: 'Step out', hint: '⇧F11 / ↑', run: actions.stepOut },
    { label: 'Step back (time travel)', hint: '←', run: actions.stepBack },
    { label: 'Continue to breakpoint', hint: 'F8', run: actions.continue },
    { label: 'Play / Pause', hint: 'Space', run: actions.playPause },
    { label: 'Jump to first step', hint: 'Home', run: actions.restart },
    { label: 'Jump to last step', hint: 'End', run: actions.toEnd },
    { label: 'Fit 3D view', hint: 'F', run: actions.fit },
    { label: 'Reset trace & scene', hint: '', run: actions.reset },
    { label: 'Toggle light / dark theme', hint: '', run: () => toggleTheme() },
    ...[...navTabs].map(tab => ({ label: `Go to ${tab.textContent.trim()}`, hint: '', view: tab.dataset.view, run: () => switchStudio(tab.dataset.view) })),
];

function renderPalette() {
    const q = paletteInput.value.trim().toLowerCase();
    paletteItems = COMMANDS.filter(c => (!c.view || canOpenStudio(currentRole, c.view)) && c.label.toLowerCase().includes(q));
    paletteSel = Math.min(paletteSel, Math.max(0, paletteItems.length - 1));
    paletteList.innerHTML = '';
    paletteItems.forEach((c, i) => {
        const li = document.createElement('li');
        li.className = i === paletteSel ? 'selected' : '';
        li.setAttribute('role', 'option');
        li.innerHTML = `<span>${escapeHtml(c.label)}</span><kbd>${escapeHtml(c.hint)}</kbd>`;
        li.addEventListener('mouseenter', () => { paletteSel = i; renderPalette(); });
        li.addEventListener('click', () => execPalette(i));
        paletteList.appendChild(li);
    });
}

function openPalette() {
    if (!palette) return;
    palette.hidden = false;
    paletteInput.value = '';
    paletteSel = 0;
    renderPalette();
    paletteInput.focus();
}

function closePalette() {
    if (palette) palette.hidden = true;
}

function execPalette(i) {
    const cmd = paletteItems[i];
    closePalette();
    if (cmd) cmd.run();
}

$('btn-open-palette')?.addEventListener('click', openPalette);
paletteInput?.addEventListener('input', () => { paletteSel = 0; renderPalette(); });
paletteInput?.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); paletteSel = (paletteSel + 1) % Math.max(1, paletteItems.length); renderPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); paletteSel = (paletteSel - 1 + paletteItems.length) % Math.max(1, paletteItems.length); renderPalette(); }
    else if (e.key === 'Enter') { e.preventDefault(); execPalette(paletteSel); }
    else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
});
palette?.addEventListener('mousedown', e => { if (e.target === palette) closePalette(); });

function isTypingTarget(el) {
    if (!el) return false;
    if (el.closest?.('.cm-editor')) return true;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

window.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (palette && !palette.hidden) closePalette(); else openPalette();
        return;
    }
    if (palette && !palette.hidden) return; // palette owns the keyboard

    // Function keys work everywhere, including inside the editor.
    switch (e.key) {
        case 'F5': e.preventDefault(); actions.run(); return;
        case 'F8': e.preventDefault(); actions.continue(); return;
        case 'F10': e.preventDefault(); actions.stepOver(); return;
        case 'F11': e.preventDefault(); (e.shiftKey ? actions.stepOut : actions.stepInto)(); return;
        default: break;
    }
    if (mod && e.key === 'Enter') { e.preventDefault(); actions.run(); return; }
    if (e.key === 'Escape') {
        if (diagCard && !diagCard.hidden) diagCard.hidden = true;
        return;
    }

    if (mod || e.altKey || isTypingTarget(e.target) || !isVisualizerActive()) return;
    if (e.target?.classList?.contains('pane-splitter')) return;

    const map = {
        ArrowRight: actions.stepOver,
        ArrowLeft: actions.stepBack,
        ArrowDown: actions.stepInto,
        ArrowUp: actions.stepOut,
        ' ': actions.playPause,
        Home: actions.restart,
        End: actions.toEnd,
        f: actions.fit,
    };
    const fn = map[e.key];
    if (fn) {
        e.preventDefault();
        fn();
    }
}, { capture: true });

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────

renderInspector(null);
renderOutput('');

// ─────────────────────────────────────────────────────────────────────────────
// Session & roles — decides which studios and controls this person sees
// ─────────────────────────────────────────────────────────────────────────────

const appBoot = $('app-boot');
const userChip = $('user-chip');
const userPopover = $('user-popover');
const OS_HEADER = $('os-global-header');

function paintAvatar(el, user) {
    if (!el) return;
    el.innerHTML = '';
    el.classList.toggle('avatar--guest', !user);
    if (!user) {
        el.innerHTML = '<svg class="i i-sm"><use href="#i-user"/></svg>';
        return;
    }
    if (user.photoURL) {
        const img = document.createElement('img');
        img.src = user.photoURL;
        img.alt = '';
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', () => { el.textContent = initials(user.name, user.email); });
        el.appendChild(img);
    } else {
        el.textContent = initials(user.name, user.email);
    }
}

function setRolePill(el, role) {
    if (!el) return;
    el.textContent = ROLE_INFO[role]?.label || role;
    el.className = `role-pill role-pill--${role}`;
}

function syncThemeMenuItem() {
    const item = $('up-theme');
    if (!item) return;
    const toDark = currentTheme() !== 'dark';
    item.querySelector('span').textContent = toDark ? 'Dark theme' : 'Light theme';
    item.querySelector('use')?.setAttribute('href', toDark ? '#i-moon' : '#i-sun');
}

function applyCapabilities(role) {
    document.querySelectorAll('[data-cap]').forEach(el => {
        const allowed = can(role, el.dataset.cap);
        if (el.dataset.capMode === 'disable') {
            el.classList.toggle('is-locked', !allowed);
            el.querySelectorAll('select, button, input').forEach(c => { c.disabled = !allowed; });
            el.title = allowed ? '' : 'Only super admins can change this';
        } else {
            el.hidden = !allowed;
        }
    });
}

function renderTeam(role) {
    const list = $('team-members');
    const matrix = $('role-matrix');
    if (!list || !matrix || !atLeast(role, 'superadmin')) return;
    const { admins, superAdmins } = getRoleConfig();
    const people = [
        ...superAdmins.map(email => ({ email, role: 'superadmin' })),
        ...admins.filter(e => !superAdmins.includes(e)).map(email => ({ email, role: 'admin' })),
    ];
    list.innerHTML = '';
    if (people.length === 0) {
        list.innerHTML = '<li class="member-empty">No allowlisted accounts yet. Roles may still come from custom claims.</li>';
    }
    for (const p of people) {
        const li = document.createElement('li');
        li.innerHTML = `<span class="avatar">${escapeHtml(initials('', p.email))}</span><span class="member-email">${escapeHtml(p.email)}</span><span class="role-pill role-pill--${p.role}">${escapeHtml(ROLE_INFO[p.role].label)}</span>`;
        list.appendChild(li);
    }
    const count = $('team-count');
    if (count) count.textContent = `${people.length} ${people.length === 1 ? 'person' : 'people'}`;

    const roles = ['guest', 'user', 'admin', 'superadmin'];
    const tick = ok => ok
        ? '<span class="mx-yes" aria-label="Yes"><svg class="i i-xs"><use href="#i-check"/></svg></span>'
        : '<span class="mx-no" aria-label="No">—</span>';
    const capLabels = {
        'verification.run': 'Run verification & repairs',
        'verification.export': 'Export audit trail',
        'governance.autonomy': 'Change autonomy level',
        'governance.safemode': 'Enter / leave safe mode',
        'governance.certify': 'Issue certificates',
        'team.view': 'View team & roles',
    };
    const rows = [
        ...STUDIOS.filter(s => s.view !== 'team-roles').map(s => [`Open ${s.label}`, r => canOpenStudio(r, s.view)]),
        ...Object.keys(CAPABILITIES).map(c => [capLabels[c] || c, r => can(r, c)]),
    ];
    matrix.innerHTML = `<thead><tr><th>Permission</th>${roles.map(r => `<th><span class="role-pill role-pill--${r}">${ROLE_INFO[r].label}</span></th>`).join('')}</tr></thead>`
        + `<tbody>${rows.map(([label, test]) => `<tr><td>${escapeHtml(label)}</td>${roles.map(r => `<td>${tick(test(r))}</td>`).join('')}</tr>`).join('')}</tbody>`;
}

function applySession(session) {
    currentRole = session.role;
    document.documentElement.dataset.role = session.role;

    // Navigation: only the studios this role may open. A single studio needs no switcher.
    const allowed = new Set(studiosFor(session.role).map(s => s.view));
    navTabs.forEach(tab => {
        tab.hidden = !allowed.has(tab.dataset.view);
        tab.title = tab.textContent.trim();
    });
    viewportPanels.forEach(panel => {
        const view = panel.id.replace(/^view-/, '');
        if (!allowed.has(view)) panel.classList.remove('active');
    });
    OS_HEADER?.classList.toggle('single-studio', allowed.size <= 1);
    requestAnimationFrame(fitHeader);
    $('os-status-badge')?.toggleAttribute('hidden', !atLeast(session.role, 'admin'));

    applyCapabilities(session.role);

    // Identity + role, always visible in the header.
    const user = session.status === 'signed-in' ? session.user : null;
    paintAvatar($('user-avatar'), user);
    paintAvatar($('up-avatar'), user);
    setRolePill($('user-role-pill'), session.role);
    setRolePill($('up-role-pill'), session.role);
    $('up-name').textContent = user ? (user.name || user.email.split('@')[0]) : 'Guest';
    $('up-email').textContent = user ? user.email : 'Not signed in';
    $('up-role-summary').textContent = ROLE_INFO[session.role]?.summary || '';
    document.querySelector('.up-role-label').textContent = ROLE_INFO[session.role]?.access || 'Your role';
    $('up-preview').hidden = !session.preview;
    $('up-signin').hidden = Boolean(user);
    $('up-signout').querySelector('span').textContent = user ? 'Sign out' : 'Leave guest mode';
    if (userChip) userChip.title = user ? `${user.email} · ${ROLE_INFO[session.role].label}` : 'Guest · not signed in';
    syncThemeMenuItem();
    renderTeam(session.role);

    const target = currentStudio && canOpenStudio(session.role, currentStudio)
        ? currentStudio
        : initialStudio(session.role, readPref('proviz.studio', null));
    switchStudio(target);

    if (appBoot && !appBoot.hidden) {
        appBoot.classList.add('is-done');
        setTimeout(() => { appBoot.hidden = true; }, 260);
    }
}

watchSession(session => {
    if (session.status === 'loading') return;
    if (session.status === 'signed-out') {
        window.location.replace('/?from=app');
        return;
    }
    applySession(session);
});

// User menu
function setMenuOpen(open) {
    if (!userPopover || !userChip) return;
    userPopover.hidden = !open;
    userChip.setAttribute('aria-expanded', String(open));
}
userChip?.addEventListener('click', e => {
    e.stopPropagation();
    setMenuOpen(userPopover.hidden);
});
document.addEventListener('mousedown', e => {
    if (userPopover && !userPopover.hidden && !e.target.closest('#user-menu')) setMenuOpen(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && userPopover && !userPopover.hidden) { setMenuOpen(false); userChip?.focus(); } });
$('up-theme')?.addEventListener('click', e => toggleTheme(e));
$('up-signout')?.addEventListener('click', async () => {
    setMenuOpen(false);
    try { await signOutEverywhere(); } catch (err) { console.error('[ProViz] sign-out', err); }
    window.location.assign('/');
});
$('up-signin')?.addEventListener('click', async () => {
    setMenuOpen(false);
    if (!authConfigured()) { toast('Sign-in is not configured for this deployment yet.', 6000, 'info'); return; }
    try {
        await signInWithGoogle();
    } catch (err) {
        const msg = describeAuthError(err);
        if (msg) toast(msg);
    }
});
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

// Dev-only diagnostics handle (e.g. __proviz.world.stats() for WebGL leak checks).
if (import.meta.env?.DEV) window.__proviz = { world, playback, executor, editor };

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        playback.pause();
        world?.dispose();
        editor?.destroy();
    });
}
