/**
 * PlaybackEngine — Controls stepping through an execution trace.
 *
 * Works identically for solution mode and user mode — the only difference
 * is where the frames array comes from.
 *
 * API:
 *   setFrames(frames)       — load a new trace
 *   nextFrame()             — advance by 1 frame, returns current frame
 *   prevFrame()             — go back 1 frame, returns current frame
 *   jumpTo(frameId)         — jump to a specific frame
 *   restart()               — go back to the beginning
 *   getCurrentFrame()       — return current frame without moving
 *   play(callback, speedMs) — auto-advance frames, calling callback on each
 *   pause()                 — stop auto-advance
 *   onFrameChange(fn)       — register a listener called every time the frame changes
 *   getProgress()           — { current, total }
 */

export class PlaybackEngine {
    constructor() {
        this._frames = [];
        this._currentIdx = -1;
        this._playing = false;
        this._playTimer = null;
        this._listeners = [];
        this.speedMs = 800;
    }

    /** Load a new set of frames. Resets to start. */
    setFrames(frames) {
        this._frames = frames || [];
        this._currentIdx = -1;
        this._playing = false;
        this._notify(null, 'reset');
    }

    get totalFrames() { return this._frames.length; }
    get currentIdx() { return this._currentIdx; }
    get isAtStart() { return this._currentIdx <= 0; }
    get isAtEnd() { return this._currentIdx >= this._frames.length - 1; }
    get isPlaying() { return this._playing; }

    /** Register a listener: fn(frame, event_type) */
    onFrameChange(fn) {
        this._listeners.push(fn);
    }

    _notify(frame, event) {
        for (const fn of this._listeners) {
            try { fn(frame, event); } catch (e) { console.error('[PlaybackEngine] Listener error:', e); }
        }
    }

    /** Advance to next frame. Returns the new current frame or null at end. */
    nextFrame() {
        if (this._currentIdx >= this._frames.length - 1) {
            this._notify(null, 'end');
            return null;
        }
        this._currentIdx++;
        const frame = this._frames[this._currentIdx];
        this._notify(frame, 'next');
        return frame;
    }

    /** Go back to previous frame. Returns the frame or null at start. */
    prevFrame() {
        if (this._currentIdx <= 0) {
            this._currentIdx = 0;
            const frame = this._frames[0] || null;
            this._notify(frame, 'prev');
            return frame;
        }
        this._currentIdx--;
        const frame = this._frames[this._currentIdx];
        this._notify(frame, 'prev');
        return frame;
    }

    /** Jump to a specific frame index. */
    jumpTo(idx) {
        const clamped = Math.max(0, Math.min(idx, this._frames.length - 1));
        this._currentIdx = clamped;
        const frame = this._frames[clamped] || null;
        this._notify(frame, 'jump');
        return frame;
    }

    /** Jump to the first frame. */
    restart() {
        this.pause();
        this._currentIdx = -1;
        this._notify(null, 'restart');
    }

    /** Return current frame without moving. */
    getCurrentFrame() {
        if (this._currentIdx < 0 || this._currentIdx >= this._frames.length) return null;
        return this._frames[this._currentIdx];
    }

    getProgress() {
        return {
            current: this._currentIdx + 1,
            total: this._frames.length,
            percent: this._frames.length > 0
                ? Math.round(((this._currentIdx + 1) / this._frames.length) * 100)
                : 0,
        };
    }

    /** Auto-advance frames at current speed. */
    play() {
        if (this._playing) return;
        this._playing = true;
        this._tick();
    }

    /** Stop auto-advance. */
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
            this._playing = false;
            return;
        }
        this._playTimer = setTimeout(() => this._tick(), this.speedMs);
    }

    setSpeed(ms) {
        this.speedMs = Math.max(50, ms);
    }
}
