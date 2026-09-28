/**
 * AnimationRuntime — Deterministic evaluation runtime for AnimationPlans.
 *
 * Guaranteed Properties:
 *  1. Pure & Deterministic: seek(T) always produces the identical AnimationState regardless of execution history.
 *  2. Non-Destructive: Never mutates SceneGraph, RuntimeState, or AnimationPlan.
 *  3. Interruptible: Cleanly load and cancel plans without state drift.
 */

import { AnimationPlan } from './AnimationPlan.js';
import { AnimationState, ANIMATION_STATUS } from './AnimationState.js';

export class AnimationRuntime {
    /**
     * @param {object} [options={}]
     * @param {number} [options.speed=1.0] - Speed multiplier
     */
    constructor(options = {}) {
        this.speed = Math.max(0.01, options.speed || 1.0);
        this.currentPlan = null;
        this.time = 0;
        this.status = ANIMATION_STATUS.IDLE;
        this.listeners = [];
    }

    /**
     * Load an AnimationPlan into the runtime.
     *
     * @param {AnimationPlan|null} plan
     * @returns {AnimationState} Initial evaluated state at time 0
     */
    load(plan) {
        this.currentPlan = plan instanceof AnimationPlan ? plan : (plan ? new AnimationPlan(plan) : null);
        this.time = 0;
        this.status = this.currentPlan && !this.currentPlan.isEmpty ? ANIMATION_STATUS.PAUSED : ANIMATION_STATUS.IDLE;
        const state = this.getState();
        this._notify(state);
        return state;
    }

    /**
     * Start/resume playback.
     */
    play() {
        if (!this.currentPlan) return;
        if (this.status === ANIMATION_STATUS.COMPLETED) {
            this.time = 0;
        }
        this.status = ANIMATION_STATUS.RUNNING;
        this._notify(this.getState());
    }

    /**
     * Pause playback.
     */
    pause() {
        if (this.status === ANIMATION_STATUS.RUNNING) {
            this.status = ANIMATION_STATUS.PAUSED;
            this._notify(this.getState());
        }
    }

    /**
     * Resume playback.
     */
    resume() {
        this.play();
    }

    /**
     * Stop and reset time to 0.
     */
    stop() {
        this.time = 0;
        this.status = ANIMATION_STATUS.IDLE;
        this._notify(this.getState());
    }

    /**
     * Cancel the active animation plan.
     */
    cancel() {
        this.status = ANIMATION_STATUS.CANCELLED;
        this._notify(this.getState());
    }

    /**
     * Advance animation time by deltaTime seconds.
     *
     * @param {number} deltaTime - Elapsed time in seconds
     * @returns {AnimationState}
     */
    advance(deltaTime) {
        if (!this.currentPlan || this.status !== ANIMATION_STATUS.RUNNING) {
            return this.getState();
        }

        const duration = this.currentPlan.duration;
        const step = Math.max(0, deltaTime) * this.speed;
        this.time = Math.min(duration, this.time + step);

        if (this.time >= duration) {
            this.status = ANIMATION_STATUS.COMPLETED;
        }

        const state = this.getState();
        this._notify(state);
        return state;
    }

    /**
     * Seek directly to a specific timestamp in seconds.
     *
     * Invariant: seek(T) must produce the exact same AnimationState regardless of how it was reached.
     *
     * @param {number} targetTime - Time in seconds
     * @returns {AnimationState}
     */
    seek(targetTime) {
        if (!this.currentPlan) {
            return new AnimationState();
        }

        const duration = this.currentPlan.duration;
        this.time = Math.max(0, Math.min(duration, targetTime));

        if (this.time >= duration && duration > 0) {
            this.status = ANIMATION_STATUS.COMPLETED;
        } else if (this.status === ANIMATION_STATUS.COMPLETED && this.time < duration) {
            this.status = ANIMATION_STATUS.PAUSED;
        }

        const state = this.getState();
        this._notify(state);
        return state;
    }

    /**
     * Seek to normalized progress [0, 1].
     *
     * @param {number} progress
     * @returns {AnimationState}
     */
    seekProgress(progress) {
        if (!this.currentPlan) return new AnimationState();
        const duration = this.currentPlan.duration;
        return this.seek(progress * duration);
    }

    /**
     * Whether current animation is complete.
     * @returns {boolean}
     */
    isComplete() {
        if (!this.currentPlan) return true;
        return this.status === ANIMATION_STATUS.COMPLETED || this.time >= this.currentPlan.duration;
    }

    /**
     * Purely evaluate and return the AnimationState at current runtime timestamp.
     *
     * @returns {AnimationState}
     */
    getState() {
        if (!this.currentPlan) {
            return new AnimationState({ status: this.status });
        }

        const duration = this.currentPlan.duration;
        const progress = duration > 0 ? Math.max(0, Math.min(1, this.time / duration)) : 1;

        const nodeStates = {};
        const relationshipStates = {};
        const activeClips = [];

        // Evaluate all tracks in deterministic sorted order
        const tracks = this.currentPlan.getAllTracks();
        for (const track of tracks) {
            const evaluatedVal = track.evaluate(this.time);
            const targetId = track.targetId;
            const property = track.property;

            // Check if any clip on this track is currently active
            for (const clip of track.clips) {
                if (this.time >= clip.delay && this.time <= clip.endTime) {
                    activeClips.push(clip.id);
                }
            }

            if (targetId.startsWith('scene_rel_') || property.startsWith('relationship.')) {
                if (!relationshipStates[targetId]) {
                    relationshipStates[targetId] = { id: targetId };
                }
                setDeepProperty(relationshipStates[targetId], property, evaluatedVal);
            } else {
                if (!nodeStates[targetId]) {
                    nodeStates[targetId] = { id: targetId };
                }
                setDeepProperty(nodeStates[targetId], property, evaluatedVal);
            }
        }

        return new AnimationState({
            planId: this.currentPlan.id,
            time: this.time,
            duration,
            direction: this.currentPlan.direction,
            progress,
            status: this.status,
            nodeStates,
            relationshipStates,
            activeClips,
            metadata: { ...this.currentPlan.metadata },
        });
    }

    getSnapshot() {
        return this.getState();
    }

    onUpdate(listener) {
        if (typeof listener === 'function') {
            this.listeners.push(listener);
        }
    }

    _notify(state) {
        for (const listener of this.listeners) {
            try {
                listener(state);
            } catch (e) {
                console.error('[AnimationRuntime] listener error:', e);
            }
        }
    }
}

/**
 * Helper to set nested property paths (e.g. 'transform.position.x' or 'style.opacity')
 */
function setDeepProperty(obj, path, value) {
    if (!obj || !path) return;
    const parts = path.split('.');
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!curr[part] || typeof curr[part] !== 'object') {
            curr[part] = {};
        }
        curr = curr[part];
    }
    curr[parts[parts.length - 1]] = value;
}
