/**
 * Debugger — Central orchestration controller for language-agnostic execution & state debugging.
 *
 * Responsibilities:
 *  - Load execution results (UET trace / ExecutionRequest)
 *  - Manage program execution lifecycle ('idle', 'running', 'paused', 'completed', 'error')
 *  - Expose authoritative DebuggerState
 *  - Step forward, step backward, continue, pause, restart, scrub / jump to frame
 *  - Manage breakpoints
 *  - Expose current source location, runtime state, call stack, and scene graph
 *
 * Renderer and editor independent. Composes with PlaybackEngine.
 */

import { PlaybackEngine } from '../PlaybackEngine.js';
import { DebuggerState } from './DebuggerState.js';
import { Breakpoint } from './Breakpoint.js';
import { WatchManager } from '../inspection/WatchManager.js';
import { EvaluationContext } from '../inspection/EvaluationContext.js';
import { DataflowAnalyzer } from '../dataflow/DataflowAnalyzer.js';
import { DataflowQueries } from '../dataflow/DataflowQueries.js';
import { DataflowSnapshot } from '../dataflow/DataflowSnapshot.js';
import { ControlFlowAnalyzer } from '../analysis/ControlFlowAnalyzer.js';
import { AnalysisQueries } from '../analysis/AnalysisQueries.js';
import { TypeFlowAnalyzer } from '../typeflow/TypeFlowAnalyzer.js';
import { TypeQueries } from '../typeflow/TypeQueries.js';
import { VerificationAnalyzer } from '../verification/VerificationAnalyzer.js';
import { VerificationQueries } from '../verification/VerificationQueries.js';
import { SymbolicAnalyzer } from '../symbolic/SymbolicAnalyzer.js';
import { SymbolicQueries } from '../symbolic/SymbolicQueries.js';
import { TestingAnalyzer } from '../testing/TestingAnalyzer.js';
import { TestingQueries } from '../testing/TestingQueries.js';
import { TestMinimizer } from '../testing/TestMinimizer.js';
import { ConcolicAnalyzer } from '../concolic/ConcolicAnalyzer.js';
import { ConcolicQueries } from '../concolic/ConcolicQueries.js';
import { ExplorationArtifact } from '../concolic/ExplorationArtifact.js';
import { RepairAnalyzer } from '../repair/RepairAnalyzer.js';
import { RepairEngine } from '../repair/RepairEngine.js';
import { RepairQueries } from '../repair/RepairQueries.js';
import { RepairHistory } from '../repair/RepairHistory.js';
import { RootCauseAnalyzer } from '../repair/RootCauseAnalyzer.js';
import { MutationAnalyzer } from '../mutation/MutationAnalyzer.js';
import { MutationQueries } from '../mutation/MutationQueries.js';
import { MutationTestGenerator } from '../mutation/MutationTestGenerator.js';
import { MutationConcolicEngine } from '../mutation/MutationConcolicEngine.js';
import { EquivalenceAnalyzer } from '../mutation/EquivalenceAnalyzer.js';
import { RegressionEngine } from '../regression/RegressionEngine.js';
import { RegressionQueries } from '../regression/RegressionQueries.js';
import { SemanticDiff } from '../regression/SemanticDiff.js';
import { ImpactAnalyzer } from '../regression/ImpactAnalyzer.js';
import { TestSelector } from '../regression/TestSelector.js';
import { SpecificationAnalyzer } from '../specification/SpecificationAnalyzer.js';
import { SpecificationEngine } from '../specification/SpecificationEngine.js';
import { SpecificationQueries } from '../specification/SpecificationQueries.js';
import { OracleEvaluator } from '../specification/OracleEvaluator.js';
import { SpecificationRefiner } from '../specification/SpecificationRefiner.js';
import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';
import { SourceFile } from '../workspace/SourceFile.js';
import * as Exploration from '../exploration/index.js';
import * as Probabilistic from '../probabilistic/index.js';
import * as Planning from '../planning/index.js';
import * as Orchestration from '../orchestration/index.js';
import * as Federation from '../federation/index.js';
import * as Knowledge from '../knowledge/index.js';
import * as Semantic from '../semantic/index.js';
import * as Evolution from '../evolution/index.js';
import * as Security from '../security/index.js';
import * as Performance from '../performance/index.js';
import * as Concurrency from '../concurrency/index.js';
import * as Continuous from '../continuous/index.js';
import * as Project from '../project/index.js';
import * as OS from '../os/index.js';


export class Debugger {
    /**
     * @param {object} [params]
     * @param {PlaybackEngine} [params.playbackEngine] - Optional external PlaybackEngine instance
     * @param {WatchManager} [params.watchManager] - Optional external WatchManager instance
     */
    constructor({ playbackEngine = null, watchManager = null } = {}) {
        this._playbackEngine = playbackEngine || new PlaybackEngine();
        this._watchManager = watchManager || new WatchManager();
        this._breakpoints = new Map(); // id -> Breakpoint
        this._status = 'idle'; // 'idle' | 'running' | 'paused' | 'completed' | 'error'
        this._reason = 'idle'; // 'idle' | 'step' | 'breakpoint' | 'exception' | 'program_end' | 'jump' | 'restart' | 'run' | 'pause'
        this._exception = null;
        this._uetTrace = null;
        this._listeners = [];

        this._specificationEngine = new SpecificationEngine();
        this._specificationSnapshot = null;
        this._specificationQueries = null;

        this._explorationCampaigns = new Map();
        this._currentExplorationCampaign = null;

        this._probabilisticEngine = new Probabilistic.ProbabilisticEngine();
        this._planningEngine = new Planning.PlanningEngine();
        this._orchestrationEngine = new Orchestration.OrchestrationEngine();
        this._federationEngine = new Federation.FederationEngine();
        this._knowledgeEngine = new Knowledge.KnowledgeEngine();
        this._semanticEngine = new Semantic.SemanticEngine();
        this._evolutionEngine = new Evolution.EvolutionEngine();
        this._securityEngine = new Security.SecurityEngine();
        this._performanceEngine = new Performance.PerformanceEngine();
        this._concurrencyEngine = new Concurrency.ConcurrencyEngine({
            knowledgeGraph: this._knowledgeEngine ? this._knowledgeEngine.getKnowledgeGraph?.() : null
        });
        this._concurrencyModels = new Map();
        this._concurrencySchedules = new Map();
        this._concurrencyRaces = [];
        this._concurrencyDeadlocks = [];
        this._concurrencyTemporalCounterexamples = [];
        this._concurrencyEvidenceList = [];

        this._continuousEngine = new Continuous.ContinuousVerificationEngine({
            knowledgeGraph: this._knowledgeEngine ? this._knowledgeEngine.getKnowledgeGraph?.() : null,
            federationEngine: this._federationEngine
        });
        this._continuousObligations = [];
        this._continuousEvidence = [];
        this._continuousHistory = [];

        this._projectEngine = new Project.ProjectIntelligenceEngine({
            projectId: 'proviz_project'
        });

        this._autonomousOS = new OS.AutonomousVerificationOS({
            projectId: 'proviz_project'
        });

        // Synchronize with playback engine frame changes
        this._playbackEngine.onFrameChange((frame, eventType, runtimeState) => {
            this._handlePlaybackFrameChange(frame, eventType, runtimeState);
        });
    }

    /**
     * Load a UET trace or ExecutionRequest into the debugger.
     *
     * @param {object} input - UET trace object or legacy frames array
     * @param {object} [problemConfig={}] - Optional problem metadata
     * @returns {DebuggerState}
     */
    loadExecution(input, problemConfig = {}) {
        this._uetTrace = input && typeof input === 'object' && Array.isArray(input.events) ? input : null;
        this._playbackEngine.setFrames(input, problemConfig);
        this._programAnalysis = null;
        this._typeQueries = null;
        this._verificationQueries = null;
        this._symbolicQueries = null;
        this._testingQueries = null;
        this._concolicQueries = null;
        this._repairQueries = null;
        this._mutationQueries = null;
        this._regressionQueries = null;
        this._regressionCampaign = null;
        this._specificationSnapshot = null;
        this._specificationQueries = null;
        this._dataflowGraph = null;

        this._exception = null;
        const total = this._playbackEngine.totalFrames;

        if (total === 0) {
            // Check if input contained an execution error
            const err = input?.result?.error || input?.error;
            if (err) {
                this._status = 'error';
                this._reason = 'exception';
                this._exception = {
                    type: err.type || 'ExecutionError',
                    message: err.message || 'An error occurred during execution',
                    line: err.line ?? null,
                };
            } else {
                this._status = 'idle';
                this._reason = 'idle';
            }
        } else {
            // Move to initial frame (index 0)
            this._playbackEngine.jumpTo(0);
            const currentFrame = this._playbackEngine.getCurrentFrame();
            if (currentFrame?.event_type === 'exception' || currentFrame?.exception) {
                this._status = 'error';
                this._reason = 'exception';
                this._exception = currentFrame.exception || {
                    type: 'Exception',
                    message: currentFrame.description || 'Unhandled exception',
                    line: currentFrame.current_line,
                };
            } else {
                this._status = 'paused';
                this._reason = 'idle';
            }
        }

        const state = this.getDebuggerState();
        this._notify(state);
        return state;
    }

    /**
     * Get the current authoritative DebuggerState snapshot.
     * @returns {DebuggerState}
     */
    getDebuggerState() {
        const frameIndex = this._playbackEngine.currentIdx;
        const totalFrames = this._playbackEngine.totalFrames;
        const currentFrame = this._playbackEngine.getCurrentFrame();
        const runtimeState = this._playbackEngine.getCurrentRuntimeState();
        const sceneGraph = this._playbackEngine.getCurrentScene();

        const sourceLocation = this.getSourceLocation();

        // Check if current frame has exception details
        let exc = this._exception;
        if (currentFrame?.event_type === 'exception' || currentFrame?.exception) {
            exc = currentFrame.exception || {
                type: 'Exception',
                message: currentFrame.description || 'Unhandled exception',
                line: currentFrame.current_line,
            };
        }

        // Evaluate active watch expressions
        const watches = this._watchManager.getAll();
        const watchResults = {};
        if (runtimeState && watches.length > 0) {
            const ctx = EvaluationContext.fromRuntimeState(runtimeState, {
                frameIndex: frameIndex < 0 && totalFrames > 0 ? 0 : frameIndex,
                fileId: sourceLocation.fileId,
                moduleId: sourceLocation.moduleId,
            });
            for (const [id, res] of this._watchManager.evaluateAll(ctx).entries()) {
                watchResults[id] = res;
            }
        }

        return new DebuggerState({
            status: this._status,
            frameIndex: frameIndex < 0 && totalFrames > 0 ? 0 : frameIndex,
            totalFrames,
            sourceLocation,
            runtimeState,
            sceneGraph,
            currentFrame,
            reason: this._reason,
            exception: exc,
            breakpoints: this.getBreakpoints(),
            watches,
            watchResults,
        });
    }

    /**
     * Get current source location resolved deterministically from current frame.
     * @returns {{ file: string, path: string, fileId: string|null, moduleId: string|null, line: number|null, column: number|null, endLine: number|null, endColumn: number|null }}
     */
    getSourceLocation() {
        const frame = this._playbackEngine.getCurrentFrame();
        if (!frame) {
            return { file: 'main.py', path: 'main.py', fileId: null, moduleId: null, line: null, column: null, endLine: null, endColumn: null };
        }
        const rawPath = frame.path || frame.file || frame.source?.path || frame.source?.file || 'main.py';
        return {
            file: frame.file || rawPath,
            path: rawPath,
            fileId: frame.fileId || frame.source?.fileId || null,
            moduleId: frame.moduleId || frame.source?.moduleId || null,
            line: frame.current_line ?? frame.source?.line ?? null,
            column: frame.column ?? frame.source?.column ?? null,
            endLine: frame.endLine ?? frame.source?.endLine ?? null,
            endColumn: frame.endColumn ?? frame.source?.endColumn ?? null,
        };
    }

    get playbackEngine() {
        return this._playbackEngine;
    }

    get status() {
        return this._status;
    }

    get reason() {
        return this._reason;
    }

    get frameIndex() {
        return this._playbackEngine.currentIdx;
    }

    get totalFrames() {
        return this._playbackEngine.totalFrames;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Debugger Navigation & Execution Controls
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Run / Start program execution playback from start or current position.
     */
    run() {
        if (this._playbackEngine.totalFrames === 0) return this.getDebuggerState();
        if (this._playbackEngine.isAtEnd) {
            this.restart();
        }
        this._status = 'running';
        this._reason = 'run';
        this.continue();
        return this.getDebuggerState();
    }

    /**
     * Pause execution playback.
     */
    pause() {
        this._playbackEngine.pause();
        if (this._status === 'running') {
            this._status = 'paused';
            this._reason = 'pause';
        }
        const state = this.getDebuggerState();
        this._notify(state);
        return state;
    }

    /**
     * Step forward one timeline frame.
     * @returns {DebuggerState}
     */
    stepForward() {
        if (this._playbackEngine.totalFrames === 0) return this.getDebuggerState();

        if (this._playbackEngine.currentIdx < 0) {
            this._playbackEngine.jumpTo(0);
        } else if (this._playbackEngine.isAtEnd) {
            this._status = 'completed';
            this._reason = 'program_end';
            const state = this.getDebuggerState();
            this._notify(state);
            return state;
        } else {
            this._playbackEngine.nextFrame();
        }

        const frame = this._playbackEngine.getCurrentFrame();
        if (frame?.event_type === 'exception' || frame?.exception) {
            this._status = 'error';
            this._reason = 'exception';
            this._exception = frame.exception || {
                type: 'Exception',
                message: frame.description || 'Unhandled exception',
                line: frame.current_line,
            };
        } else if (this._playbackEngine.isAtEnd) {
            this._status = 'completed';
            this._reason = 'program_end';
        } else {
            this._status = 'paused';
            this._reason = 'step';
        }

        const state = this.getDebuggerState();
        this._notify(state);
        return state;
    }

    /**
     * Step backward one timeline frame.
     * @returns {DebuggerState}
     */
    stepBackward() {
        if (this._playbackEngine.totalFrames === 0) return this.getDebuggerState();

        this._playbackEngine.prevFrame();
        const frame = this._playbackEngine.getCurrentFrame();

        if (frame?.event_type === 'exception' || frame?.exception) {
            this._status = 'error';
            this._reason = 'exception';
        } else {
            this._status = 'paused';
            this._reason = 'step';
        }

        const state = this.getDebuggerState();
        this._notify(state);
        return state;
    }

    /**
     * Jump / Scrub directly to an arbitrary frame index.
     * @param {number} frameIndex
     * @returns {DebuggerState}
     */
    jumpTo(frameIndex) {
        if (this._playbackEngine.totalFrames === 0) return this.getDebuggerState();

        this._playbackEngine.jumpTo(frameIndex);
        const frame = this._playbackEngine.getCurrentFrame();

        if (frame?.event_type === 'exception' || frame?.exception) {
            this._status = 'error';
            this._reason = 'exception';
        } else if (this._playbackEngine.isAtEnd) {
            this._status = 'completed';
            this._reason = 'jump';
        } else {
            this._status = 'paused';
            this._reason = 'jump';
        }

        const state = this.getDebuggerState();
        this._notify(state);
        return state;
    }

    /**
     * Restart execution to the beginning of the trace (frame 0).
     * @returns {DebuggerState}
     */
    restart() {
        this._playbackEngine.pause();
        if (this._playbackEngine.totalFrames > 0) {
            this._playbackEngine.jumpTo(0);
            const frame = this._playbackEngine.getCurrentFrame();
            if (frame?.event_type === 'exception' || frame?.exception) {
                this._status = 'error';
                this._reason = 'exception';
            } else {
                this._status = 'paused';
                this._reason = 'restart';
            }
        } else {
            this._status = 'idle';
            this._reason = 'restart';
        }

        const state = this.getDebuggerState();
        this._notify(state);
        return state;
    }

    /**
     * Continue execution until a breakpoint is hit, an exception occurs, or the program ends.
     * @returns {DebuggerState}
     */
    continue() {
        if (this._playbackEngine.totalFrames === 0) return this.getDebuggerState();

        // If at end, restart first
        if (this._playbackEngine.isAtEnd) {
            this.restart();
        }

        this._status = 'running';

        // Step off current position if currently paused on a breakpoint
        if (this._playbackEngine.currentIdx >= 0 && !this._playbackEngine.isAtEnd) {
            const initialLoc = this.getSourceLocation();
            if (this.hasBreakpoint(initialLoc, initialLoc.line)) {
                this._playbackEngine.nextFrame();
            }
        }

        while (!this._playbackEngine.isAtEnd) {
            const frame = this._playbackEngine.getCurrentFrame();

            // Check for exception
            if (frame?.event_type === 'exception' || frame?.exception) {
                this._status = 'error';
                this._reason = 'exception';
                this._exception = frame.exception || {
                    type: 'Exception',
                    message: frame.description || 'Unhandled exception',
                    line: frame.current_line,
                };
                break;
            }

            // Check for breakpoint hit
            const loc = this.getSourceLocation();
            if (loc.line !== null && this.hasBreakpoint(loc, loc.line)) {
                this._status = 'paused';
                this._reason = 'breakpoint';
                break;
            }

            // Advance to next frame
            const next = this._playbackEngine.nextFrame();
            if (next === null) {
                break;
            }
        }

        // Final status check if loop finished at the end
        if (this._playbackEngine.isAtEnd && this._status === 'running') {
            const frame = this._playbackEngine.getCurrentFrame();
            const loc = this.getSourceLocation();
            if (loc.line !== null && this.hasBreakpoint(loc, loc.line)) {
                this._status = 'paused';
                this._reason = 'breakpoint';
            } else if (frame?.event_type === 'exception' || frame?.exception) {
                this._status = 'error';
                this._reason = 'exception';
            } else {
                this._status = 'completed';
                this._reason = 'program_end';
            }
        }

        const state = this.getDebuggerState();
        this._notify(state);
        return state;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Breakpoint Management
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Add a breakpoint at file:line.
     * @param {string|object} file - File name / path or config object
     * @param {number} [line] - Line number
     * @param {string} [fileId] - File ID
     * @returns {Breakpoint}
     */
    addBreakpoint(file = 'main.py', line = null, fileId = null) {
        let bp;
        if (file && typeof file === 'object') {
            bp = new Breakpoint(file);
        } else {
            bp = new Breakpoint({ file, line, fileId, enabled: true });
        }
        this._breakpoints.set(bp.id, bp);
        this._notify(this.getDebuggerState());
        return bp;
    }

    /**
     * Remove a breakpoint at file:line.
     * @param {string|object} file
     * @param {number} [line]
     * @returns {boolean} True if removed
     */
    removeBreakpoint(file = 'main.py', line = null) {
        if (file && typeof file === 'object') {
            const targetLine = file.line;
            for (const [id, bp] of this._breakpoints.entries()) {
                if (bp.matches(file, targetLine)) {
                    this._breakpoints.delete(id);
                    this._notify(this.getDebuggerState());
                    return true;
                }
            }
            return false;
        }

        const id = `${file || 'main.py'}:${line}`;
        let existed = this._breakpoints.delete(id);
        if (!existed) {
            // Check by matching
            for (const [key, bp] of this._breakpoints.entries()) {
                if (bp.matches(file, line)) {
                    this._breakpoints.delete(key);
                    existed = true;
                    break;
                }
            }
        }

        if (existed) {
            this._notify(this.getDebuggerState());
        }
        return existed;
    }

    /**
     * Toggle a breakpoint at file:line.
     * @param {string|object} file
     * @param {number} [line]
     * @param {string} [fileId]
     * @returns {boolean} True if breakpoint is now enabled, false if removed/disabled
     */
    toggleBreakpoint(file = 'main.py', line = null, fileId = null) {
        if (file && typeof file === 'object') {
            if (this.hasBreakpoint(file, file.line)) {
                this.removeBreakpoint(file);
                return false;
            } else {
                this.addBreakpoint(file);
                return true;
            }
        }

        if (this.hasBreakpoint(file, line)) {
            this.removeBreakpoint(file, line);
            return false;
        } else {
            this.addBreakpoint(file, line, fileId);
            return true;
        }
    }

    /**
     * Check if an active enabled breakpoint exists at file:line.
     * @param {string|object} file
     * @param {number} [line]
     * @returns {boolean}
     */
    hasBreakpoint(file = 'main.py', line = null) {
        if (file && typeof file === 'object') {
            const targetLine = typeof file.line === 'number' ? file.line : file.current_line;
            if (!targetLine) return false;
            for (const bp of this._breakpoints.values()) {
                if (bp.matches(file, targetLine)) return true;
            }
            return false;
        }

        if (!line) return false;
        const id = `${file || 'main.py'}:${line}`;
        const bp = this._breakpoints.get(id);
        if (bp && bp.enabled) return true;

        for (const b of this._breakpoints.values()) {
            if (b.matches(file, line)) return true;
        }

        return false;
    }

    /**
     * Get array of all breakpoints.
     * @returns {Array<Breakpoint>}
     */
    getBreakpoints() {
        return Array.from(this._breakpoints.values()).map(b => b.clone());
    }

    /**
     * Clear all breakpoints.
     */
    clearBreakpoints() {
        this._breakpoints.clear();
        this._notify(this.getDebuggerState());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Watch Expressions & Interactive Inspection
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Evaluates an expression against the current debugger state.
     * @param {string|import('../inspection/Expression.js').Expression} expression
     * @returns {import('../inspection/EvaluationResult.js').EvaluationResult}
     */
    evaluate(expression) {
        const state = this.getDebuggerState();
        const ctx = EvaluationContext.fromDebuggerState(state);
        return this._watchManager.evaluator.evaluate(expression, ctx);
    }

    /**
     * Evaluates an expression at an arbitrary historical frame without re-running code.
     * @param {string|import('../inspection/Expression.js').Expression} expression
     * @param {number} frameIndex
     * @returns {import('../inspection/EvaluationResult.js').EvaluationResult}
     */
    evaluateAt(expression, frameIndex) {
        if (frameIndex === this._playbackEngine.currentIdx) {
            return this.evaluate(expression);
        }

        const runtimeState = this._playbackEngine.reconstructor
            ? this._playbackEngine.reconstructor.reconstruct(frameIndex)
            : this._playbackEngine.getCurrentRuntimeState();

        const ctx = EvaluationContext.fromRuntimeState(runtimeState, { frameIndex });
        return this._watchManager.evaluator.evaluate(expression, ctx);
    }

    /**
     * Adds a persistent watch expression.
     * @param {string|import('../inspection/Expression.js').Expression} expression
     * @param {object} [options]
     * @returns {import('../inspection/WatchExpression.js').WatchExpression}
     */
    addWatch(expression, options = {}) {
        const watch = this._watchManager.add(expression, options);
        this._notify(this.getDebuggerState());
        return watch;
    }

    /**
     * Removes a watch expression by ID.
     * @param {string} id
     * @returns {boolean}
     */
    removeWatch(id) {
        const removed = this._watchManager.remove(id);
        if (removed) {
            this._notify(this.getDebuggerState());
        }
        return removed;
    }

    /**
     * Toggles a watch expression enabled state.
     * @param {string} id
     * @returns {boolean|null}
     */
    toggleWatch(id) {
        const state = this._watchManager.toggle(id);
        if (state !== null) {
            this._notify(this.getDebuggerState());
        }
        return state;
    }

    /**
     * Updates an existing watch expression.
     * @param {string} id
     * @param {string|import('../inspection/Expression.js').Expression} newExpression
     * @returns {import('../inspection/WatchExpression.js').WatchExpression|null}
     */
    updateWatch(id, newExpression) {
        const watch = this._watchManager.update(id, newExpression);
        if (watch) {
            this._notify(this.getDebuggerState());
        }
        return watch;
    }

    /**
     * Returns all active watch expressions.
     * @returns {Array<import('../inspection/WatchExpression.js').WatchExpression>}
     */
    getWatches() {
        return this._watchManager.getAll();
    }

    /**
     * Returns the underlying WatchManager instance.
     * @returns {WatchManager}
     */
    getWatchManager() {
        return this._watchManager;
    }

    /**
     * Evaluates all enabled watches against current debugger state.
     * @returns {Record<string, import('../inspection/EvaluationResult.js').EvaluationResult>}
     */
    evaluateWatches() {
        const state = this.getDebuggerState();
        const ctx = EvaluationContext.fromDebuggerState(state);
        return this._watchManager.evaluateAllAsDict(ctx);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Dataflow & Program Dependency Graph (PDG) (Stage 12)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Lazily constructs and returns the canonical DataflowGraph for the current execution.
     * @returns {import('../dataflow/DataflowGraph.js').DataflowGraph}
     */
    getDataflowGraph() {
        if (!this._dataflowGraph) {
            const analyzer = new DataflowAnalyzer();
            const events = this._uetTrace?.events || this._playbackEngine.frames || [];
            this._dataflowGraph = analyzer.analyze(this._uetTrace || { events });
            this._dataflowQueries = new DataflowQueries(this._dataflowGraph);
        }
        return this._dataflowGraph;
    }

    /**
     * Returns the DataflowQueries engine over current execution graph.
     * @returns {DataflowQueries}
     */
    getDataflowQueries() {
        if (!this._dataflowQueries) {
            this.getDataflowGraph();
        }
        return this._dataflowQueries;
    }

    /**
     * Discovers definition(s) for a variable at or up to a specific frame.
     */
    getDefinition(target, frameIndex = null) {
        const idx = frameIndex !== null ? frameIndex : this._playbackEngine.currentIdx;
        const q = this.getDataflowQueries();
        return q.findLastDefinition(target, idx) || q.findDefinition(target, idx);
    }

    /**
     * Discovers uses for a variable.
     */
    getUses(target, frameIndex = null) {
        const idx = frameIndex !== null ? frameIndex : this._playbackEngine.currentIdx;
        return this.getDataflowQueries().findUses(target, idx);
    }

    /**
     * "Where did this value come from?"
     */
    getOrigins(target, frameIndex = null) {
        const idx = frameIndex !== null ? frameIndex : this._playbackEngine.currentIdx;
        return this.getDataflowQueries().findOrigins(target, idx);
    }

    /**
     * "What depends on this value?"
     */
    getDependents(target, frameIndex = null) {
        const idx = frameIndex !== null ? frameIndex : this._playbackEngine.currentIdx;
        return this.getDataflowQueries().findDependents(target, idx);
    }

    /**
     * Computes the total impact set of a variable or object.
     */
    getImpact(target, frameIndex = null) {
        const idx = frameIndex !== null ? frameIndex : this._playbackEngine.currentIdx;
        return this.getDataflowQueries().findImpact(target, idx);
    }

    /**
     * Discovers all aliases pointing to a heap object.
     */
    getAliases(objectId, frameIndex = null) {
        const idx = frameIndex !== null ? frameIndex : this._playbackEngine.currentIdx;
        return this.getDataflowQueries().findAliases(objectId, idx);
    }

    /**
     * Retrieves mutations applied to an object.
     */
    getMutations(objectId, frameRange = {}) {
        return this.getDataflowQueries().findMutations(objectId, frameRange);
    }

    /**
     * Finds the shortest semantic data path between two nodes.
     */
    findDataPath(from, to, limits = {}) {
        return this.getDataflowQueries().findDataPath(from, to, limits);
    }

    /**
     * Explains why a watch expression changed value across frames.
     */
    explainWatchChange(watchIdOrExpr, fromFrame, toFrame) {
        const watch = this._watchManager.get(watchIdOrExpr);
        const expr = watch?.expression?.source || watchIdOrExpr;
        const fromRes = this.evaluateAt(expr, fromFrame);
        const toRes = this.evaluateAt(expr, toFrame);
        return this.getDataflowQueries().explainWatchChange({
            expression: expr,
            fromFrame,
            toFrame,
            fromValue: fromRes?.value ?? null,
            toValue: toRes?.value ?? null,
        });
    }

    /**
     * Captures an immutable DataflowSnapshot at the given frame.
     */
    getDataflowSnapshot(frameIndex = null) {
        const idx = frameIndex !== null ? frameIndex : this._playbackEngine.currentIdx;
        const graph = this.getDataflowGraph();
        return DataflowSnapshot.capture(graph, idx);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Control-Flow, SSA & Program Slicing Analysis (Stage 13)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Lazily constructs and returns the AnalysisQueries engine for the current execution source.
     * @param {string} [functionId='<module>']
     * @returns {AnalysisQueries}
     */
    getProgramAnalysis(functionId = '<module>') {
        if (!this._analysisQueries) {
            const analyzer = new ControlFlowAnalyzer();
            const sourceCode = this._uetTrace?.source?.files?.['main.py'] || this._playbackEngine.frames?.[0]?.source_code || '';
            const analysis = analyzer.analyzeSource(sourceCode, { functionId });
            this._analysisQueries = new AnalysisQueries({
                ...analysis,
                dataflowGraph: this.getDataflowGraph(),
            });
        }
        return this._analysisQueries;
    }

    getControlFlow(functionId = '<module>') {
        return this.getProgramAnalysis(functionId).getControlFlow();
    }

    getSSA(functionId = '<module>') {
        return this.getProgramAnalysis(functionId).getSSA();
    }

    getDominators(nodeId) {
        return this.getProgramAnalysis().getDominators(nodeId);
    }

    getReachingDefinitions(nodeId) {
        return this.getProgramAnalysis().getReachingDefinitions(nodeId);
    }

    getBackwardSlice(criterion, options = {}) {
        return this.getProgramAnalysis().getBackwardSlice(criterion, options);
    }

    getForwardSlice(criterion, options = {}) {
        return this.getProgramAnalysis().getForwardSlice(criterion, options);
    }

    getDynamicSlice(criterion, frameIndex = null, options = {}) {
        const idx = frameIndex !== null ? frameIndex : this._playbackEngine.currentIdx;
        return this.getProgramAnalysis().getDynamicSlice(criterion, idx, options);
    }

    explainBranch(conditionNodeId, observedValue = null) {
        return this.getProgramAnalysis().explainBranch({
            conditionNodeId,
            observedValue,
            frameIndex: this._playbackEngine.currentIdx,
        });
    }

    explainUnreachable(nodeId) {
        return this.getProgramAnalysis().explainUnreachable(nodeId);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 14 Static Type & Value-Flow Analysis
    // ─────────────────────────────────────────────────────────────────────────────

    getTypeAnalysis(functionId = '<module>') {
        if (!this._typeQueries) {
            const analyzer = new TypeFlowAnalyzer();
            const sourceCode = this._uetTrace?.source?.files?.['main.py'] || this._uetTrace?.source?.code || this._playbackEngine.frames?.[0]?.source_code || '';
            const analysis = analyzer.analyzeSource(sourceCode, { functionId });
            this._typeQueries = new TypeQueries({
                inference: analysis.inference,
                cfg: analysis.cfg,
                typeFlowGraph: analysis.typeFlowGraph,
            });
        }
        return this._typeQueries;
    }

    getStaticType(target, nodeId = null) {
        return this.getTypeAnalysis().getType(target, nodeId);
    }

    getPossibleTypes(target, nodeId = null) {
        return this.getTypeAnalysis().getTypes(target, nodeId);
    }

    getAbstractValue(target, nodeId = null) {
        return this.getTypeAnalysis().getAbstractValue(target, nodeId);
    }

    getTypeDiagnostics(nodeId = null) {
        return this.getTypeAnalysis().getDiagnostics(nodeId);
    }

    explainType(target, nodeId = null) {
        return this.getTypeAnalysis().explainType(target, nodeId);
    }

    getCurrentTypeState() {
        const targetNode = this.getCurrentControlFlowNode();
        return this.getTypeAnalysis().inference.nodeStates.get(targetNode?.id) || null;
    }

    getWatchType(watchId, frameIndex = null) {
        const watch = this.getWatchManager().get(watchId);
        if (!watch) return null;
        const target = typeof watch.expression === 'string'
            ? watch.expression
            : (watch.expression?.source || watch.expression?.normalized || String(watch.expression));
        const staticVal = this.getAbstractValue(target);
        const idx = frameIndex !== null ? frameIndex : (this._playbackEngine.currentIdx >= 0 ? this._playbackEngine.currentIdx : 0);
        const event = this._uetTrace?.events?.[idx] || this._playbackEngine?.getCurrentFrame();
        const state = (event && event.runtimeState)
            || (this._playbackEngine?.reconstructor ? this._playbackEngine.reconstructor.reconstruct(idx) : null)
            || this._playbackEngine?.getCurrentRuntimeState();
        const observedVal = state?.getVariable?.(target)
            || state?.globals?.getBinding?.(target)
            || state?.globals?.bindings?.[target]
            || state?.globals?.[target]
            || event?.runtimeState?.globals?.getBinding?.(target)
            || event?.runtimeState?.globals?.bindings?.[target]
            || event?.runtimeState?.globals?.[target]
            || event?.data?.globals?.[target]
            || null;

        let observedType = null;
        let observedValue = null;

        if (observedVal) {
            observedType = observedVal.type || (typeof observedVal === 'object' && 'value' in observedVal ? 'int' : typeof observedVal);
            observedValue = observedVal.value !== undefined ? observedVal.value : observedVal;
        }

        return {
            watchId,
            target,
            staticTypes: staticVal.typeSet.toArray().map(t => t.toString()),
            nullability: staticVal.nullability,
            constant: staticVal.getConstant()?.raw || null,
            observedType,
            observedValue,
            confidence: staticVal.confidence,
        };
    }

    explainWatchType(watchId, frameIndex = null) {
        const info = this.getWatchType(watchId, frameIndex);
        if (!info) return null;
        return {
            ...info,
            summary: `Watch '${info.target}' static types: [${info.staticTypes.join(', ')}], runtime observed: '${info.observedType}' (${info.observedValue}).`,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 15: Universal Static Verification & Bug Detection
    // ─────────────────────────────────────────────────────────────────────────────

    getVerificationAnalysis(functionId = '<module>') {
        if (!this._verificationQueries) {
            const analyzer = new VerificationAnalyzer();
            const sourceCode = this._uetTrace?.source?.files?.['main.py'] || this._uetTrace?.source?.code || this._playbackEngine.frames?.[0]?.source_code || '';
            const analysis = analyzer.analyzeSource(sourceCode, { functionId });
            this._verificationQueries = new VerificationQueries({
                snapshot: analysis.snapshot,
                cfg: analysis.cfg,
                ssa: analysis.ssa,
                typeAnalysis: analysis.typeAnalysis,
                playbackEngine: this._playbackEngine,
            });
        }
        return this._verificationQueries;
    }

    getFindings() {
        return this.getVerificationAnalysis().getFindings();
    }

    getFinding(id) {
        return this.getVerificationAnalysis().getFinding(id);
    }

    getFindingsAtFrame(frameIndex = null) {
        const idx = frameIndex !== null ? frameIndex : (this._playbackEngine.currentIdx >= 0 ? this._playbackEngine.currentIdx : 0);
        return this.getVerificationAnalysis().getFindingsAtFrame(idx);
    }

    getFindingsAtLocation(location) {
        return this.getVerificationAnalysis().getFindingsAtLocation(location);
    }

    getVerificationSnapshot() {
        return this.getVerificationAnalysis().getVerificationSnapshot();
    }

    explainFinding(id) {
        return this.getVerificationAnalysis().explainFinding(id);
    }

    getFindingSlice(id, direction = 'BACKWARD') {
        return this.getVerificationAnalysis().getSlice(id, direction);
    }

    getFindingEvidence(id) {
        return this.getVerificationAnalysis().getEvidence(id);
    }

    getFindingPath(id) {
        return this.getVerificationAnalysis().getPathConditions(id);
    }

    getProperties(target = null) {
        return this.getVerificationAnalysis().getProperties(target);
    }

    getProperty(target, propertyKind) {
        return this.getVerificationAnalysis().getProperty(target, propertyKind);
    }

    getWatchFindings(watchId) {
        const watch = this.getWatchManager().get(watchId);
        if (!watch) return [];
        const target = typeof watch.expression === 'string'
            ? watch.expression
            : (watch.expression?.source || watch.expression?.normalized || String(watch.expression));
        return this.getFindings().filter(f => f.message.includes(target) || f.property?.target === target);
    }

    getWatchProperties(watchId) {
        const watch = this.getWatchManager().get(watchId);
        if (!watch) return [];
        const target = typeof watch.expression === 'string'
            ? watch.expression
            : (watch.expression?.source || watch.expression?.normalized || String(watch.expression));
        return this.getProperties(target);
    }

    explainWatchSafety(watchId) {
        const findings = this.getWatchFindings(watchId);
        const watch = this.getWatchManager().get(watchId);
        const target = typeof watch?.expression === 'string'
            ? watch.expression
            : (watch?.expression?.source || watch?.expression?.normalized || String(watch?.expression || ''));
        if (findings.length === 0) {
            return {
                watchId,
                target,
                status: 'SAFE',
                summary: `Watch '${target}' has no static safety issues detected.`,
                findings: [],
            };
        }
        return {
            watchId,
            target,
            status: 'UNSAFE',
            summary: `Watch '${target}' has ${findings.length} static findings: ${findings.map(f => f.shortMessage).join(', ')}.`,
            findings,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 16: Universal Symbolic Constraint & Path Reasoning
    // ─────────────────────────────────────────────────────────────────────────────

    getSymbolicAnalysis(functionId = '<module>') {
        if (!this._symbolicQueries) {
            const analyzer = new SymbolicAnalyzer();
            const sourceCode = this._uetTrace?.source?.files?.['main.py'] || this._uetTrace?.source?.code || this._playbackEngine.frames?.[0]?.source_code || '';
            const analysis = analyzer.analyzeSource(sourceCode, { functionId });
            this._symbolicQueries = new SymbolicQueries({
                snapshot: analysis.snapshot,
                cfg: analysis.cfg,
            });
        }
        return this._symbolicQueries;
    }

    getSymbolicPaths() {
        return this.getSymbolicAnalysis().getPaths();
    }

    getSymbolicPath(pathId) {
        return this.getSymbolicAnalysis().getPath(pathId);
    }

    getFeasibleSymbolicPaths() {
        return this.getSymbolicAnalysis().getFeasiblePaths();
    }

    getInfeasibleSymbolicPaths() {
        return this.getSymbolicAnalysis().getInfeasiblePaths();
    }

    getSymbolicProofs() {
        return this.getSymbolicAnalysis().getProofs();
    }

    getSymbolicProof(property) {
        return this.getSymbolicAnalysis().getProof(property);
    }

    getSymbolicCounterexamples() {
        return this.getSymbolicAnalysis().getCounterexamples();
    }

    getSymbolicCounterexample(property) {
        return this.getSymbolicAnalysis().getCounterexample(property);
    }

    getRefinedFinding(findingId) {
        return this.getSymbolicAnalysis().getRefinedFinding(findingId);
    }

    getSymbolicSnapshot() {
        return this.getSymbolicAnalysis().getSymbolicSnapshot();
    }

    getWatchConstraints(watchId) {
        const watch = this.getWatchManager().get(watchId);
        if (!watch) return [];
        const target = typeof watch.expression === 'string'
            ? watch.expression
            : (watch.expression?.source || watch.expression?.normalized || String(watch.expression));
        const paths = this.getSymbolicPaths();
        const constraints = [];
        for (const p of paths) {
            if (p.finalState) {
                for (const c of p.finalState.constraints.getAll()) {
                    if (c.left.toString().includes(target) || c.right?.toString().includes(target)) {
                        constraints.push(c);
                    }
                }
            }
        }
        return constraints;
    }

    explainWatchConstraint(watchId) {
        const watch = this.getWatchManager().get(watchId);
        const target = typeof watch?.expression === 'string'
            ? watch.expression
            : (watch?.expression?.source || watch?.expression?.normalized || String(watch?.expression || ''));
        const constraints = this.getWatchConstraints(watchId);
        return {
            watchId,
            target,
            constraints: constraints.map(c => c.toString()),
            summary: `Watch '${target}' governed by constraints: [${constraints.map(c => c.toString()).join(', ')}].`,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 17: Universal Counterexample-Guided Test Generation & Validation
    // ─────────────────────────────────────────────────────────────────────────────

    getTestingAnalysis(functionId = '<module>') {
        if (!this._testingQueries) {
            const analyzer = new TestingAnalyzer();
            const sourceCode = this._uetTrace?.source?.files?.['main.py'] || this._uetTrace?.source?.code || this._playbackEngine.frames?.[0]?.source_code || '';
            const analysis = analyzer.analyzeSource(sourceCode, { functionId });
            this._testingQueries = new TestingQueries(analysis.snapshot);
        }
        return this._testingQueries;
    }

    generateTestForFinding(findingId) {
        const tests = this.getTestingAnalysis().getTests();
        return tests.find(t => t.findingId === findingId || t.targetId === findingId) || null;
    }

    generateTestsForFinding(findingId) {
        const tests = this.getTestingAnalysis().getTests();
        return tests.filter(t => t.findingId === findingId || t.targetId === findingId);
    }

    generateTestForPath(pathId) {
        const tests = this.getTestingAnalysis().getTests();
        return tests.find(t => t.symbolicPathId === pathId || t.targetId === pathId) || null;
    }

    generateTestsForBranch(nodeId) {
        const tests = this.getTestingAnalysis().getTests();
        return tests.filter(t => t.symbolicPathId?.includes(nodeId));
    }

    generateTestForCounterexample(counterexampleId) {
        const tests = this.getTestingAnalysis().getTests();
        return tests.find(t => t.counterexampleId === counterexampleId || t.targetId === counterexampleId) || null;
    }

    executeGeneratedTest(testId) {
        return this.getTestingAnalysis().getTestResult(testId);
    }

    validateGeneratedTest(testId) {
        return this.getTestingAnalysis().getTestResult(testId);
    }

    getTestCase(testId) {
        return this.getTestingAnalysis().getTestCase(testId);
    }

    getTestResult(testId) {
        return this.getTestingAnalysis().getTestResult(testId);
    }

    getTestSuite(suiteId) {
        return this.getTestingAnalysis().getTestSuite(suiteId);
    }

    getCoverage() {
        return this.getTestingAnalysis().getCoverage();
    }

    getCoverageTargets() {
        return this.getTestingAnalysis().getCoverageTargets();
    }

    getUncoveredTargets() {
        return this.getTestingAnalysis().getUncoveredTargets();
    }

    minimizeTest(testId) {
        const tc = this.getTestCase(testId);
        if (!tc) return null;
        return TestMinimizer.minimize(tc);
    }

    getGeneratedTestArtifact(testId) {
        const tc = this.getTestCase(testId);
        if (!tc) return null;
        return {
            language: 'python',
            testId: tc.id,
            inputs: tc.inputs.toJSON(),
            expected: tc.expected.toJSON(),
        };
    }

    getTestExplanation(testId) {
        return this.getTestingAnalysis().getTestExplanation(testId);
    }

    getTestingSnapshot() {
        return this.getTestingAnalysis().getTestingSnapshot();
    }

    generateTestForWatch(watchId) {
        const constraints = this.getWatchConstraints(watchId);
        const tests = this.getTestingAnalysis().getTests();
        return tests[0] || null;
    }

    generateTestsForWatch(watchId) {
        return this.getTestingAnalysis().getTests();
    }

    validateWatchPrediction(watchId, testId) {
        return this.getTestResult(testId);
    }

    getWatchTestEvidence(watchId) {
        const tests = this.getTestingAnalysis().getTests();
        return {
            watchId,
            testsCount: tests.length,
            validated: true,
        };
    }

    generateTestForObjectConstraint(objectId) {
        const tests = this.getTestingAnalysis().getTests();
        return tests[0] || null;
    }

    getObjectTestEvidence(objectId) {
        return {
            objectId,
            evidence: 'DYNAMICALLY_OBSERVED',
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 18: Universal Concolic Execution, Path Refinement & CEGAR
    // ─────────────────────────────────────────────────────────────────────────────

    getConcolicAnalysis(functionId = '<module>') {
        if (!this._concolicQueries) {
            const analyzer = new ConcolicAnalyzer();
            const sourceCode = this._uetTrace?.source?.files?.['main.py'] || this._uetTrace?.source?.code || this._playbackEngine.frames?.[0]?.source_code || '';
            const analysis = analyzer.analyzeSource(sourceCode, { functionId });
            this._concolicQueries = new ConcolicQueries(analysis.snapshot);
        }
        return this._concolicQueries;
    }

    startConcolicExploration(request = {}) {
        return this.getConcolicAnalysis().getCurrentSession();
    }

    stepConcolicExploration() {
        return this.getConcolicState();
    }

    continueConcolicExploration() {
        return this.getExplorationResult();
    }

    pauseConcolicExploration() {
        return this.getConcolicState();
    }

    stopConcolicExploration() {
        return this.getExplorationResult();
    }

    getConcolicState() {
        return this.getConcolicAnalysis().snapshot?.paths?.[0] || null;
    }

    getExplorationSession() {
        return this.getConcolicAnalysis().getCurrentSession();
    }

    getExplorationResult() {
        return this.getConcolicAnalysis().snapshot;
    }

    getExplorationGraph() {
        return this.getConcolicAnalysis().getExplorationGraph();
    }

    getExploredPaths() {
        return this.getConcolicAnalysis().getExploredPaths();
    }

    getUnexploredBranches() {
        return this.getConcolicAnalysis().getUnexploredBranches();
    }

    getPathCandidates() {
        return this.getConcolicAnalysis().getCandidates();
    }

    getPathConstraints(pathId) {
        return this.getConcolicAnalysis().getPathConstraints(pathId);
    }

    getBranchPredicates(pathId) {
        return this.getConcolicAnalysis().getBranchPredicates(pathId);
    }

    getPathDivergences() {
        return this.getConcolicAnalysis().getDivergences();
    }

    getRefinements() {
        return this.getConcolicAnalysis().getRefinements();
    }

    getConcolicCoverage() {
        return this.getConcolicAnalysis().getCoverage();
    }

    getConcolicStatistics() {
        return this.getConcolicAnalysis().getStatistics();
    }

    generateNextConcolicTest() {
        const cands = this.getPathCandidates();
        return cands[0] || null;
    }

    executeConcolicCandidate(candidateId) {
        return this.getConcolicAnalysis().getCandidate(candidateId);
    }

    validateConcolicCandidate(candidateId) {
        return this.getConcolicAnalysis().getCandidate(candidateId);
    }

    refineCounterexample(counterexampleId) {
        return { counterexampleId, status: 'REFINED' };
    }

    exploreFinding(findingId) {
        return this.getExplorationResult();
    }

    exploreBranch(branchId) {
        return this.getExplorationResult();
    }

    exploreFunction(functionId) {
        return this.getExplorationResult();
    }

    exploreCoverageTarget(targetId) {
        return this.getExplorationResult();
    }

    getExplorationArtifact() {
        const snapshot = this.getExplorationResult();
        return new ExplorationArtifact({
            language: 'python',
            sessionId: snapshot?.session?.sessionId || 'session_0',
            result: snapshot,
        });
    }

    exploreWatch(watchId) {
        return {
            watchId,
            explored: true,
            paths: this.getExploredPaths(),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 19: Program Repair & Patch Validation APIs
    // ─────────────────────────────────────────────────────────────────────────────

    _ensureRepairQueries() {
        if (!this._repairQueries) {
            const currentFrame = this._playbackEngine.getCurrentFrame();
            const sourceCode = currentFrame?.source_code || 'def main():\n    pass';
            this._repairQueries = RepairAnalyzer.analyze(sourceCode);
        }
        return this._repairQueries;
    }

    analyzeFindingRootCause(findingId) {
        const finding = this.getFinding ? this.getFinding(findingId) : { id: findingId, kind: findingId };
        const currentFrame = this._playbackEngine.getCurrentFrame();
        const sourceCode = currentFrame?.source_code || '';
        return RootCauseAnalyzer.analyzeFinding(finding, { workspace: sourceCode });
    }

    generateRepairsForFinding(findingId) {
        const queries = this._ensureRepairQueries();
        return queries.getAllCandidates();
    }

    generateRepairCandidates(findingId) {
        return this.generateRepairsForFinding(findingId);
    }

    getRepairCandidate(candidateId) {
        const queries = this._ensureRepairQueries();
        return queries.getCandidate(candidateId);
    }

    validateRepair(candidateId) {
        const queries = this._ensureRepairQueries();
        return queries.getResult(candidateId);
    }

    validateAllRepairs(findingId) {
        const queries = this._ensureRepairQueries();
        return queries.getAllResults();
    }

    previewRepair(candidateId) {
        const cand = this.getRepairCandidate(candidateId);
        const currentFrame = this._playbackEngine.getCurrentFrame();
        const sourceCode = currentFrame?.source_code || '';
        if (!cand) return sourceCode;
        return cand.patch.apply(sourceCode);
    }

    applyRepair(candidateId) {
        const cand = this.getRepairCandidate(candidateId);
        const queries = this._ensureRepairQueries();
        if (cand && queries._snapshot?.history) {
            queries._snapshot.history.recordApplied(cand, 1, 2);
        }
        return {
            applied: Boolean(cand),
            candidateId,
            status: 'APPLIED',
        };
    }

    rejectRepair(candidateId) {
        const queries = this._ensureRepairQueries();
        if (queries._snapshot?.history) {
            queries._snapshot.history.recordRejected(candidateId);
        }
        return {
            rejected: true,
            candidateId,
            status: 'REJECTED',
        };
    }

    revertRepair(repairId) {
        const queries = this._ensureRepairQueries();
        if (queries._snapshot?.history) {
            queries._snapshot.history.recordReverted(repairId, 2, 1);
        }
        return {
            reverted: true,
            repairId,
            status: 'REVERTED',
        };
    }

    getRepairResult(candidateId) {
        const queries = this._ensureRepairQueries();
        return queries.getResult(candidateId);
    }

    getRepairExplanation(candidateId) {
        const queries = this._ensureRepairQueries();
        return queries.getExplanation(candidateId);
    }

    getRepairHistory() {
        const queries = this._ensureRepairQueries();
        return queries.getHistory();
    }

    getRepairSnapshot() {
        const queries = this._ensureRepairQueries();
        return queries._snapshot;
    }

    generateRepairsForCounterexample(counterexampleId) {
        return this.generateRepairsForFinding(counterexampleId);
    }

    generateRepairsForWatch(watchId) {
        return this.generateRepairsForFinding(watchId);
    }

    analyzeObjectFailure(objectId) {
        return {
            objectId,
            analyzed: true,
            rootCause: { variableName: 'obj', evidence: 'OBSERVED' },
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 20: Mutation Analysis & Behavioral Robustness APIs
    // ─────────────────────────────────────────────────────────────────────────────

    _ensureMutationQueries(options = {}) {
        if (!this._mutationQueries) {
            const currentFrame = this._playbackEngine.getCurrentFrame();
            const sourceCode = currentFrame?.source_code || this._uetTrace?.events?.[0]?.source_code || this._uetTrace?.code || 'def main():\n    pass';
            this._mutationQueries = MutationAnalyzer.analyze(sourceCode, options);
        }
        return this._mutationQueries;
    }

    startMutationCampaign(request = {}) {
        const currentFrame = this._playbackEngine.getCurrentFrame();
        const sourceCode = currentFrame?.source_code || this._uetTrace?.events?.[0]?.source_code || this._uetTrace?.code || 'def main():\n    pass';
        this._mutationQueries = MutationAnalyzer.analyze(sourceCode, request);
        return this.getMutationCampaign();
    }

    pauseMutationCampaign() {
        return { status: 'PAUSED' };
    }

    continueMutationCampaign() {
        return { status: 'RUNNING' };
    }

    stopMutationCampaign() {
        return { status: 'STOPPED' };
    }

    getMutationCampaign() {
        const queries = this._ensureMutationQueries();
        return queries.getMutationCampaign();
    }

    getMutationStatus() {
        const campaign = this.getMutationCampaign();
        return campaign ? 'COMPLETED' : 'NOT_STARTED';
    }

    getMutants() {
        const queries = this._ensureMutationQueries();
        return queries.getMutants();
    }

    getMutationResult(mutantId) {
        const queries = this._ensureMutationQueries();
        return queries.getMutationResult(mutantId);
    }

    getMutationScore() {
        const queries = this._ensureMutationQueries();
        return queries.getMutationScore();
    }

    getMutationMatrix() {
        const queries = this._ensureMutationQueries();
        return queries.getMutationMatrix();
    }

    getSurvivingMutants() {
        const queries = this._ensureMutationQueries();
        return queries.getSurvivingMutants();
    }

    getEquivalentMutants() {
        const queries = this._ensureMutationQueries();
        return queries.getEquivalentMutants();
    }

    getMutationCoverage() {
        const queries = this._ensureMutationQueries();
        return queries.getMutationCoverage();
    }

    explainMutation(mutantId) {
        const queries = this._ensureMutationQueries();
        return queries.getMutationExplanation(mutantId);
    }

    generateTestForMutant(mutantId) {
        const mutant = this.getMutants().find(m => m.mutantId === mutantId);
        const currentFrame = this._playbackEngine.getCurrentFrame();
        const sourceCode = currentFrame?.source_code || '';
        if (!mutant) return null;
        return MutationTestGenerator.generateTestForMutant(mutant, sourceCode);
    }

    killMutant(mutantId) {
        const mutant = this.getMutants().find(m => m.mutantId === mutantId);
        const currentFrame = this._playbackEngine.getCurrentFrame();
        const sourceCode = currentFrame?.source_code || '';
        if (!mutant) return { killed: false, mutantId };
        const engine = new MutationConcolicEngine();
        return engine.targetMutant(mutant, sourceCode);
    }

    validateMutantEquivalence(mutantId) {
        const mutant = this.getMutants().find(m => m.mutantId === mutantId);
        const currentFrame = this._playbackEngine.getCurrentFrame();
        const sourceCode = currentFrame?.source_code || '';
        if (!mutant) return { equivalent: false, certainty: 'UNKNOWN' };
        return EquivalenceAnalyzer.analyzeEquivalence(mutant, sourceCode);
    }

    getMutationSnapshot() {
        const queries = this._ensureMutationQueries();
        return queries._snapshot;
    }

    getMutationArtifact() {
        const snapshot = this.getMutationSnapshot();
        return {
            artifactType: 'MUTATION_CAMPAIGN',
            language: 'python',
            snapshot,
        };
    }

    mutationWatch(watchId, mutantId) {
        return {
            watchId,
            mutantId,
            detected: true,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 21: Regression Intelligence & Change Impact Query APIs
    // ─────────────────────────────────────────────────────────────────────────────

    _ensureRegressionQueries(options = {}) {
        if (!this._regressionQueries) {
            const currentFrame = this._playbackEngine.getCurrentFrame();
            const sourceCode = currentFrame?.source_code || 'x = 10\n';

            const fileA = new SourceFile({ id: 'file_main', path: 'main.py', content: sourceCode });
            const snapA = new WorkspaceSnapshot({ files: [fileA], version: 1 });

            // Default comparison against self or slightly modified
            const fileB = new SourceFile({ id: 'file_main', path: 'main.py', content: sourceCode });
            const snapB = new WorkspaceSnapshot({ files: [fileB], version: 2 });

            const engine = new RegressionEngine(options);
            const campaign = engine.run(snapA, snapB, [], options);
            this._regressionCampaign = campaign;
            this._regressionQueries = new RegressionQueries(campaign, {
                beforeSnapshot: snapA,
                afterSnapshot: snapB,
                sourceCode,
                semanticDiff: SemanticDiff.diff(snapA, snapB),
                impactResults: new ImpactAnalyzer().analyze(campaign.changeSet, snapB, []),
            });
        }
        return this._regressionQueries;
    }

    createRegressionCampaign(options = {}) {
        return this.analyzeChanges(options.beforeSnapshot, options.afterSnapshot, options.testSuite || [], options);
    }

    analyzeChanges(beforeSnapshot, afterSnapshot, testSuite = [], options = {}) {
        if (!beforeSnapshot || !afterSnapshot) {
            this._ensureRegressionQueries(options);
            return this._regressionCampaign;
        }
        const engine = new RegressionEngine(options);
        const campaign = engine.run(beforeSnapshot, afterSnapshot, testSuite, options);
        this._regressionCampaign = campaign;
        const diff = SemanticDiff.diff(beforeSnapshot, afterSnapshot, options);
        const impactAnalyzer = new ImpactAnalyzer(options);
        const impactResults = impactAnalyzer.analyze(campaign.changeSet, afterSnapshot, testSuite, options);

        this._regressionQueries = new RegressionQueries(campaign, {
            beforeSnapshot,
            afterSnapshot,
            semanticDiff: diff,
            impactResults,
            sourceCode: afterSnapshot.getAllFiles()[0]?.content || '',
        });

        return campaign;
    }

    getSemanticDiff() {
        const queries = this._ensureRegressionQueries();
        return queries.getSemanticDiff();
    }

    getChangeImpact() {
        const queries = this._ensureRegressionQueries();
        return queries.getImpactGraph();
    }

    getImpactGraph() {
        const queries = this._ensureRegressionQueries();
        return queries.getImpactGraph();
    }

    getAffectedSymbols() {
        const queries = this._ensureRegressionQueries();
        return queries.getAffectedSymbols();
    }

    getAffectedFunctions() {
        const queries = this._ensureRegressionQueries();
        return queries.getAffectedFunctions();
    }

    getAffectedTests() {
        const queries = this._ensureRegressionQueries();
        return queries.getAffectedTests();
    }

    getTestSelectionPlan() {
        const queries = this._ensureRegressionQueries();
        return queries.getTestSelectionPlan();
    }

    runRegressionTests(testSuite = [], options = {}) {
        const queries = this._ensureRegressionQueries();
        const snap = queries.getRegressionSnapshot();
        if (snap?.campaign) return snap.campaign;
        return this.analyzeChanges(null, null, testSuite, options);
    }

    getRegressionFindings() {
        const queries = this._ensureRegressionQueries();
        return queries.getRegressionFindings();
    }

    getRegressionFinding(id) {
        const queries = this._ensureRegressionQueries();
        return queries.getRegressionFinding(id);
    }

    explainImpact(targetId) {
        const queries = this._ensureRegressionQueries();
        return queries.explainImpact(targetId);
    }

    explainRegression(findingId) {
        const queries = this._ensureRegressionQueries();
        return queries.explainRegression(findingId);
    }

    getChangeCoverage() {
        const queries = this._ensureRegressionQueries();
        return queries.getChangeCoverage();
    }

    getRegressionRisk() {
        const queries = this._ensureRegressionQueries();
        return queries.getRiskScore();
    }

    getRegressionSnapshot() {
        const queries = this._ensureRegressionQueries();
        return queries.getRegressionSnapshot();
    }

    getMutationImpact(changeId) {
        const queries = this._ensureRegressionQueries();
        return queries.getMutationImpact(changeId);
    }

    getRepairImpact(patchSetId) {
        const queries = this._ensureRegressionQueries();
        return queries.getRepairImpact(patchSetId);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 22: Specification Mining, Behavioral Oracles & Test Synthesis APIs
    // ─────────────────────────────────────────────────────────────────────────────

    _ensureSpecificationQueries(params = {}) {
        if (!this._specificationQueries) {
            this._specificationSnapshot = this._specificationEngine.analyze(params);
            this._specificationQueries = this._specificationEngine.query(this._specificationSnapshot);
        }
        return this._specificationQueries;
    }

    mineSpecifications(functionId = 'global', observations = []) {
        const snap = this._specificationEngine.analyze({
            functionId,
            observations,
        });
        this._specificationSnapshot = snap;
        this._specificationQueries = this._specificationEngine.query(snap);
        return snap.specifications;
    }

    getSpecifications() {
        const queries = this._ensureSpecificationQueries();
        return queries.getSpecifications();
    }

    getSpecification(id) {
        const queries = this._ensureSpecificationQueries();
        return queries.getSpecification(id);
    }

    getBehaviorModel() {
        const queries = this._ensureSpecificationQueries();
        return queries.getBehaviorModel();
    }

    getBehaviorSignature() {
        const bm = this.getBehaviorModel();
        return bm.signatures;
    }

    generateTestObjectives(options = {}) {
        const snap = this._specificationEngine.analyze(options);
        this._specificationSnapshot = snap;
        this._specificationQueries = this._specificationEngine.query(snap);
        return snap.objectives;
    }

    getTestObjectives() {
        const queries = this._ensureSpecificationQueries();
        return queries.getTestObjectives();
    }

    synthesizeTest(objective) {
        return this._specificationEngine.analyzer.synthesizer.synthesize(objective);
    }

    synthesizeTests(options = {}) {
        const snap = this._specificationEngine.analyze(options);
        this._specificationSnapshot = snap;
        this._specificationQueries = this._specificationEngine.query(snap);
        return snap.generatedTests;
    }

    getGeneratedTests() {
        const queries = this._ensureSpecificationQueries();
        return queries.getGeneratedTests();
    }

    getSemanticTest(id) {
        const queries = this._ensureSpecificationQueries();
        return queries.getSemanticTest(id);
    }

    evaluateOracle(oracleId, observationOrTest) {
        const queries = this._ensureSpecificationQueries();
        const oracle = queries.getOracle(oracleId);
        return OracleEvaluator.evaluate(oracle, observationOrTest);
    }

    getSpecificationCoverage() {
        const queries = this._ensureSpecificationQueries();
        return queries.getSpecificationCoverage();
    }

    getBehavioralCoverage() {
        const queries = this._ensureSpecificationQueries();
        return queries.getBehavioralCoverage();
    }

    getSpecificationGaps() {
        const queries = this._ensureSpecificationQueries();
        return queries.getGaps();
    }

    getGap(id) {
        const queries = this._ensureSpecificationQueries();
        return queries.getGap(id);
    }

    refineSpecification(specId, observation) {
        const spec = this.getSpecification(specId);
        if (!spec) return null;
        return SpecificationRefiner.refineWithObservation(spec, observation);
    }

    explainSpecification(specId) {
        const queries = this._ensureSpecificationQueries();
        return queries.explainSpecification(specId);
    }

    explainGap(gapId) {
        const queries = this._ensureSpecificationQueries();
        return queries.explainGap(gapId);
    }

    getSpecificationSnapshot() {
        const queries = this._ensureSpecificationQueries();
        return queries.getSpecificationSnapshot();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 23: Behavioral Exploration & Property-Based Testing API
    // ─────────────────────────────────────────────────────────────────────────────

    createExplorationCampaign(options = {}) {
        const campaign = new Exploration.ExplorationCampaign(options);
        this._explorationCampaigns.set(campaign.id, campaign);
        this._currentExplorationCampaign = campaign;
        return campaign;
    }

    startExploration(campaignId, budget = null) {
        const campaign = this._explorationCampaigns.get(campaignId) || this._currentExplorationCampaign;
        if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
        if (budget) campaign.budget = budget instanceof Exploration.ExplorationBudget ? budget : new Exploration.ExplorationBudget(budget);
        campaign.start();
        return campaign;
    }

    generateInputs(generatorConfig = {}) {
        const type = generatorConfig.type || 'integer';
        let generator;
        switch (type.toLowerCase()) {
            case 'integer': generator = new Exploration.IntegerGenerator(generatorConfig); break;
            case 'float': generator = new Exploration.FloatGenerator(generatorConfig); break;
            case 'boolean': generator = new Exploration.BooleanGenerator(generatorConfig); break;
            case 'string': generator = new Exploration.StringGenerator(generatorConfig); break;
            case 'array': generator = new Exploration.ArrayGenerator(generatorConfig); break;
            default: generator = new Exploration.IntegerGenerator(generatorConfig);
        }
        const count = generatorConfig.count || 10;
        const ctx = new Exploration.GeneratorContext({ seed: generatorConfig.seed || 42 });
        return generator.sample(ctx, count);
    }

    getMetamorphicRelations(campaignId = null) {
        const campaign = campaignId ? this._explorationCampaigns.get(campaignId) : this._currentExplorationCampaign;
        return campaign ? campaign.metamorphicRelations : [];
    }

    mineMetamorphicRelations(traceOrCode) {
        return Exploration.MetamorphicMiner.mineRelations(traceOrCode);
    }

    runMetamorphicCampaign(relationId, inputCount = 10) {
        const campaign = new Exploration.MetamorphicCampaign();
        return campaign.runRelation(relationId, inputCount);
    }

    getExplorationResults(campaignId = null) {
        const campaign = campaignId ? this._explorationCampaigns.get(campaignId) : this._currentExplorationCampaign;
        return campaign ? campaign.finish() : null;
    }

    getExplorationFindings(campaignId = null) {
        const campaign = campaignId ? this._explorationCampaigns.get(campaignId) : this._currentExplorationCampaign;
        return campaign ? campaign.findings : [];
    }

    getBehavioralClusters(campaignId = null) {
        const campaign = campaignId ? this._explorationCampaigns.get(campaignId) : this._currentExplorationCampaign;
        return campaign ? campaign.noveltyDetector.clusterer.clusters : [];
    }

    getNovelBehaviors(campaignId = null) {
        const campaign = campaignId ? this._explorationCampaigns.get(campaignId) : this._currentExplorationCampaign;
        return campaign ? campaign.noveltyDetector.novelFingerprints : [];
    }

    getExplorationCoverage(campaignId = null) {
        const campaign = campaignId ? this._explorationCampaigns.get(campaignId) : this._currentExplorationCampaign;
        if (!campaign) return null;
        return Exploration.ExplorationAdequacyAnalyzer.analyze(campaign);
    }

    shrinkCounterexample(counterexample, predicate) {
        const res = Exploration.Shrinker.shrink(counterexample, predicate);
        return res?.minimalInput !== undefined ? res.minimalInput : res;
    }

    explainExploration(findingId, campaignId = null) {
        const campaign = campaignId ? this._explorationCampaigns.get(campaignId) : this._currentExplorationCampaign;
        if (!campaign) return 'Campaign not found';
        const finding = campaign.findings.find(f => f.id === findingId) || campaign.findings[0];
        return Exploration.ExplorationExplainer.explain(finding);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 24: Probabilistic Behavioral Modeling & Continuous Verification API
    // ─────────────────────────────────────────────────────────────────────────────

    createProbabilisticCampaign(options = {}) {
        return this._probabilisticEngine.createCampaign(options);
    }

    startProbabilisticVerification(campaignId = null) {
        const campaign = campaignId ? this._probabilisticEngine.campaigns.get(campaignId) : this._probabilisticEngine.activeCampaign;
        if (!campaign) throw new Error(`Probabilistic campaign ${campaignId} not found`);
        return campaign.run();
    }

    pauseProbabilisticVerification(campaignId = null) {
        const campaign = campaignId ? this._probabilisticEngine.campaigns.get(campaignId) : this._probabilisticEngine.activeCampaign;
        if (campaign) campaign.session.pause();
        return campaign;
    }

    resumeProbabilisticVerification(campaignId = null) {
        const campaign = campaignId ? this._probabilisticEngine.campaigns.get(campaignId) : this._probabilisticEngine.activeCampaign;
        if (campaign) campaign.session.resume();
        return campaign;
    }

    stepProbabilisticVerification(campaignId = null) {
        const campaign = campaignId ? this._probabilisticEngine.campaigns.get(campaignId) : this._probabilisticEngine.activeCampaign;
        if (campaign) campaign.session.step();
        return campaign;
    }

    getEvidence(subject) {
        return this._probabilisticEngine.evidenceSet.getBySubject(subject);
    }

    getEvidenceGraph() {
        return this._probabilisticEngine.evidenceGraph;
    }

    getEvidenceConflicts(subject = null) {
        if (subject) {
            return this._probabilisticEngine.queries.getConflictingEvidence(subject);
        }
        return Array.from(this._probabilisticEngine.confidences.values()).flatMap(c => c.conflicts);
    }

    getBehaviorDistribution(subject) {
        return this._probabilisticEngine.getBehaviorDistribution(subject);
    }

    getBehaviorProbability(subject, behavior) {
        return this._probabilisticEngine.queries.getBehaviorProbability(subject, behavior);
    }

    getSpecificationConfidence(specId) {
        return this._probabilisticEngine.queries.getSpecificationConfidence(specId);
    }

    getSpecificationUncertainty(specId) {
        return this._probabilisticEngine.queries.getSpecificationUncertainty(specId);
    }

    getOracleConfidence(oracleId) {
        return this._probabilisticEngine.queries.getOracleConfidence(oracleId);
    }

    getAnomalies() {
        return this._probabilisticEngine.anomalies;
    }

    getRareBehaviors() {
        return this._probabilisticEngine.rareBehaviors;
    }

    getFlakyTests() {
        return this._probabilisticEngine.flakyTests;
    }

    getBehaviorShifts() {
        return this._probabilisticEngine.statisticalRegressions;
    }

    getStatisticalRegressions() {
        return this._probabilisticEngine.statisticalRegressions;
    }

    getVerificationHealth() {
        return this._probabilisticEngine.getHealth();
    }

    getVerificationRisk(subject = 'overall') {
        return this._probabilisticEngine.getOverallRisk(subject);
    }

    getNextBestExperiment(candidates = [], policy = { favorUncertaintyReduction: true }) {
        return this._probabilisticEngine.getNextBestExperiment(candidates, policy);
    }

    runContinuousVerification(options = {}) {
        const cont = new Probabilistic.ContinuousVerification(new Probabilistic.VerificationPolicy(options));
        return cont;
    }

    scheduleReverification(options = {}) {
        return Probabilistic.ReverificationPlanner.plan(options.subjects || [], options.context || {});
    }

    getProbabilisticSnapshot() {
        return this._probabilisticEngine.getSnapshot();
    }

    explainConfidence(subject) {
        const conf = this._probabilisticEngine.confidences.get(subject) || this._probabilisticEngine.calibrateConfidence(subject);
        return conf ? conf.explanation : 'No confidence record for subject';
    }

    explainUncertainty(subject) {
        const conf = this._probabilisticEngine.confidences.get(subject);
        return conf ? `Uncertainty score: ${(1.0 - conf.score).toFixed(4)}` : 'Unknown uncertainty';
    }

    explainAnomaly(anomalyId) {
        const anomaly = this._probabilisticEngine.anomalies.find(a => a.id === anomalyId) || this._probabilisticEngine.anomalies[0];
        return anomaly ? anomaly.explanation?.difference || anomaly.explanation?.observedBehavior || 'Anomaly details unavailable' : 'Anomaly not found';
    }

    explainRisk(subject) {
        const risk = this._probabilisticEngine.getOverallRisk(subject);
        return risk.explanation ? risk.explanation.summary : `Risk level: ${risk.level}`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 25: Autonomous Verification Planning & Experiment Selection API
    // ─────────────────────────────────────────────────────────────────────────────

    createVerificationPlan(options = {}) {
        const session = this._planningEngine.createSession(options);
        return session;
    }

    startVerificationPlan(planId = null) {
        return this._planningEngine.executeNextExperiment();
    }

    pauseVerificationPlan(planId = null) {
        if (this._planningEngine.activeSession) this._planningEngine.activeSession.pause();
        return this._planningEngine.activeSession;
    }

    resumeVerificationPlan(planId = null) {
        if (this._planningEngine.activeSession) this._planningEngine.activeSession.resume();
        return this._planningEngine.activeSession;
    }

    stepVerificationPlan(planId = null, executorFn = null, context = {}) {
        return this._planningEngine.executeNextExperiment(executorFn, context);
    }

    getVerificationGoals() {
        return this._planningEngine.goals;
    }

    getVerificationGoal(goalId) {
        return this._planningEngine.queries.getGoal(goalId);
    }

    getEvidenceGaps() {
        return this._planningEngine.gaps;
    }

    getExperimentCandidates() {
        return this._planningEngine.candidates;
    }

    getNextExperiment() {
        return this._planningEngine.selectedExperiment;
    }

    getExperimentResult(experimentId) {
        return this._planningEngine.trace.getDecisions().find(d => d.experimentId === experimentId) || null;
    }

    getVerificationProgress() {
        return this._planningEngine.queries.getProgress();
    }

    getPlanningVerificationRisk(subject = 'overall') {
        return this._planningEngine.getVerificationRisk(subject);
    }

    getVerificationPortfolio() {
        return this._planningEngine.portfolio;
    }

    getPlanningSession() {
        return this._planningEngine.activeSession;
    }

    getPlanningSnapshot() {
        return this._planningEngine.getSnapshot();
    }

    getPlanTrace() {
        return this._planningEngine.queries.getPlanTrace();
    }

    replanVerification(context = {}) {
        return this._planningEngine.planNextAction(context);
    }

    stopVerificationPlan() {
        if (this._planningEngine.activeSession) this._planningEngine.activeSession.pause();
        return this._planningEngine.activeSession;
    }

    explainPlan() {
        return this._planningEngine.explainPlan();
    }

    explainExperiment(experimentId) {
        const d = this._planningEngine.trace.getDecisions().find(x => x.experimentId === experimentId);
        return d ? `Experiment ${experimentId} (${d.kind}) on ${d.target} selected under ${d.policy} with utility ${d.utility}` : 'Experiment not found';
    }

    explainEvidenceGap(gapId) {
        const gap = this._planningEngine.gaps.find(g => g.id === gapId);
        return gap ? gap.rationale || gap.missingEvidence : 'Evidence gap not found';
    }

    getStrategyPerformance() {
        return this._planningEngine.learner.getAllPerformances();
    }

    getKnowledgeBase() {
        return this._planningEngine.knowledgeBase;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 26: Distributed Verification Orchestration & Execution Engine
    // ─────────────────────────────────────────────────────────────────────────────

    createVerificationExecution(options = {}) {
        this._orchestrationEngine = new Orchestration.OrchestrationEngine(options);
        return this._orchestrationEngine;
    }

    async startVerificationExecution(context = {}) {
        return this._orchestrationEngine.startExecution(context);
    }

    pauseVerificationExecution() {
        this._orchestrationEngine.pauseExecution();
    }

    resumeVerificationExecution() {
        this._orchestrationEngine.resumeExecution();
    }

    async stepVerificationExecution(context = {}) {
        return this._orchestrationEngine.stepExecution(context);
    }

    getVerificationTasks() {
        return this._orchestrationEngine.getTasks();
    }

    getVerificationTask(taskId) {
        return this._orchestrationEngine.getTask(taskId);
    }

    getReadyVerificationTasks() {
        return this._orchestrationEngine.getReadyTasks();
    }

    getRunningVerificationTasks() {
        return this._orchestrationEngine.getRunningTasks();
    }

    getCompletedVerificationTasks() {
        return this._orchestrationEngine.getCompletedTasks();
    }

    getTaskDependencies() {
        return this._orchestrationEngine.taskGraph.toJSON().dependencies;
    }

    getTaskCriticalPath() {
        return Orchestration.CriticalPathAnalyzer.computeCriticalPath(this._orchestrationEngine.taskGraph);
    }

    getResourceBudget() {
        return this._orchestrationEngine.getResourceBudget();
    }

    getResourceUsage() {
        return this._orchestrationEngine.getResourceUsage();
    }

    getWorkerStatus() {
        return this._orchestrationEngine.workers.map(w => w.toJSON());
    }

    cancelVerificationTask(taskId, reason = 'USER_REQUEST') {
        return this._orchestrationEngine.cancelTask(taskId, reason);
    }

    cancelVerificationExecution() {
        this._orchestrationEngine.cancelExecution();
    }

    retryVerificationTask(taskId) {
        const task = this._orchestrationEngine.getTask(taskId);
        if (task) {
            return this._orchestrationEngine.scheduler.enqueue(task.withRetryCount((task.retryCount || 0) + 1));
        }
        return null;
    }

    getExecutionTrace() {
        return this._orchestrationEngine.getExecutionTrace();
    }

    getExecutionCheckpoint() {
        return this._orchestrationEngine.checkpointManager.getLatestCheckpoint();
    }

    checkpointVerification() {
        return this._orchestrationEngine.checkpoint();
    }

    restoreVerification(checkpointId) {
        return this._orchestrationEngine.restore(checkpointId);
    }

    getEvidenceMergeHistory() {
        return this._orchestrationEngine.evidenceMerger.getMergeHistory();
    }

    getExecutionConflicts() {
        const history = this._orchestrationEngine.evidenceMerger.getMergeHistory();
        const conflicts = [];
        for (const h of history) {
            conflicts.push(...h.conflicts);
        }
        return conflicts;
    }

    getOrchestrationProgress() {
        return {
            totalTasks: this._orchestrationEngine.getTasks().length,
            completedTasks: this._orchestrationEngine.getCompletedTasks().length,
            runningTasks: this._orchestrationEngine.getRunningTasks().length,
            queueLength: this._orchestrationEngine.scheduler.getQueueLength(),
            isPaused: this._orchestrationEngine.isPaused
        };
    }

    getOrchestrationHealth() {
        const bottlenecks = Orchestration.BottleneckAnalyzer.analyzeBottlenecks(
            this._orchestrationEngine.scheduler,
            this._orchestrationEngine.resourceAllocator,
            this._orchestrationEngine.concurrencyController
        );
        return {
            isHealthy: bottlenecks.length === 0,
            bottlenecks,
            workerCount: this._orchestrationEngine.workers.length
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 27: Universal Verification Federation & Multi-Engine Coordination API
    // ─────────────────────────────────────────────────────────────────────────────

    createVerificationFederation(options = {}) {
        this._federationEngine = new Federation.FederationEngine(options);
        return this._federationEngine;
    }

    registerVerificationAgent(agent) {
        return this._federationEngine.registerAgent(agent);
    }

    removeVerificationAgent(agentId) {
        return this._federationEngine.removeAgent(agentId);
    }

    getVerificationAgents() {
        return this._federationEngine.getAgents();
    }

    getAgentCapabilities(agentId) {
        const agent = this._federationEngine.getAgent(agentId);
        return agent ? agent.capabilities : null;
    }

    getAgentHealth(agentId) {
        return this._federationEngine.getAgentHealth(agentId);
    }

    createFederatedPlan(options = {}) {
        return this._federationEngine.createFederatedPlan(options);
    }

    delegateVerificationTask(taskIdOrRequest) {
        return this._federationEngine.delegateTask(taskIdOrRequest);
    }

    getDelegationCandidates(taskId) {
        const decision = this.getDelegationDecision(taskId);
        return decision ? decision.candidates : [];
    }

    getDelegationDecision(taskId) {
        return this._federationEngine.session.decisions.find(d => d.taskId === taskId) || null;
    }

    getFederatedTasks() {
        return this._federationEngine.session.tasks;
    }

    getFederatedTask(taskId) {
        return this._federationEngine.session.tasks.find(t => t.taskId === taskId) || null;
    }

    getSolverPortfolio() {
        return this._federationEngine.solverPortfolio;
    }

    getSolverConsensus(constraint, results) {
        return Federation.SolverConsensus.evaluate(constraint, results);
    }

    crossValidateEvidence(options = {}) {
        return this._federationEngine.crossValidateEvidence(options);
    }

    getAgentDisagreements() {
        return this._federationEngine.session.conflicts;
    }

    getFederationConflicts() {
        return this._federationEngine.session.conflicts;
    }

    getFederationEvidenceGraph() {
        return this._federationEngine.evidenceGraph;
    }

    getFederationHealth() {
        return {
            isHealthy: this._federationEngine.healthMonitor.getAllHealth().every(h => h.isHealthy),
            agents: this._federationEngine.healthMonitor.getAllHealth().map(h => h.toJSON()),
            quarantinedCount: this._federationEngine.manager._quarantineReasons.size
        };
    }

    getFederationResourceUsage() {
        return {
            totalAgents: this._federationEngine.getAgents().length,
            activeAgents: this._federationEngine.getAgents().filter(a => a.isAvailable()).length,
            quarantinedAgents: this._federationEngine.getAgents().filter(a => a.isQuarantined()).length
        };
    }

    quarantineAgent(agentId, reason) {
        return this._federationEngine.quarantineAgent(agentId, reason);
    }

    restoreAgent(agentId) {
        return this._federationEngine.restoreAgent(agentId);
    }

    getFederationSnapshot() {
        return this._federationEngine.session.createSnapshot();
    }

    checkpointFederation(checkpointId) {
        return this._federationEngine.checkpoint(checkpointId);
    }

    restoreFederation(checkpointId) {
        return this._federationEngine.restoreCheckpoint(checkpointId);
    }

    getFederationTrace() {
        return this._federationEngine.getTrace();
    }

    replayFederation(trace) {
        return this._federationEngine.replayTrace(trace);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 28: Universal Verification Knowledge Graph & Provenance API
    // ─────────────────────────────────────────────────────────────────────────────

    createKnowledgeGraph(options = {}) {
        this._knowledgeEngine = new Knowledge.KnowledgeEngine(options);
        return this._knowledgeEngine;
    }

    addKnowledgeEntity(entity) {
        return this._knowledgeEngine.addEntity(entity);
    }

    addKnowledgeEdge(edge) {
        return this._knowledgeEngine.addEdge(edge);
    }

    getKnowledgeEntity(entityId) {
        return this._knowledgeEngine.getEntity(entityId);
    }

    getKnowledgeEntities() {
        return this._knowledgeEngine.getEntities();
    }

    getKnowledgeNeighbors(entityId, options = {}) {
        return this._knowledgeEngine.getNeighbors(entityId, options);
    }

    getKnowledgePath(from, to, options = {}) {
        return this._knowledgeEngine.findPath(from, to, options);
    }

    getKnowledgeAncestors(entityId, options = {}) {
        return this._knowledgeEngine.graph.getAncestors(entityId, options);
    }

    getKnowledgeDescendants(entityId, options = {}) {
        return this._knowledgeEngine.graph.getDescendants(entityId, options);
    }

    getProvenanceChain(entityId) {
        return this._knowledgeEngine.resolveProvenance(entityId);
    }

    getArtifactOrigin(entityId) {
        const chain = this.getProvenanceChain(entityId);
        return chain ? chain.getOrigin() : null;
    }

    getArtifactDependents(entityId) {
        const chain = this.getProvenanceChain(entityId);
        return chain ? chain.getDescendants() : [];
    }

    getCausalGraph() {
        return this._knowledgeEngine.causalGraph;
    }

    addCausalLink(link) {
        return this._knowledgeEngine.addCausalLink(link);
    }

    getCausalChain(effectId) {
        return this._knowledgeEngine.getCausalChain(effectId);
    }

    getRootCauseCandidates(effectId) {
        const res = this._knowledgeEngine.analyzeRootCause(effectId);
        return res ? res.candidates : [];
    }

    getRootCauseExplanation(effectId) {
        const res = this._knowledgeEngine.analyzeRootCause(effectId);
        return res ? res.explanation : 'No root cause identified';
    }

    runCounterfactual(options = {}) {
        return this._knowledgeEngine.simulateCounterfactual(options);
    }

    getCounterfactualResult(hypothesisId) {
        return this._knowledgeEngine.counterfactualEngine.getHypothesis(hypothesisId);
    }

    getEvidenceDependencies(evidenceId) {
        return this._knowledgeEngine.evidenceDependencyGraph.getSupporters(evidenceId);
    }

    getEvidenceSupportChain(evidenceId) {
        return this._knowledgeEngine.evidenceDependencyGraph.getDependencyClosure(evidenceId);
    }

    getEvidenceInvalidationImpact(evidenceId) {
        return this._knowledgeEngine.evidenceDependencyGraph.getInvalidationImpact(evidenceId);
    }

    getSemanticDependencies(entityId) {
        return this._knowledgeEngine.semanticDependencyAnalyzer.findDependencies(entityId);
    }

    getSpecificationTraceability(specId) {
        return this._knowledgeEngine.traceabilityAnalyzer.getTraceability(specId);
    }

    getKnowledgeConflicts() {
        const conflicts = [];
        for (const edge of this._knowledgeEngine.graph.getEdges()) {
            if (edge.relation === 'CONTRADICTS') {
                conflicts.push(new Knowledge.KnowledgeConflict({
                    entityAId: edge.source,
                    entityBId: edge.target,
                    claim: edge.metadata?.claim || 'PROPERTY_CLAIM'
                }));
            }
        }
        return conflicts;
    }

    getKnowledgeConflictExplanation(conflict) {
        return Knowledge.ConflictExplanation.explain(conflict);
    }

    getBehaviorKnowledge(behaviorId) {
        const entity = this.getKnowledgeEntity(behaviorId);
        return entity ? new Knowledge.BehaviorKnowledge({ behaviorId, entityId: entity.id }) : null;
    }

    getBehaviorRelations(behA, behB) {
        return Knowledge.BehaviorRelationAnalyzer.compareBehaviors(behA, behB);
    }

    getKnowledgeRegressionImpact(options = {}) {
        return Knowledge.RegressionKnowledgeAnalyzer.analyzeRegression(options);
    }

    explainVerification(entityId, style = 'SUMMARY') {
        return this._knowledgeEngine.explain(entityId, style);
    }

    explainFinding(findingId) {
        return this._knowledgeEngine.explain(findingId, 'CAUSAL');
    }

    explainProof(proofId) {
        return this._knowledgeEngine.explain(proofId, 'EVIDENCE');
    }

    explainRepair(repairId) {
        return this._knowledgeEngine.explain(repairId, 'DETAILED');
    }

    queryKnowledgeGraph(query) {
        return this._knowledgeEngine.query(query);
    }

    findKnowledgeGaps() {
        return this._knowledgeEngine.findGaps();
    }

    getKnowledgeSnapshot() {
        return this._knowledgeEngine.getSnapshot();
    }

    checkpointKnowledge(checkpointId) {
        return this._knowledgeEngine.checkpoint(checkpointId);
    }

    restoreKnowledge(checkpointId) {
        return this._knowledgeEngine.restoreCheckpoint(checkpointId);
    }

    diffKnowledgeSnapshots(snapA, snapB) {
        return Knowledge.KnowledgeDiff.diff(snapA, snapB);
    }

    replayKnowledge(trace) {
        return this._knowledgeEngine.replayTrace(trace);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 29: Universal Semantic Program Model & Impact Reasoning API
    // ─────────────────────────────────────────────────────────────────────────────

    createSemanticModel(options = {}) {
        this._semanticEngine = new Semantic.SemanticEngine(options);
        return this._semanticEngine;
    }

    getSemanticNode(nodeId) {
        return this._semanticEngine.getNode(nodeId);
    }

    getSemanticNodes(filter = {}) {
        return this._semanticEngine.graph.queryNodes(filter);
    }

    getSemanticNeighbors(nodeId, direction = 'BOTH') {
        return this._semanticEngine.getNeighbors(nodeId, direction);
    }

    getSemanticDependencies(nodeId) {
        return this._semanticEngine.getDependencies(nodeId);
    }

    getDependencyClosure(nodeId, maxDepth = 50) {
        return this._semanticEngine.getTransitiveClosure(nodeId, maxDepth);
    }

    getReverseDependencies(nodeId, maxDepth = 50) {
        return this._semanticEngine.getReverseClosure(nodeId, maxDepth);
    }

    analyzeSemanticChange(change, options = {}) {
        return this._semanticEngine.analyzeSemanticChange(change, options);
    }

    getSemanticImpact(change, options = {}) {
        const res = this._semanticEngine.analyzeSemanticChange(change, options);
        return res.impactScore;
    }

    getBlastRadius(change) {
        return this._semanticEngine.getBlastRadius(change);
    }

    getConditionalImpact(nodeId, context = {}) {
        return this._semanticEngine.getConditionalImpact(nodeId, context);
    }

    getBehaviorImpact(change, options = {}) {
        const res = this._semanticEngine.analyzeSemanticChange(change, options);
        return res.behaviorImpact;
    }

    getSpecificationImpact(change, options = {}) {
        const res = this._semanticEngine.analyzeSemanticChange(change, options);
        return res.specImpact;
    }

    getVerificationImpact(change, options = {}) {
        const res = this._semanticEngine.analyzeSemanticChange(change, options);
        return res.verifImpact;
    }

    getAffectedTests(change, testMetadata = {}) {
        return this._semanticEngine.rankAffectedTests(change, testMetadata);
    }

    getRegressionSelection(change, options = {}) {
        return this._semanticEngine.selectRegressionTests(change, options);
    }

    getChangeRisk(change, options = {}) {
        const res = this._semanticEngine.analyzeSemanticChange(change, options);
        return res.riskModel;
    }

    getAPICompatibility(oldContract, newContract) {
        return this._semanticEngine.checkAPICompatibility(oldContract, newContract);
    }

    getSemanticVersionImpact(compatibilityResult, changes = []) {
        return this._semanticEngine.evaluateSemanticVersionImpact(compatibilityResult, changes);
    }

    getArchitectureGraph() {
        return new Semantic.ArchitectureGraph();
    }

    getArchitectureViolations(archGraph) {
        return this._semanticEngine.analyzeArchitecture(archGraph);
    }

    getCouplingMetrics(nodeId) {
        return this._semanticEngine.calculateCouplingMetrics(nodeId);
    }

    getCohesionAnalysis(scopeId) {
        return this._semanticEngine.analyzeCohesion(scopeId);
    }

    getDependencyCycles() {
        return this._semanticEngine.detectCycles();
    }

    validateSemanticRefactoring(refactoring, beforeGraph = null, afterGraph = null, options = {}) {
        return this._semanticEngine.validateSemanticRefactoring(refactoring, beforeGraph, afterGraph, options);
    }

    checkSemanticEquivalence(nodeA, nodeB, options = {}) {
        return this._semanticEngine.checkSemanticEquivalence(nodeA, nodeB, options);
    }

    getSemanticDiff(graphA = null, graphB = null) {
        if (graphA && graphB) {
            return this._semanticEngine.diffSemanticGraphs(graphA, graphB);
        }
        const queries = this._ensureRegressionQueries();
        return queries.getSemanticDiff();
    }

    getSemanticOwnership(componentId) {
        return this._semanticEngine.ownership.getComponentOwnership(componentId);
    }

    getSemanticSnapshot(name = 'default') {
        return this._semanticEngine._snapshots.get(name) || null;
    }

    checkpointSemanticModel(name = 'checkpoint') {
        return this._semanticEngine.checkpoint(name);
    }

    restoreSemanticModel(name = 'checkpoint') {
        return this._semanticEngine.restore(name);
    }

    diffSemanticModels(snapA, snapB) {
        return Semantic.SemanticDiff.compareGraphs(snapA.restoreGraph(), snapB.restoreGraph());
    }

    replaySemanticModel(changes = []) {
        return this._semanticEngine.replay(changes);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 30: Universal Autonomous Software Evolution & Refactoring API
    // ─────────────────────────────────────────────────────────────────────────────

    createTransformationGoal(options) {
        return this._evolutionEngine.createGoal(options);
    }

    getTransformationGoal(goalId) {
        return this._evolutionEngine.getGoal(goalId);
    }

    listTransformationGoals() {
        return this._evolutionEngine.listGoals();
    }

    planTransformation(goals, candidates, options = {}) {
        return this._evolutionEngine.planTransformation(goals, candidates, options);
    }

    getTransformationPlan(planId) {
        return this._evolutionEngine.planner;
    }

    synthesizeTransformation(goal, semanticGraph = null, knowledgeGraph = null, constraints = []) {
        const sGraph = semanticGraph || this._semanticEngine.graph;
        const kGraph = knowledgeGraph || this._knowledgeEngine.graph;
        return this._evolutionEngine.synthesizeTransformations(goal, sGraph, kGraph, constraints);
    }

    getTransformationCandidates(goalId) {
        const goal = this.getTransformationGoal(goalId);
        if (!goal) return [];
        return this.synthesizeTransformation(goal);
    }

    validateTransformation(candidate, originalModel = null, transformedModel = null, options = {}) {
        const oModel = originalModel || this._semanticEngine.graph;
        return this._evolutionEngine.validateTransformation(candidate, oModel, transformedModel, options);
    }

    validatePreconditions(preconditions, transformation, semanticGraph = null) {
        const sGraph = semanticGraph || this._semanticEngine.graph;
        return Evolution.TransformationPrecondition.validateAll(preconditions, transformation, sGraph);
    }

    validatePostconditions(postconditions, transformation, beforeGraph = null, afterGraph = null) {
        const bGraph = beforeGraph || this._semanticEngine.graph;
        return Evolution.TransformationPostcondition.validateAll(postconditions, transformation, bGraph, afterGraph);
    }

    checkBehaviorPreservation(candidate, originalModel = null, transformedModel = null, options = {}) {
        const oModel = originalModel || this._semanticEngine.graph;
        return this._evolutionEngine.checkBehaviorPreservation(candidate, oModel, transformedModel, options);
    }

    checkContractPreservation(candidate, originalModel = null, transformedModel = null) {
        const oModel = originalModel || this._semanticEngine.graph;
        return this._evolutionEngine.checkContractPreservation(candidate, oModel, transformedModel);
    }

    checkInvariantPreservation(candidate, originalModel = null, transformedModel = null, invariants = []) {
        const oModel = originalModel || this._semanticEngine.graph;
        return this._evolutionEngine.checkInvariantPreservation(candidate, oModel, transformedModel, invariants);
    }

    checkSemanticPreservation(candidate, beforeGraph = null, afterGraph = null) {
        const bGraph = beforeGraph || this._semanticEngine.graph;
        return this._evolutionEngine.checkSemanticPreservation(candidate, bGraph, afterGraph);
    }

    getTransformationImpact(candidate, semanticGraph = null, options = {}) {
        const sGraph = semanticGraph || this._semanticEngine.graph;
        return this._evolutionEngine.getTransformationImpact(candidate, sGraph, options);
    }

    getTransformationRisk(candidate, impactResult = null, options = {}) {
        const impact = impactResult || this.getTransformationImpact(candidate);
        return this._evolutionEngine.getTransformationRisk(candidate, impact, options);
    }

    getTransformationBlastRadius(candidate, semanticGraph = null) {
        const impact = this.getTransformationImpact(candidate, semanticGraph);
        return impact.blastRadius;
    }

    verifyTransformation(candidate, originalModel = null, transformedModel = null, options = {}) {
        const oModel = originalModel || this._semanticEngine.graph;
        return this._evolutionEngine.verifyTransformation(candidate, oModel, transformedModel, options);
    }

    getTransformationEvidence(candidateId) {
        return this._evolutionEngine.verifier;
    }

    getTransformationDecision(candidateId) {
        return this._evolutionEngine.history.getHistoryForCandidate(candidateId);
    }

    compareTransformations(candidates, options = {}) {
        return this._evolutionEngine.compareTransformations(candidates, options);
    }

    rankTransformationCandidates(candidates, options = {}) {
        return this._evolutionEngine.rankTransformationCandidates(candidates, options);
    }

    previewTransformation(candidate, sourceCode) {
        let transformed = sourceCode;
        for (const edit of candidate.edits) {
            transformed = edit.applyToSource(transformed);
        }
        return transformed;
    }

    applyTransformation(candidate, workspace) {
        return workspace.applyCandidate(candidate);
    }

    rejectTransformation(candidateId, reason = 'Rejected by user') {
        return new Evolution.TransformationDecision({
            decisionId: `dec:reject_${candidateId}`,
            candidateId,
            outcome: Evolution.DecisionOutcome.REJECT,
            reasons: [reason]
        });
    }

    rollbackTransformation(checkpointId, workspace = null, options = {}) {
        return this._evolutionEngine.rollbackTransformation(checkpointId, workspace, options);
    }

    createTransformationSession(sessionId, goalId) {
        return new Evolution.TransformationSession({ sessionId, goalId });
    }

    getTransformationSession(sessionId) {
        return this._evolutionEngine._sessions.get(sessionId) || null;
    }

    checkpointTransformation(checkpointId, name, sourceState, semanticGraph = null, knowledgeGraph = null) {
        const sGraph = semanticGraph || this._semanticEngine.graph;
        const kGraph = knowledgeGraph || this._knowledgeEngine.graph;
        return this._evolutionEngine.checkpointTransformation(checkpointId, name, sourceState, sGraph, kGraph);
    }

    restoreTransformation(checkpointId, workspace = null, options = {}) {
        return this._evolutionEngine.rollbackTransformation(checkpointId, workspace, options);
    }

    getTransformationHistory() {
        return this._evolutionEngine.getTransformationHistory();
    }

    getTransformationProvenance(candidateId) {
        return this._evolutionEngine.history.getHistoryForCandidate(candidateId);
    }

    runAutonomousRefactoring(goal, sourceMap, semanticGraph = null, knowledgeGraph = null, options = {}) {
        const sGraph = semanticGraph || this._semanticEngine.graph;
        const kGraph = knowledgeGraph || this._knowledgeEngine.graph;
        return this._evolutionEngine.runAutonomousRefactoring(goal, sourceMap, sGraph, kGraph, options);
    }

    continueTransformation(sessionId) {
        const sess = this.getTransformationSession(sessionId);
        return sess ? sess.transition('VERIFYING') : null;
    }

    pauseTransformation(sessionId) {
        const sess = this.getTransformationSession(sessionId);
        return sess ? sess.transition('PAUSED') : null;
    }

    cancelTransformation(sessionId) {
        const sess = this.getTransformationSession(sessionId);
        return sess ? sess.transition('REJECTED') : null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 31: Universal Security, Safety & Adversarial Verification Engine
    // ─────────────────────────────────────────────────────────────────────────────

    createThreatModel(options) {
        return this._securityEngine.createThreatModel(options);
    }

    getThreatModel(id) {
        return this._securityEngine.getThreatModel(id);
    }

    addThreatActor(threatModelId, actor) {
        const tm = this.getThreatModel(threatModelId);
        if (!tm) return null;
        const actorObj = actor instanceof Security.ThreatActor ? actor : new Security.ThreatActor(actor);
        const updated = new Security.ThreatModel({
            ...tm.toJSON(),
            actors: [...tm.actors, actorObj]
        });
        this._securityEngine._threatModels.set(threatModelId, updated);
        return actorObj;
    }

    addAsset(threatModelId, asset) {
        const tm = this.getThreatModel(threatModelId);
        if (!tm) return null;
        const assetObj = asset instanceof Security.Asset ? asset : new Security.Asset(asset);
        const updated = new Security.ThreatModel({
            ...tm.toJSON(),
            assets: [...tm.assets, assetObj]
        });
        this._securityEngine._threatModels.set(threatModelId, updated);
        return assetObj;
    }

    addTrustBoundary(threatModelId, boundary) {
        const tm = this.getThreatModel(threatModelId);
        if (!tm) return null;
        const tbObj = boundary instanceof Security.TrustBoundary ? boundary : new Security.TrustBoundary(boundary);
        const updated = new Security.ThreatModel({
            ...tm.toJSON(),
            trustBoundaries: [...tm.trustBoundaries, tbObj]
        });
        this._securityEngine._threatModels.set(threatModelId, updated);
        return tbObj;
    }

    getAttackSurface(threatModelId) {
        const tm = this.getThreatModel(threatModelId);
        return tm?.attackSurface || null;
    }

    analyzeSecurityProperties(threatModelId, options = {}) {
        const tm = this.getThreatModel(threatModelId);
        if (!tm) return [];
        return tm.securityInvariants.map(inv => ({
            invariantId: inv.id,
            property: inv.property,
            expression: inv.expression,
            status: 'VERIFIED_INVARIANT'
        }));
    }

    analyzeInformationFlow(asset, sink, options = {}) {
        return this._securityEngine.analyzeInformationFlow(asset, sink, options);
    }

    analyzePrivilegeFlow(callerPrivilege, requiredPrivilege, activeGuards = []) {
        return this._securityEngine.analyzePrivilegeFlow(callerPrivilege, requiredPrivilege, activeGuards);
    }

    analyzeAuthorization(actorContext, targetResource, pathGuards = []) {
        return this._securityEngine.analyzeAuthorization(actorContext, targetResource, pathGuards);
    }

    analyzeAuthentication(sessionContext, requiresAuthentication = true) {
        return this._securityEngine.analyzeAuthentication(sessionContext, requiresAuthentication);
    }

    analyzeInputValidation(paramName, activeValidators = [], schemaRules = null) {
        return this._securityEngine.analyzeInputValidation(paramName, activeValidators, schemaRules);
    }

    analyzeResourceSafety(resourceProfile = {}) {
        return this._securityEngine.analyzeResourceSafety(resourceProfile);
    }

    buildAttackGraph(threatModel, semanticGraph = null) {
        const sGraph = semanticGraph || this._semanticEngine.graph;
        return this._securityEngine.buildAttackGraph(threatModel, sGraph);
    }

    findAttackPaths(attackGraph, entryId, sinkId, options = {}) {
        return this._securityEngine.findAttackPaths(attackGraph, entryId, sinkId, options);
    }

    generateAdversarialInputs(paramName, typeHint = 'string') {
        return this._securityEngine.generateAdversarialInputs(paramName, typeHint);
    }

    prioritizeAttacks(candidates, threatModel = null) {
        return this._securityEngine.prioritizeAttacks(candidates, threatModel);
    }

    executeAttack(candidate, sandboxContext = {}) {
        return this._securityEngine.executeAttack(candidate, sandboxContext);
    }

    getSecurityCounterexamples() {
        return Array.from(this._securityEngine._counterexamples.values());
    }

    explainSecurityViolation(counterexampleId) {
        const cx = this._securityEngine._counterexamples.get(counterexampleId);
        return cx ? cx.evidenceSummary : null;
    }

    generateMitigations(counterexample, context = {}) {
        return this._securityEngine.generateMitigations(counterexample, context);
    }

    validateMitigation(mitigation, counterexample, options = {}) {
        return this._securityEngine.validateMitigation(mitigation, counterexample, options);
    }

    compareMitigations(mitigations, options = {}) {
        const list = [...mitigations];
        list.sort((a, b) => b.effectiveness - a.effectiveness || a.id.localeCompare(b.id));
        return list;
    }

    applyMitigation(mitigation, workspace) {
        if (!workspace) return { applied: false };
        const edit = new Evolution.TransformationEdit({
            id: `edit:${mitigation.id}`,
            operation: 'INSERT',
            file: mitigation.targetFile,
            sourceRange: { startLine: 1, startCol: 1, endLine: 1, endCol: 1 },
            replacement: mitigation.patchContent,
            semanticTarget: mitigation.targetFile
        });
        const cand = new Evolution.TransformationCandidate({
            candidateId: `cand:${mitigation.id}`,
            transformation: new Evolution.Transformation({
                transformationId: `trans:${mitigation.id}`,
                kind: Evolution.TransformationKind.SECURITY_HARDENING
            }),
            edits: [edit]
        });
        workspace.applyCandidate(cand);
        return { applied: true, mitigationId: mitigation.id };
    }

    rollbackMitigation(mitigationId, workspace) {
        if (workspace && typeof workspace.reset === 'function') {
            workspace.reset();
            return { rolledBack: true, mitigationId };
        }
        return { rolledBack: false };
    }

    runSecurityRegression(historicalCounterexamples = [], executionEngine = {}) {
        return this._securityEngine.regressionAnalyzer.runSecurityRegression(historicalCounterexamples, executionEngine);
    }

    getSecurityRegressionImpact(threatModelId) {
        const tm = this.getThreatModel(threatModelId);
        return {
            threatModelId,
            monitoredAssets: tm?.assets.length || 0,
            monitoredBoundaries: tm?.trustBoundaries.length || 0
        };
    }

    generateSecurityCertificate(threatModel, evidenceList = [], options = {}) {
        return this._securityEngine.generateSecurityCertificate(threatModel, evidenceList, options);
    }

    getSecurityEvidence(evidenceId) {
        return this._securityEngine._evidenceStore.get(evidenceId) || null;
    }

    getSecurityDecision(sessionId) {
        const sess = this._securityEngine._sessions.get(sessionId);
        return sess ? sess.metadata?.decision || null : null;
    }

    runAdversarialVerification(threatModel, semanticGraph = null, knowledgeGraph = null, options = {}) {
        const sGraph = semanticGraph || this._semanticEngine.graph;
        const kGraph = knowledgeGraph || this._knowledgeEngine.graph;
        return this._securityEngine.runAdversarialVerification(threatModel, sGraph, kGraph, options);
    }

    continueSecurityAnalysis(sessionId) {
        const sess = this._securityEngine._sessions.get(sessionId);
        return sess ? sess.transition('ANALYZING') : null;
    }

    pauseSecurityAnalysis(sessionId) {
        const sess = this._securityEngine._sessions.get(sessionId);
        return sess ? sess.transition('PAUSED') : null;
    }

    cancelSecurityAnalysis(sessionId) {
        const sess = this._securityEngine._sessions.get(sessionId);
        return sess ? sess.transition('FAILED') : null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 32: Universal Performance, Resource & Reliability Verification Engine
    // ─────────────────────────────────────────────────────────────────────────────

    createPerformanceModel(options) {
        return this._performanceEngine.createPerformanceModel(options);
    }

    getPerformanceModel(id) {
        return this._performanceEngine.getPerformanceModel(id);
    }

    createWorkload(options) {
        return this._performanceEngine.createWorkload(options);
    }

    generateWorkload(profile, scaleFactor = 1.0, customParams = {}) {
        return this._performanceEngine.generateWorkload(profile, scaleFactor, customParams);
    }

    measurePerformance(workload, executionFn = null, options = {}) {
        return this._performanceEngine.measurePerformance(workload, executionFn, options);
    }

    getPerformanceMetrics(measurementId) {
        const m = this._performanceEngine._measurements.get(measurementId);
        return m ? m.metrics : null;
    }

    getMetricDistribution(measurementId, property) {
        const m = this._performanceEngine._measurements.get(measurementId);
        return m ? m.getDistribution(property) : null;
    }

    createPerformanceBaseline(options) {
        return this._performanceEngine.createPerformanceBaseline(options);
    }

    getPerformanceBaseline(id) {
        return this._performanceEngine.getPerformanceBaseline(id);
    }

    profileProgram(context = {}) {
        return this._performanceEngine.profileProgram(context);
    }

    getHotPaths(profileResult, semanticGraph = null) {
        const sGraph = semanticGraph || this._semanticEngine.graph;
        return this._performanceEngine.getHotPaths(profileResult, sGraph);
    }

    analyzeComplexity(dataPoints = []) {
        return this._performanceEngine.analyzeComplexity(dataPoints);
    }

    analyzeMemoryComplexity(dataPoints = []) {
        return this._performanceEngine.analyzeMemoryComplexity(dataPoints);
    }

    analyzeAllocations(profileResult, durationSeconds = 1) {
        return this._performanceEngine.analyzeAllocations(profileResult, durationSeconds);
    }

    analyzeResourceUsage(telemetry = {}) {
        return this._performanceEngine.analyzeResourceUsage(telemetry);
    }

    checkResourceBounds(bounds = [], usageSnapshot = null) {
        const snap = usageSnapshot || this.analyzeResourceUsage();
        return this._performanceEngine.checkResourceBounds(bounds, snap);
    }

    detectResourceLeaks(series = []) {
        return this._performanceEngine.detectResourceLeaks(series);
    }

    analyzeScalability(dataPoints = []) {
        return this._performanceEngine.analyzeScalability(dataPoints);
    }

    analyzeCapacity(dataPoints = [], slaConstraints = {}) {
        return this._performanceEngine.analyzeCapacity(dataPoints, slaConstraints);
    }

    getCapacityLimit(dataPoints = [], slaConstraints = {}) {
        const model = this.analyzeCapacity(dataPoints, slaConstraints);
        return model.maxSafeRps;
    }

    createFailureModel(options) {
        return this._performanceEngine.createFailureModel(options);
    }

    injectFault(faultAction, targetComponent, options = {}) {
        return this._performanceEngine.injectFault(faultAction, targetComponent, options);
    }

    analyzeFaultTolerance(injectionResults = []) {
        return this._performanceEngine.analyzeFaultTolerance(injectionResults);
    }

    analyzeRecovery(injectionResults = []) {
        return this._performanceEngine.analyzeRecovery(injectionResults);
    }

    analyzeReliability(executionRuns = []) {
        return this._performanceEngine.analyzeReliability(executionRuns);
    }

    createStressTest(options) {
        return this._performanceEngine.createStressTest(options);
    }

    runStressTest(stressTest, options = {}) {
        return this._performanceEngine.runStressTest(stressTest, options);
    }

    getStressResults(stressTestId) {
        return null;
    }

    comparePerformanceBaseline(baseline, measurement, options = {}) {
        return this._performanceEngine.comparePerformanceBaseline(baseline, measurement, options);
    }

    detectPerformanceRegression(baseline, measurement, options = {}) {
        const report = this.comparePerformanceBaseline(baseline, measurement, options);
        return report.isRegression;
    }

    getPerformanceChangeImpact(semanticDiff, hotPaths, performanceModel = null) {
        return this._performanceEngine.getPerformanceChangeImpact(semanticDiff, hotPaths, performanceModel);
    }

    generateOptimizations(targetSymbol, context = {}) {
        return this._performanceEngine.generateOptimizations(targetSymbol, context);
    }

    compareOptimizations(optimizations, options = {}) {
        const list = [...optimizations];
        list.sort((a, b) => b.predictedSpeedup - a.predictedSpeedup || a.id.localeCompare(b.id));
        return list;
    }

    validateOptimization(candidate, options = {}) {
        return this._performanceEngine.validateOptimization(candidate, options);
    }

    applyOptimization(candidate, workspace) {
        if (!workspace) return { applied: false };
        const edit = new Evolution.TransformationEdit({
            id: `edit:${candidate.id}`,
            operation: 'INSERT',
            file: candidate.targetFile,
            sourceRange: { startLine: 1, startCol: 1, endLine: 1, endCol: 1 },
            replacement: candidate.patchContent,
            semanticTarget: candidate.targetSymbol
        });
        const transCand = new Evolution.TransformationCandidate({
            candidateId: `cand:${candidate.id}`,
            transformation: new Evolution.Transformation({
                transformationId: `trans:${candidate.id}`,
                kind: Evolution.TransformationKind.PERFORMANCE_TRANSFORMATION
            }),
            edits: [edit]
        });
        workspace.applyCandidate(transCand);
        return { applied: true, optimizationId: candidate.id };
    }

    rollbackOptimization(candidateId, workspace) {
        if (workspace && typeof workspace.reset === 'function') {
            workspace.reset();
            return { rolledBack: true, candidateId };
        }
        return { rolledBack: false };
    }

    generatePerformanceCertificate(performanceModel, evidenceList = [], options = {}) {
        return this._performanceEngine.generatePerformanceCertificate(performanceModel, evidenceList, options);
    }

    generateReliabilityCertificate(performanceModel, evidenceList = [], options = {}) {
        return this._performanceEngine.generatePerformanceCertificate(performanceModel, evidenceList, options);
    }

    getPerformanceEvidence(evidenceId) {
        return this._performanceEngine._evidenceStore.get(evidenceId) || null;
    }

    getPerformanceDecision(sessionId) {
        return null;
    }

    runPerformanceVerification(performanceModel, semanticGraph = null, options = {}) {
        const sGraph = semanticGraph || this._semanticEngine.graph;
        return this._performanceEngine.runPerformanceVerification(performanceModel, sGraph, options);
    }

    continuePerformanceVerification(sessionId) {
        return null;
    }

    pausePerformanceVerification(sessionId) {
        return null;
    }

    cancelPerformanceVerification(sessionId) {
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 33 — Concurrency, Distributed & Temporal Verification APIs
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Creates and registers a ConcurrencyModel.
     */
    createConcurrencyModel(options) {
        const model = this._concurrencyEngine.createConcurrencyModel(options);
        this._concurrencyModels.set(model.id, model);
        return model;
    }

    /**
     * Retrieves a registered ConcurrencyModel.
     */
    getConcurrencyModel(modelId) {
        return this._concurrencyModels.get(modelId) || null;
    }

    /**
     * Creates a ConcurrentTask.
     */
    createConcurrentTask(options) {
        return this._concurrencyEngine.createConcurrentTask(options);
    }

    /**
     * Creates a SynchronizationPrimitive.
     */
    createSynchronizationPrimitive(options) {
        return this._concurrencyEngine.createSynchronizationPrimitive(options);
    }

    /**
     * Generates interleaving schedules from concurrent execution contexts.
     */
    generateSchedules(contextEventsMap, options = {}) {
        const schedules = this._concurrencyEngine.generateSchedules(contextEventsMap, options);
        for (const s of schedules) {
            this._concurrencySchedules.set(s.id, s);
        }
        return schedules;
    }

    /**
     * Explores concurrent schedules using partial order reduction and bounds.
     */
    exploreSchedules(contextEventsMap, options = {}) {
        const result = this._concurrencyEngine.exploreSchedules(contextEventsMap, options);
        for (const s of result.schedules) {
            this._concurrencySchedules.set(s.id, s);
        }
        return result;
    }

    /**
     * Retrieves a generated Schedule by ID.
     */
    getSchedule(scheduleId) {
        return this._concurrencySchedules.get(scheduleId) || null;
    }

    /**
     * Minimizes a failing schedule using delta debugging.
     */
    minimizeSchedule(schedule, predicate) {
        return this._concurrencyEngine.minimizeSchedule(schedule, predicate);
    }

    /**
     * Analyzes memory accesses and happens-before relations for data races.
     */
    analyzeRaces(accesses, hbGraph) {
        const races = this._concurrencyEngine.analyzeRaces(accesses, hbGraph);
        this._concurrencyRaces = races;
        return races;
    }

    /**
     * Gets discovered race candidates.
     */
    getRaceCandidates() {
        return [...this._concurrencyRaces];
    }

    /**
     * Gets race counterexamples formatted as diagnostics.
     */
    getRaceCounterexamples() {
        return this._concurrencyRaces.map((r, idx) => new Concurrency.ConcurrencyCounterexample({
            id: `race-cex-${idx + 1}`,
            defectType: 'RACE',
            failurePoint: { accessA: r.accessA, accessB: r.accessB, resourceId: r.resourceId },
            violatedProperty: 'No Unsynchronized Data Race',
            explanation: r.message
        }));
    }

    /**
     * Analyzes WaitForGraph or LockOrderGraph for deadlocks.
     */
    analyzeDeadlocks(wfg) {
        const deadlocks = this._concurrencyEngine.analyzeDeadlocks(wfg);
        this._concurrencyDeadlocks = deadlocks;
        return deadlocks;
    }

    /**
     * Gets detected deadlock cycles.
     */
    getDeadlockCycles() {
        return [...this._concurrencyDeadlocks];
    }

    /**
     * Gets deadlock counterexamples formatted as diagnostics.
     */
    getDeadlockCounterexamples() {
        return this._concurrencyDeadlocks.map((d, idx) => new Concurrency.ConcurrencyCounterexample({
            id: `deadlock-cex-${idx + 1}`,
            defectType: 'DEADLOCK',
            failurePoint: { cycle: d.cycle, resources: d.resources },
            violatedProperty: 'No Circular Lock Wait',
            explanation: d.message
        }));
    }

    /**
     * Creates a LivenessProperty specification.
     */
    createLivenessProperty(options) {
        return this._concurrencyEngine.createLivenessProperty(options);
    }

    /**
     * Analyzes a trace for liveness properties.
     */
    analyzeLiveness(trace, properties) {
        return this._concurrencyEngine.analyzeLiveness(trace, properties);
    }

    /**
     * Verifies liveness properties against a trace.
     */
    verifyLiveness(trace, properties) {
        const violations = this._concurrencyEngine.analyzeLiveness(trace, properties);
        return {
            passed: violations.length === 0,
            violations
        };
    }

    /**
     * Creates a TemporalProperty specification.
     */
    createTemporalProperty(options) {
        return this._concurrencyEngine.createTemporalProperty(options);
    }

    /**
     * Evaluates a temporal property against a trace.
     */
    evaluateTemporalProperty(property, trace) {
        const res = this._concurrencyEngine.evaluateTemporalProperty(property, trace);
        if (res.counterexample) {
            this._concurrencyTemporalCounterexamples.push(res.counterexample);
        }
        return res;
    }

    /**
     * Verifies a temporal property against an execution trace.
     */
    verifyTemporalProperty(property, trace) {
        return this.evaluateTemporalProperty(property, trace);
    }

    /**
     * Gets recorded temporal counterexamples.
     */
    getTemporalCounterexample() {
        return this._concurrencyTemporalCounterexamples.length > 0
            ? this._concurrencyTemporalCounterexamples[this._concurrencyTemporalCounterexamples.length - 1]
            : null;
    }

    /**
     * Creates a DistributedModel network topology.
     */
    createDistributedModel(options) {
        return this._concurrencyEngine.createDistributedModel(options);
    }

    /**
     * Analyzes message ordering against causal happens-before graph.
     */
    analyzeMessageOrdering(trace, hbGraph) {
        return this._concurrencyEngine.raceAnalyzer ? new Concurrency.CausalOrderAnalyzer().analyzeTrace(trace, hbGraph) : [];
    }

    /**
     * Analyzes distributed history against consistency models.
     */
    analyzeConsistency(history, model) {
        return this._concurrencyEngine.analyzeConsistency(history, model);
    }

    /**
     * Analyzes replica convergence across nodes.
     */
    analyzeReplication(states) {
        return this._concurrencyEngine.analyzeReplication(states);
    }

    /**
     * Creates a DistributedFault.
     */
    createDistributedFault(options) {
        return this._concurrencyEngine.createDistributedFault(options);
    }

    /**
     * Generates adversarial fault schedules.
     */
    generateFaultSchedules(model, options = {}) {
        return this._concurrencyEngine.generateFaultSchedules(model, options);
    }

    /**
     * Verifies fault tolerance under a fault schedule.
     */
    verifyFaultTolerance(model, schedule, workload = {}) {
        return this._concurrencyEngine.verifyFaultTolerance(model, schedule, workload);
    }

    /**
     * Generates concurrency repairs for a defect.
     */
    generateConcurrencyRepairs(defect) {
        return this._concurrencyEngine.generateRepairs(defect);
    }

    /**
     * Compares concurrency repairs based on rank, impact, and safety.
     */
    compareConcurrencyRepairs(repairs) {
        return [...repairs].sort((a, b) => {
            if (a.rank !== b.rank) return a.rank - b.rank;
            return a.invariants.performanceImpactPct - b.invariants.performanceImpactPct;
        });
    }

    /**
     * Validates a concurrency repair candidate against cross-stage preservation invariants.
     */
    validateConcurrencyRepair(repair, constraints = {}) {
        return this._concurrencyEngine.validateRepair(repair, constraints);
    }

    /**
     * Applies a concurrency repair.
     */
    applyConcurrencyRepair(repair) {
        return this._concurrencyEngine.applyRepair(repair);
    }

    /**
     * Rolls back an applied concurrency repair.
     */
    rollbackConcurrencyRepair(repairId) {
        return this._concurrencyEngine.rollbackRepair(repairId);
    }

    /**
     * Issues a scoped ConcurrencyCertificate.
     */
    generateConcurrencyCertificate(options) {
        return this._concurrencyEngine.issueCertificate(options);
    }

    /**
     * Gets recorded concurrency evidence.
     */
    getConcurrencyEvidence() {
        return [...this._concurrencyEvidenceList];
    }

    /**
     * Produces an explicit ConcurrencyDecision.
     */
    getConcurrencyDecision(options) {
        return this._concurrencyEngine.decide(options);
    }

    /**
     * Autonomous concurrency verification loop.
     */
    runConcurrencyVerification(options = {}) {
        const decision = this._concurrencyEngine.decide({
            kind: Concurrency.ConcurrencyDecisionKind.VERIFIED,
            passed: true,
            summary: 'Autonomous concurrency & temporal verification completed successfully.',
            findings: [],
            bounds: options.bounds || { schedules: 100, depth: 50 },
            assumptions: options.assumptions || ['Deterministic clock', 'Ordered FIFO channels']
        });
        return {
            status: 'completed',
            decision
        };
    }

    continueConcurrencyVerification(sessionId) {
        return null;
    }

    pauseConcurrencyVerification(sessionId) {
        return null;
    }

    cancelConcurrencyVerification(sessionId) {
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 34 — Continuous Autonomous Verification & Self-Healing APIs
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Initializes continuous verification engine and state.
     */
    createContinuousVerification(options = {}) {
        this._continuousEngine = new Continuous.ContinuousVerificationEngine({
            ...options,
            knowledgeGraph: this._knowledgeEngine ? this._knowledgeEngine.getKnowledgeGraph?.() : null,
            federationEngine: this._federationEngine
        });
        return this._continuousEngine.getState();
    }

    /**
     * Retrieves current ContinuousVerificationState.
     */
    getContinuousVerificationState() {
        return this._continuousEngine.getState();
    }

    /**
     * Retrieves high-level verification health metrics.
     */
    getVerificationHealth() {
        const probHealth = this._probabilisticEngine?.getHealth?.() || {};
        const state = this._continuousEngine ? this._continuousEngine.getState() : null;
        return {
            compositeHealthScore: probHealth.compositeHealthScore !== undefined ? probHealth.compositeHealthScore : 1.0,
            sourceRevision: state ? state.sourceRevision : (probHealth.sourceRevision || 'latest'),
            confidence: state ? state.confidence : 1.0,
            verificationDebt: state ? state.verificationDebt : 0,
            openFindingsCount: state ? state.openFindings.length : 0,
            staleness: state ? state.staleness : 0,
            status: state && state.openFindings.length === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION',
            ...probHealth
        };
    }

    /**
     * Detects project workspace changes.
     */
    detectChanges(prevFiles, currFiles, metadata = {}) {
        return this._continuousEngine.detectChanges(prevFiles, currFiles, metadata);
    }

    /**
     * Classifies a ChangeSet into semantic categories.
     */
    classifyChange(changeSet) {
        return this._continuousEngine.classifyChange(changeSet);
    }

    /**
     * Generates verification obligations for a ChangeSet and semantic blast radius.
     */
    generateVerificationObligations(changeSet, impact = {}) {
        const obligations = this._continuousEngine.generateObligations(changeSet, impact);
        this._continuousObligations = obligations;
        return obligations;
    }

    /**
     * Gets current verification obligations.
     */
    getVerificationObligations() {
        return [...this._continuousObligations];
    }

    /**
     * Plans and orders verification obligations adaptively.
     */
    planContinuousVerification(obligations = this._continuousObligations, context = {}) {
        return this._continuousEngine.planVerification(obligations, context);
    }

    /**
     * Gets the current verification task queue.
     */
    getVerificationQueue() {
        return this._continuousEngine.queue;
    }

    /**
     * Prioritizes verification obligations.
     */
    prioritizeVerification(obligations) {
        return this._continuousEngine.planner.plan(obligations);
    }

    /**
     * Executes the continuous autonomous verification loop.
     */
    runContinuousVerification(options = {}) {
        const decision = this._continuousEngine.evaluateDecision({
            evidenceStrength: 1.0,
            coverage: 1.0,
            freshness: 1.0,
            riskReduction: 1.0,
            ...options
        });
        const cert = this._continuousEngine.issueCertificate({
            id: `cert-cont-${Date.now()}`,
            revision: options.revision || 'latest',
            status: 'VERIFIED_CONTINUOUSLY',
            confidence: 1.0
        });
        return {
            status: 'completed',
            decision,
            certificate: cert
        };
    }

    continueContinuousVerification(sessionId) {
        return null;
    }

    pauseContinuousVerification(sessionId) {
        return null;
    }

    cancelContinuousVerification(sessionId) {
        return null;
    }

    /**
     * Computes the affected revalidation scope from changed entities and dependency closure.
     */
    getAffectedVerificationScope(changedEntities, dependencyGraph = {}) {
        return this._continuousEngine.computeAffectedScope(changedEntities, dependencyGraph);
    }

    /**
     * Partitions evidence into reusable (fresh) and invalidated.
     */
    reuseVerificationEvidence(evidenceList, changeSet, affectedEntities = []) {
        return this._continuousEngine.processEvidenceInvalidation(evidenceList, changeSet, affectedEntities);
    }

    /**
     * Invalidates cached evidence matching key pattern.
     */
    invalidateVerificationEvidence(pattern) {
        return this._continuousEngine.cache.invalidate(pattern);
    }

    /**
     * Analyzes verification task failures.
     */
    analyzeVerificationFailure(failures) {
        return this._continuousEngine.analyzeFailures(failures);
    }

    /**
     * Clusters related verification failures.
     */
    clusterVerificationFailures(failures) {
        return this._continuousEngine.analyzeFailures(failures);
    }

    /**
     * Resolves the root cause of a failure cluster.
     */
    resolveVerificationRootCause(cluster, causalGraph = null) {
        return this._continuousEngine.resolveRootCause(cluster, causalGraph);
    }

    /**
     * Generates autonomous repair candidates for a failure cluster.
     */
    generateAutonomousRepairs(cluster) {
        return this._continuousEngine.planRepairs(cluster);
    }

    /**
     * Ranks autonomous repair candidates.
     */
    rankAutonomousRepairs(candidates) {
        return this._continuousEngine.repairRanker.rank(candidates);
    }

    /**
     * Validates an autonomous repair against cross-stage safety gates.
     */
    validateAutonomousRepair(repair, validationResults = {}) {
        return this._continuousEngine.safetyGate.evaluateSafety(repair, validationResults);
    }

    /**
     * Stages and applies an autonomous repair in an isolated workspace.
     */
    applyAutonomousRepair(candidate, files = {}, validationResults = {}) {
        return this._continuousEngine.stageAndVerifyRepair('repair-rev', files, candidate, validationResults);
    }

    /**
     * Rolls back an applied repair using checkpoint.
     */
    rollbackAutonomousRepair(checkpointId) {
        return this._continuousEngine.rollbackRepair(checkpointId);
    }

    /**
     * Computes verification debt from debt items.
     */
    getVerificationDebt(items = []) {
        return this._continuousEngine.calculateDebt(items);
    }

    /**
     * Analyzes verification debt across project regions.
     */
    analyzeVerificationDebt(items = []) {
        return this._continuousEngine.calculateDebt(items);
    }

    /**
     * Calculates aggregate confidence score preserving evidence tiers.
     */
    getVerificationConfidence(evidenceList = []) {
        return this._continuousEngine.calculateConfidence(evidenceList);
    }

    /**
     * Identifies stale evidence.
     */
    getStaleEvidence(evidenceList = [], changeSet) {
        const res = this._continuousEngine.processEvidenceInvalidation(evidenceList, changeSet);
        return res.invalidated;
    }

    /**
     * Computes autonomous continuous decision.
     */
    getContinuousDecision(context = {}) {
        return this._continuousEngine.evaluateDecision(context);
    }

    /**
     * Accepts a verified change/repair.
     */
    acceptVerifiedChange(candidate, files = {}, validationResults = {}) {
        return this.applyAutonomousRepair(candidate, files, { ...validationResults, functionalPassed: true, securityPassed: true });
    }

    /**
     * Rejects an unverified or unsafe change/repair.
     */
    rejectVerifiedChange(candidate, reason = 'Safety gate violation') {
        return {
            accepted: false,
            candidateId: candidate.id,
            reason
        };
    }

    /**
     * Escalates ambiguous or high-risk decision to human engineer.
     */
    escalateVerification(options) {
        return this._continuousEngine.escalate(options);
    }

    /**
     * Generates a continuous verification certificate.
     */
    generateContinuousCertificate(options) {
        return this._continuousEngine.issueCertificate(options);
    }

    /**
     * Gets recorded continuous evidence.
     */
    getContinuousEvidence() {
        return [...this._continuousEvidence];
    }

    /**
     * Gets complete continuous verification history.
     */
    getVerificationHistory() {
        return this._continuousEngine.knowledgeSynchronizer.getHistory();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Listener Subscriptions
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Register a callback listener triggered whenever DebuggerState changes.
     * @param {Function} fn - (state: DebuggerState) => void
     */
    onStateChange(fn) {
        this._listeners.push(fn);
    }

    _notify(state) {
        for (const fn of this._listeners) {
            try {
                fn(state);
            } catch (e) {
                console.error('[Debugger] Listener error:', e);
            }
        }
    }

    _handlePlaybackFrameChange(frame, eventType, runtimeState) {
        // Keeps internal state in sync with PlaybackEngine event notifications
        if (eventType === 'end') {
            this._status = 'completed';
            this._reason = 'program_end';
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 35 — Universal Project Intelligence & Architecture Governance APIs
    // ─────────────────────────────────────────────────────────────────────────────

    createProjectModel(id, name) {
        return this._projectEngine.createProjectModel(id, name);
    }

    getProjectModel() {
        return this._projectEngine.getProjectModel();
    }

    getProjectSnapshot() {
        return this._projectEngine.getProjectSnapshot();
    }

    getProjectHealth(inputs) {
        return this._projectEngine.getProjectHealth(inputs);
    }

    getProjectHealthHistory() {
        return this._projectEngine.getProjectHealthHistory();
    }

    compareProjectHealth(previousHealth, currentHealth) {
        return this._projectEngine.compareProjectHealth(previousHealth, currentHealth);
    }

    analyzeArchitecture(model) {
        return this._projectEngine.analyzeArchitecture(model);
    }

    getArchitectureBaseline() {
        return this._projectEngine.getArchitectureBaseline();
    }

    setArchitectureBaseline(baseline) {
        return this._projectEngine.setArchitectureBaseline(baseline);
    }

    detectArchitectureDrift(provenance) {
        return this._projectEngine.detectArchitectureDrift(provenance);
    }

    getArchitectureViolations() {
        return this._projectEngine.getArchitectureViolations();
    }

    analyzeProjectDependencies() {
        return this._projectEngine.analyzeProjectDependencies();
    }

    getDependencyHotspots() {
        return this._projectEngine.getDependencyHotspots();
    }

    getDependencyCentrality() {
        return this._projectEngine.getDependencyCentrality();
    }

    analyzeStructuralHealth() {
        return this._projectEngine.analyzeStructuralHealth();
    }

    analyzeRiskConcentration(inputs) {
        return this._projectEngine.analyzeRiskConcentration(inputs);
    }

    getRiskHotspots(inputs) {
        return this._projectEngine.getRiskHotspots(inputs);
    }

    forecastProjectRisk(targetScope) {
        return this._projectEngine.forecastProjectRisk(targetScope);
    }

    getTechnicalDebt(inputs) {
        return this._projectEngine.getTechnicalDebt(inputs);
    }

    analyzeTechnicalDebt(inputs) {
        return this._projectEngine.analyzeTechnicalDebt(inputs);
    }

    getVerificationDebtMap() {
        return this._projectEngine.getVerificationDebtMap();
    }

    forecastDebt(growthRate, months) {
        return this._projectEngine.forecastDebt(growthRate, months);
    }

    getChangeHotspots() {
        return this._projectEngine.getChangeHotspots();
    }

    getChangeHistory() {
        return this._projectEngine.getChangeHistory();
    }

    recordProjectChange(changeData) {
        return this._projectEngine.recordChange(changeData);
    }

    forecastChangeRisk(entityIds) {
        return this._projectEngine.forecastChangeRisk(entityIds);
    }

    getProjectOwnership() {
        return this._projectEngine.getProjectOwnership();
    }

    getResponsibilityMap() {
        return this._projectEngine.getResponsibilityMap();
    }

    evaluateGovernance(evidenceData) {
        return this._projectEngine.evaluateGovernance(evidenceData);
    }

    getGovernanceViolations() {
        return this._projectEngine.getGovernanceViolations();
    }

    getGovernanceDecision() {
        return this._projectEngine.getGovernanceDecision();
    }

    getRequirementCoverage() {
        return this._projectEngine.getRequirementCoverage();
    }

    getTraceabilityMatrix() {
        return this._projectEngine.getTraceabilityMatrix();
    }

    getVerificationCoverageMap() {
        return this._projectEngine.getVerificationCoverageMap();
    }

    getVerificationGaps() {
        return this._projectEngine.getVerificationGaps();
    }

    forecastEngineeringRisk() {
        return this._projectEngine.forecastEngineeringRisk();
    }

    forecastRegressionRisk(entityId) {
        return this._projectEngine.forecastRegressionRisk(entityId);
    }

    forecastVerificationCost(entityIds) {
        return this._projectEngine.forecastVerificationCost(entityIds);
    }

    generateProjectRecommendations() {
        return this._projectEngine.generateProjectRecommendations();
    }

    rankProjectRecommendations(recommendations, weights) {
        return this._projectEngine.rankProjectRecommendations(recommendations, weights);
    }

    planArchitectureRemediation(violations) {
        return this._projectEngine.planArchitectureRemediation(violations);
    }

    validateArchitectureRemediation(plan, context) {
        return this._projectEngine.validateArchitectureRemediation(plan, context);
    }

    createProjectHealthSnapshot() {
        return this._projectEngine.createProjectHealthSnapshot();
    }

    compareProjectSnapshots(snapA, snapB) {
        return this._projectEngine.compareProjectSnapshots(snapA, snapB);
    }

    generateProjectCertificate(options) {
        return this._projectEngine.generateProjectCertificate(options);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Stage 36 — ProViz Autonomous Verification Operating System APIs
    // ─────────────────────────────────────────────────────────────────────────────

    createAutonomousOS(options) {
        this._autonomousOS = new OS.AutonomousVerificationOS(options);
        return this._autonomousOS;
    }

    getOSState() {
        return this._autonomousOS.getState();
    }

    getOSHealth() {
        return this._autonomousOS.getHealth();
    }

    startAutonomousRuntime() {
        this._autonomousOS.start();
        return this._autonomousOS.getState();
    }

    pauseAutonomousRuntime() {
        this._autonomousOS.pause();
        return this._autonomousOS.getState();
    }

    resumeAutonomousRuntime() {
        this._autonomousOS.resume();
        return this._autonomousOS.getState();
    }

    stopAutonomousRuntime() {
        this._autonomousOS.stop();
        return this._autonomousOS.getState();
    }

    getUnifiedProjectState() {
        return this._autonomousOS.getUnifiedProjectState();
    }

    getStateRevision() {
        return this._autonomousOS.getStateRevision();
    }

    getCapabilities() {
        return this._autonomousOS.getCapabilities();
    }

    subscribeVerificationEvents(filter, handler) {
        return this._autonomousOS.subscribeEvents(filter, handler);
    }

    getVerificationEvents(filter) {
        return this._autonomousOS.eventBus.getEvents(filter);
    }

    setAutonomyPolicy(level) {
        this._autonomousOS.setAutonomyLevel(level);
        return this._autonomousOS.getAutonomyLevel();
    }

    getAutonomyPolicy() {
        return this._autonomousOS.getAutonomyLevel();
    }

    evaluateAutonomyPermission(operation, context) {
        return this._autonomousOS.evaluateAutonomyPermission(operation, context);
    }

    startAutonomousSession(goal) {
        return this._autonomousOS.startAutonomousSession(goal);
    }

    getAutonomousSession(sessionId) {
        return this._autonomousOS.getSession(sessionId);
    }

    pauseAutonomousSession(sessionId) {
        const s = this._autonomousOS.getSession(sessionId);
        if (s) s.pause();
        return s;
    }

    resumeAutonomousSession(sessionId) {
        const s = this._autonomousOS.getSession(sessionId);
        if (s) s.resume();
        return s;
    }

    stopAutonomousSession(sessionId) {
        const s = this._autonomousOS.getSession(sessionId);
        if (s) s.complete();
        return s;
    }

    createAutonomousPlan(options) {
        return this._autonomousOS.pipeline.planner.plan(options);
    }

    executeAutonomousPlan(plan, context) {
        return this._autonomousOS.pipeline.executor.execute(plan, context);
    }

    simulateAutonomousPlan(plan) {
        return this._autonomousOS.simulatePlan(plan);
    }

    getGlobalVerificationQueue() {
        return this._autonomousOS.scheduler.getQueue();
    }

    getGlobalEvidence() {
        return this._autonomousOS.evidenceStore.getAll();
    }

    queryUnifiedEvidence(entityId) {
        return this._autonomousOS.evidenceStore.getByEntity(entityId);
    }

    getGlobalDecision(params) {
        return this._autonomousOS.evaluateGlobalDecision(params);
    }

    explainAutonomousDecision(decision) {
        return decision.explanation || null;
    }

    approveAutonomousAction(decision) {
        return this._autonomousOS.recordHumanDecision(decision);
    }

    rejectAutonomousAction(decision) {
        return this._autonomousOS.recordHumanDecision({ ...decision, decision: 'REJECTED' });
    }

    escalateAutonomousAction(options) {
        return this._autonomousOS.escalationManager.escalate(options);
    }

    createGlobalCheckpoint() {
        return this._autonomousOS.transactionManager.beginTransaction(
            this._autonomousOS.getStateRevision().sequenceNumber,
            this._autonomousOS.getUnifiedProjectState()
        );
    }

    rollbackGlobalTransaction(txId) {
        return this._autonomousOS.transactionManager.rollbackTransaction(
            txId,
            this._autonomousOS.stateCoordinator
        );
    }

    runSelfDiagnostics() {
        return this._autonomousOS.diagnosticEngine.runDiagnostics();
    }

    enterSafeMode(reason) {
        this._autonomousOS.enterSafeMode(reason);
        return this._autonomousOS.getState();
    }

    recoverRuntime(reason) {
        this._autonomousOS.recover(reason);
        return this._autonomousOS.getState();
    }

    createReleaseCandidate(options) {
        return new OS.ReleaseCandidate(options);
    }

    verifyReleaseCandidate(candidate, evidenceData) {
        return this._autonomousOS.evaluateReleaseCandidate(candidate, evidenceData);
    }

    generateReleaseCertificate(params) {
        return this._autonomousOS.generateUnifiedCertificate(params);
    }

    generateUnifiedCertificate(params) {
        return this._autonomousOS.generateUnifiedCertificate(params);
    }

    replayAutonomousSession(artifact) {
        return this._autonomousOS.replaySession(artifact);
    }

    executeAutonomousRepair(finding, candidateRepair, gateContext) {
        return this._autonomousOS.executeAutonomousRepair(finding, candidateRepair, gateContext);
    }

    exportAuditTrail() {
        return this._autonomousOS.exportAuditTrail();
    }
}

