/**
 * PlaybackEngine — Controls stepping and scrubbing through execution traces.
 *
 * In Stage 3, PlaybackEngine delegates to StateReconstructor to ensure:
 *  - Deterministic state at any frame index regardless of navigation history.
 *  - Pure bidirectional time travel (step forward, step backward, scrubbing).
 *  - Full backward compatibility for existing 3D visualizers and UI controllers.
 */

import { StateReconstructor } from './playback/StateReconstructor.js';
import { Timeline } from './playback/Timeline.js';
import { SceneBuilder } from './scene/SceneBuilder.js';

export class PlaybackEngine {
    constructor() {
        this._reconstructor = null;
        this._timeline = new Timeline();
        this._sceneBuilder = new SceneBuilder();
        this._currentIdx = -1;
        this._playing = false;
        this._playTimer = null;
        this._listeners = [];
        this.speedMs = 800;
    }

    /**
     * Load a new set of frames or a full UET execution trace.
     * @param {Array<object>|object} input - Visualization frames array or canonical UET trace
     * @param {object} [problemConfig={}] - Optional problem-specific configuration
     */
    setFrames(input, problemConfig = {}) {
        if (input && typeof input === 'object' && Array.isArray(input.events)) {
            // Received full UET trace
            this._reconstructor = new StateReconstructor({
                uetTrace: input,
                checkpointInterval: 50,
                problemConfig,
            });
            this._timeline = this._reconstructor.timeline;
        } else if (Array.isArray(input)) {
            // Received legacy frames array directly
            this._timeline = new Timeline({ frames: input });
            this._reconstructor = new StateReconstructor({
                uetTrace: { events: [], heap: {} },
                checkpointInterval: 50,
                problemConfig,
            });
            this._reconstructor.timeline = this._timeline;
        } else {
            this._timeline = new Timeline();
            this._reconstructor = null;
        }

        this._currentIdx = -1;
        this._playing = false;
        if (this._playTimer) {
            clearTimeout(this._playTimer);
            this._playTimer = null;
        }
        this._notify(null, 'reset', null);
    }

    get totalFrames() {
        return this._timeline.totalFrames;
    }

    get currentIdx() {
        return this._currentIdx;
    }

    get isAtStart() {
        return this._currentIdx <= 0;
    }

    get isAtEnd() {
        return this._currentIdx >= this._timeline.totalFrames - 1;
    }

    get isPlaying() {
        return this._playing;
    }

    get timeline() {
        return this._timeline;
    }

    get reconstructor() {
        return this._reconstructor;
    }

    /**
     * Register a listener: fn(frame, event_type, runtimeState)
     * @param {Function} fn
     */
    onFrameChange(fn) {
        this._listeners.push(fn);
    }

    _notify(frame, event, runtimeState = null) {
        for (const fn of this._listeners) {
            try {
                fn(frame, event, runtimeState);
            } catch (e) {
                console.error('[PlaybackEngine] Listener error:', e);
            }
        }
    }

    /**
     * Advance to the next frame.
     * @returns {object|null} Next frame or null if at end
     */
    nextFrame() {
        if (this._currentIdx >= this._timeline.totalFrames - 1) {
            this._notify(null, 'end', null);
            return null;
        }
        this._currentIdx++;
        const frame = this._timeline.getFrame(this._currentIdx);
        const runtimeState = this._reconstructor ? this._reconstructor.reconstruct(this._currentIdx) : null;
        this._notify(frame, 'next', runtimeState);
        return frame;
    }

    /**
     * Go back to the previous frame via deterministic state reconstruction.
     * @returns {object|null} Previous frame or null if at start
     */
    prevFrame() {
        if (this._currentIdx <= 0) {
            this._currentIdx = 0;
            const frame = this._timeline.getFrame(0) || null;
            const runtimeState = this._reconstructor ? this._reconstructor.reconstruct(0) : null;
            this._notify(frame, 'prev', runtimeState);
            return frame;
        }
        this._currentIdx--;
        const frame = this._timeline.getFrame(this._currentIdx);
        const runtimeState = this._reconstructor ? this._reconstructor.reconstruct(this._currentIdx) : null;
        this._notify(frame, 'prev', runtimeState);
        return frame;
    }

    /**
     * Jump/scrub to a specific frame index deterministically.
     * @param {number} idx - Target index
     * @returns {object|null} Target frame
     */
    jumpTo(idx) {
        const clamped = Math.max(0, Math.min(idx, this._timeline.totalFrames - 1));
        this._currentIdx = clamped;
        const frame = this._timeline.getFrame(clamped) || null;
        const runtimeState = this._reconstructor ? this._reconstructor.reconstruct(clamped) : null;
        this._notify(frame, 'jump', runtimeState);
        return frame;
    }

    /**
     * Reset timeline to start.
     */
    restart() {
        this.pause();
        this._currentIdx = -1;
        this._notify(null, 'restart', null);
    }

    /**
     * Return current frame without advancing index.
     * @returns {object|null}
     */
    getCurrentFrame() {
        if (this._currentIdx < 0 || this._currentIdx >= this._timeline.totalFrames) return null;
        return this._timeline.getFrame(this._currentIdx);
    }

    /**
     * Return the reconstructed RuntimeState at current frame index.
     * @returns {RuntimeState|null}
     */
    getCurrentRuntimeState() {
        if (this._currentIdx < 0 || !this._reconstructor) return null;
        return this._reconstructor.reconstruct(this._currentIdx);
    }

    /**
     * Alias for getCurrentRuntimeState.
     * @returns {RuntimeState|null}
     */
    getCurrentState() {
        return this.getCurrentRuntimeState();
    }

    /**
     * Return the deterministic SceneGraph for the current frame.
     * @returns {import('./scene/SceneGraph.js').SceneGraph|null}
     */
    getCurrentScene() {
        const state = this.getCurrentRuntimeState();
        return state ? this._sceneBuilder.build(state) : null;
    }

    /**
     * Return the deterministic SceneGraph at a specific frame index without altering playback position.
     * @param {number} idx
     * @returns {import('./scene/SceneGraph.js').SceneGraph|null}
     */
    getSceneAt(idx) {
        if (!this._reconstructor) return null;
        const state = this._reconstructor.reconstruct(idx);
        return state ? this._sceneBuilder.build(state) : null;
    }

    getProgress() {
        return {
            current: this._currentIdx + 1,
            total: this._timeline.totalFrames,
            percent: this._timeline.totalFrames > 0
                ? Math.round(((this._currentIdx + 1) / this._timeline.totalFrames) * 100)
                : 0,
        };
    }

    /**
     * Auto-advance playback.
     */
    play() {
        if (this._playing) return;
        this._playing = true;
        this._tick();
    }

    /**
     * Pause playback.
     */
    pause() {
        this._playing = false;
        if (this._playTimer) {
            clearTimeout(this._playTimer);
            this._playTimer = null;
        }
    }

    _tick() {
        if (!this._playing) return;
        const frame = this.nextFrame();
        if (frame === null) {
            this.pause();
            return;
        }
        this._playTimer = setTimeout(() => this._tick(), this.speedMs);
    }

    setSpeed(ms) {
        this.speedMs = Math.max(50, ms);
    }
}
