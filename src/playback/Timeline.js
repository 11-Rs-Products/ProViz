/**
 * Timeline — Indexed representation of execution events and frames across time.
 *
 * Keeps timeline indexing and addressing independent of Three.js rendering.
 */

export class Timeline {
    /**
     * @param {object} params
     * @param {Array<object>} [params.events=[]] - Canonical UET events
     * @param {Array<object>} [params.frames=[]] - Visualization frames
     * @param {object} [params.metadata={}] - Execution metadata
     */
    constructor({ events = [], frames = [], metadata = {} } = {}) {
        this.events = Array.isArray(events) ? events : [];
        this.frames = Array.isArray(frames) ? frames : [];
        this.metadata = { ...metadata };
    }

    get totalFrames() {
        return this.frames.length;
    }

    get totalEvents() {
        return this.events.length;
    }

    get durationMs() {
        return this.metadata.duration_ms || 0;
    }

    isValidIndex(index) {
        return typeof index === 'number' && index >= 0 && index < this.frames.length;
    }

    getFrame(index) {
        if (!this.isValidIndex(index)) return null;
        return this.frames[index];
    }

    getEvent(index) {
        if (typeof index !== 'number' || index < 0 || index >= this.events.length) return null;
        return this.events[index];
    }
}
