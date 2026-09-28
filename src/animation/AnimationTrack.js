/**
 * AnimationTrack — Ordered collection of AnimationClips for a single target and property.
 *
 * Provides deterministic timeline evaluation for a specific property channel.
 */

import { AnimationClip } from './AnimationClip.js';

export class AnimationTrack {
    /**
     * @param {object} params
     * @param {string} params.id - Deterministic track identifier (e.g. 'scene_obj_1:transform.position')
     * @param {string} params.targetId - Semantic target ID
     * @param {string} params.property - Property path
     * @param {AnimationClip[]} [params.clips=[]] - Initial clips
     * @param {object} [params.metadata={}] - Track metadata
     */
    constructor({
        id,
        targetId,
        property,
        clips = [],
        metadata = {},
    }) {
        this.targetId = targetId;
        this.property = property;
        this.id = id || `${targetId}:${property}`;
        this.clips = [];
        this.metadata = { ...metadata };

        if (Array.isArray(clips)) {
            for (const clip of clips) {
                this.addClip(clip);
            }
        }
    }

    /**
     * Total duration of this track across all clips.
     * @returns {number}
     */
    get duration() {
        if (this.clips.length === 0) return 0;
        let maxTime = 0;
        for (const clip of this.clips) {
            maxTime = Math.max(maxTime, clip.endTime);
        }
        return maxTime;
    }

    /**
     * Add a clip to this track. Maintains deterministic sorting by delay.
     * @param {AnimationClip|object} clip
     * @returns {AnimationClip}
     */
    addClip(clip) {
        const animClip = clip instanceof AnimationClip ? clip : new AnimationClip(clip);
        this.clips.push(animClip);
        this._sortClips();
        return animClip;
    }

    getClip(index) {
        return this.clips[index] || null;
    }

    getClips() {
        return [...this.clips];
    }

    /**
     * Evaluate property value at a specific point in time.
     *
     * @param {number} time - Global time in seconds
     * @returns {any} Evaluated property value
     */
    evaluate(time) {
        if (this.clips.length === 0) return undefined;

        // If before first clip, return from of first clip
        if (time <= this.clips[0].delay) {
            return this.clips[0].from;
        }

        // Find active clip at this time
        for (let i = 0; i < this.clips.length; i++) {
            const clip = this.clips[i];
            if (time >= clip.delay && time <= clip.endTime) {
                return clip.evaluateAtTime(time);
            }
            // If between clips, hold the value of the preceding clip
            if (time > clip.endTime && (i === this.clips.length - 1 || time < this.clips[i + 1].delay)) {
                return clip.to;
            }
        }

        // If after all clips, return to of last clip
        return this.clips[this.clips.length - 1].to;
    }

    /**
     * Create a reversed version of this track.
     *
     * @param {number} [totalDuration=null] - Optional total plan duration to anchor clip delays
     * @returns {AnimationTrack}
     */
    reverse(totalDuration = null) {
        const durationWindow = totalDuration ?? this.duration;
        const reversedClips = this.clips.map(clip => {
            const reversedDelay = Math.max(0, durationWindow - clip.endTime);
            const rev = clip.reverse();
            rev.delay = reversedDelay;
            return rev;
        });

        return new AnimationTrack({
            id: `${this.id}_reverse`,
            targetId: this.targetId,
            property: this.property,
            clips: reversedClips,
            metadata: { ...this.metadata, isReversed: true },
        });
    }

    _sortClips() {
        this.clips.sort((a, b) => {
            if (a.delay !== b.delay) return a.delay - b.delay;
            if (a.duration !== b.duration) return a.duration - b.duration;
            return a.id.localeCompare(b.id);
        });
    }

    clone() {
        return new AnimationTrack({
            id: this.id,
            targetId: this.targetId,
            property: this.property,
            clips: this.clips.map(c => c.clone()),
            metadata: { ...this.metadata },
        });
    }

    equals(other) {
        if (!other || !(other instanceof AnimationTrack)) return false;
        if (this.id !== other.id || this.targetId !== other.targetId || this.property !== other.property) {
            return false;
        }
        if (this.clips.length !== other.clips.length) return false;
        for (let i = 0; i < this.clips.length; i++) {
            if (!this.clips[i].equals(other.clips[i])) return false;
        }
        return JSON.stringify(this.metadata) === JSON.stringify(other.metadata);
    }

    toJSON() {
        return {
            id: this.id,
            targetId: this.targetId,
            property: this.property,
            duration: this.duration,
            clips: this.clips.map(c => c.toJSON()),
            metadata: this.metadata,
        };
    }
}
