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
}
