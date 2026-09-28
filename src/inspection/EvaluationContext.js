/**
 * EvaluationContext — Encapsulates the execution environment snapshot for expression evaluation.
 *
 * Provides safe, scoped access to:
 *  - Active CallFrame local scope & variables
 *  - Module globals & enclosing scopes
 *  - Heap object graph
 *  - Evaluation limits & constraints (maxDepth, maxItems, timeoutMs)
 */

import { RuntimeState } from '../runtime/RuntimeState.js';
import { Heap } from '../runtime/Heap.js';
import { Scope } from '../runtime/Scope.js';

export const DEFAULT_LIMITS = Object.freeze({
    maxDepth: 16,
    maxItems: 64,
    maxStringLength: 200,
    timeoutMs: 500,
});

export class EvaluationContext {
    /**
     * @param {object} params
     * @param {number} [params.frameIndex=-1]
     * @param {string|null} [params.fileId=null]
     * @param {string|null} [params.moduleId=null]
     * @param {string|null} [params.callFrameId=null]
     * @param {RuntimeState|null} [params.runtimeState=null]
     * @param {Heap|null} [params.heap=null]
     * @param {Scope|null} [params.scope=null]
     * @param {object} [params.limits]
     * @param {string} [params.language='python']
     */
    constructor({
        frameIndex = -1,
        fileId = null,
        moduleId = null,
        callFrameId = null,
        runtimeState = null,
        heap = null,
        scope = null,
        limits = {},
        language = 'python',
    } = {}) {
        this.frameIndex = frameIndex;
        this.fileId = fileId;
        this.moduleId = moduleId;
        this.callFrameId = callFrameId;
        this.runtimeState = runtimeState instanceof RuntimeState ? runtimeState : (runtimeState ? new RuntimeState(runtimeState) : null);
        this.heap = heap instanceof Heap ? heap : (this.runtimeState?.heap || new Heap());
        this.scope = scope instanceof Scope ? scope : (this.runtimeState?.activeFrame?.scope || this.runtimeState?.globals || new Scope());
        this.limits = { ...DEFAULT_LIMITS, ...limits };
        this.language = (language || 'python').toLowerCase();
    }

    /**
     * Resolves an identifier through local scope -> enclosing scopes -> module globals.
     * @param {string} name
     * @returns {object|null} Structured Value descriptor or null if undefined
     */
    resolveVariable(name) {
        if (!name) return null;

        // 1. Check active call frame local scope
        if (this.runtimeState && this.runtimeState.activeFrame) {
            const activeScope = this.runtimeState.activeFrame.scope;
            if (activeScope && activeScope.hasBinding(name)) {
                return activeScope.getBinding(name);
            }
        } else if (this.scope && this.scope.hasBinding(name)) {
            return this.scope.getBinding(name);
        }

        // 2. Check enclosing call stack frames (innermost to outermost)
        if (this.runtimeState && Array.isArray(this.runtimeState.callStack)) {
            const stack = this.runtimeState.callStack;
            for (let i = stack.length - 2; i >= 0; i--) {
                const frame = stack[i];
                if (frame.scope && frame.scope.hasBinding(name)) {
                    return frame.scope.getBinding(name);
                }
            }
        }

        // 3. Check module / global scope
        if (this.runtimeState && this.runtimeState.globals && this.runtimeState.globals.hasBinding(name)) {
            return this.runtimeState.globals.getBinding(name);
        }

        return null;
    }

    /**
     * Resolves a module-qualified variable (e.g. 'utils.helper').
     * @param {string} moduleIdOrName
     * @param {string} varName
     * @returns {object|null}
     */
    resolveModuleVariable(moduleIdOrName, varName) {
        // Look up variable in the specified module scope if available
        if (this.runtimeState && this.runtimeState.globals) {
            const qualifiedName = `${moduleIdOrName}.${varName}`;
            if (this.runtimeState.globals.hasBinding(qualifiedName)) {
                return this.runtimeState.globals.getBinding(qualifiedName);
            }
        }
        return this.resolveVariable(varName);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Factory Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Creates an EvaluationContext from a DebuggerState instance.
     * @param {import('../debugger/DebuggerState.js').DebuggerState} debuggerState
     * @param {object} [options]
     * @returns {EvaluationContext}
     */
    static fromDebuggerState(debuggerState, options = {}) {
        if (!debuggerState) return new EvaluationContext(options);

        const runtimeState = debuggerState.runtimeState;
        const sourceLoc = debuggerState.sourceLocation || {};

        return new EvaluationContext({
            frameIndex: debuggerState.frameIndex,
            fileId: sourceLoc.fileId || null,
            moduleId: sourceLoc.moduleId || null,
            callFrameId: runtimeState?.activeFrame?.frameId || null,
            runtimeState,
            heap: runtimeState?.heap || null,
            scope: runtimeState?.activeFrame?.scope || runtimeState?.globals || null,
            limits: options.limits,
            language: options.language || 'python',
        });
    }

    /**
     * Creates an EvaluationContext from a RuntimeState instance.
     * @param {RuntimeState} runtimeState
     * @param {object} [options]
     * @returns {EvaluationContext}
     */
    static fromRuntimeState(runtimeState, options = {}) {
        return new EvaluationContext({
            runtimeState,
            heap: runtimeState?.heap || null,
            scope: runtimeState?.activeFrame?.scope || runtimeState?.globals || null,
            frameIndex: options.frameIndex ?? -1,
            fileId: options.fileId || runtimeState?.currentSource?.fileId || null,
            moduleId: options.moduleId || runtimeState?.currentSource?.moduleId || null,
            limits: options.limits,
            language: options.language || 'python',
        });
    }

    /**
     * Creates an EvaluationContext for a specific timeline frame.
     * @param {object} frame - Timeline VisualizationFrame
     * @param {RuntimeState} runtimeState
     * @param {object} [options]
     * @returns {EvaluationContext}
     */
    static fromFrame(frame, runtimeState, options = {}) {
        return new EvaluationContext({
            frameIndex: frame?.frame_id ?? options.frameIndex ?? -1,
            fileId: frame?.source?.fileId || options.fileId || null,
            moduleId: frame?.source?.moduleId || options.moduleId || null,
            runtimeState,
            heap: runtimeState?.heap || null,
            scope: runtimeState?.activeFrame?.scope || runtimeState?.globals || null,
            limits: options.limits,
            language: options.language || 'python',
        });
    }
}
