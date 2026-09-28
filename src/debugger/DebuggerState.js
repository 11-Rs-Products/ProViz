/**
 * DebuggerState — Immutable snapshot describing current observation point and derived runtime views.
 *
 * Answers:
 *  - Where am I observing the program? (frameIndex, sourceLocation)
 *  - Why am I paused? (reason, status, exception)
 *  - What source location corresponds to this point? (file, line, column)
 *  - What runtime state and 3D scene correspond to this point? (runtimeState, sceneGraph)
 *
 * Does NOT duplicate runtime truth unnecessarily; exposes references/derived accessors.
 */

export class DebuggerState {
    /**
     * @param {object} params
     * @param {string} [params.status='idle'] - 'idle' | 'running' | 'paused' | 'completed' | 'error'
     * @param {number} [params.frameIndex=-1] - 0-indexed frame index (-1 when idle/reset)
     * @param {number} [params.totalFrames=0] - Total timeline frames available
     * @param {object} [params.sourceLocation] - Current source line/file
     * @param {import('../runtime/RuntimeState.js').RuntimeState|null} [params.runtimeState=null] - Reconstructed RuntimeState
     * @param {import('../scene/SceneGraph.js').SceneGraph|null} [params.sceneGraph=null] - Derived SceneGraph
     * @param {object|null} [params.currentFrame=null] - Current timeline frame
     * @param {string} [params.reason='idle'] - 'idle' | 'step' | 'breakpoint' | 'exception' | 'program_end' | 'jump' | 'restart' | 'run' | 'pause'
     * @param {object|null} [params.exception=null] - Exception details if error state
     * @param {Array<import('./Breakpoint.js').Breakpoint>} [params.breakpoints=[]] - Active breakpoints list
     */
    constructor({
        status = 'idle',
        frameIndex = -1,
        totalFrames = 0,
        sourceLocation = { file: 'main.py', line: null, column: null },
        runtimeState = null,
        sceneGraph = null,
        currentFrame = null,
        reason = 'idle',
        exception = null,
        breakpoints = [],
    } = {}) {
        this.status = status;
        this.frameIndex = frameIndex;
        this.totalFrames = totalFrames;
        const rawPath = sourceLocation?.path || sourceLocation?.file || 'main.py';
        this.sourceLocation = {
            file: sourceLocation?.file || rawPath,
            path: rawPath,
            fileId: sourceLocation?.fileId || null,
            moduleId: sourceLocation?.moduleId || null,
            line: sourceLocation?.line ?? null,
            column: sourceLocation?.column ?? null,
            endLine: sourceLocation?.endLine ?? null,
            endColumn: sourceLocation?.endColumn ?? null,
        };
        this.runtimeState = runtimeState;
        this.sceneGraph = sceneGraph;
        this.currentFrame = currentFrame;
        this.reason = reason;
        this.exception = exception ? { ...exception } : null;
        this.breakpoints = Array.isArray(breakpoints) ? breakpoints.map(b => b.clone ? b.clone() : { ...b }) : [];
    }

    /**
     * Derived call stack array from RuntimeState.
     * @returns {Array<object>}
     */
    get callStack() {
        if (!this.runtimeState) return [];
        return this.runtimeState.callStack;
    }

    /**
     * Derived active scope locals from RuntimeState.
     * @returns {object}
     */
    get activeLocals() {
        if (!this.runtimeState) return {};
        return this.runtimeState.activeLocals;
    }

    /**
     * Derived active call frame.
     * @returns {import('../runtime/CallFrame.js').CallFrame|null}
     */
    get activeFrame() {
        if (!this.runtimeState) return null;
        return this.runtimeState.activeFrame;
    }

    /**
     * Serialized view of DebuggerState for UI inspection and debugging.
     */
    toJSON() {
        return {
            status: this.status,
            frameIndex: this.frameIndex,
            totalFrames: this.totalFrames,
            sourceLocation: this.sourceLocation,
            reason: this.reason,
            exception: this.exception,
            callStackDepth: this.callStack.length,
            activeLocalsKeys: Object.keys(this.activeLocals),
            hasSceneGraph: Boolean(this.sceneGraph),
            hasRuntimeState: Boolean(this.runtimeState),
        };
    }
}
