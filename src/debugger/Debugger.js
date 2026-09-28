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

export class Debugger {
    /**
     * @param {object} [params]
     * @param {PlaybackEngine} [params.playbackEngine] - Optional external PlaybackEngine instance
     */
    constructor({ playbackEngine = null } = {}) {
        this._playbackEngine = playbackEngine || new PlaybackEngine();
        this._breakpoints = new Map(); // id -> Breakpoint
        this._status = 'idle'; // 'idle' | 'running' | 'paused' | 'completed' | 'error'
        this._reason = 'idle'; // 'idle' | 'step' | 'breakpoint' | 'exception' | 'program_end' | 'jump' | 'restart' | 'run' | 'pause'
        this._exception = null;
        this._uetTrace = null;
        this._listeners = [];

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
