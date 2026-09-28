/**
 * AnimationPlan — Complete, deterministic, renderer-independent animation specification.
 *
 * Translates a SemanticTransitionPlan into a timeline of AnimationTracks and AnimationClips.
 * Supports pure bidirectional reversal, serializability, and deterministic comparison.
 */

import { AnimationTrack } from './AnimationTrack.js';
import { AnimationClip } from './AnimationClip.js';

export class AnimationPlan {
    /**
     * @param {object} params
     * @param {string} [params.id] - Deterministic plan identifier
     * @param {number|null} [params.fromFrame=null] - Preceding frame index
     * @param {number|null} [params.toFrame=null] - Succeeding frame index
     * @param {string} [params.direction='forward'] - 'forward' | 'reverse'
     * @param {number} [params.duration=0.5] - Total duration in seconds
     * @param {AnimationTrack[]|Record<string, AnimationTrack>} [params.tracks={}] - Tracks
     * @param {Array<object>} [params.operations=[]] - Raw semantic operations
     * @param {object} [params.metadata={}] - Plan metadata
     */
    constructor({
        id = '',
        fromFrame = null,
        toFrame = null,
        direction = 'forward',
        duration = 0.5,
        tracks = {},
        operations = [],
        metadata = {},
    } = {}) {
        this.fromFrame = fromFrame;
        this.toFrame = toFrame;
        this.direction = direction;
        this.duration = Math.max(0, duration);
        this.id = id || `plan_${fromFrame ?? 'x'}_to_${toFrame ?? 'y'}_${direction}`;
        this.operations = Array.isArray(operations) ? [...operations] : [];
        this.metadata = { ...metadata };

        this.tracks = new Map();
        if (Array.isArray(tracks)) {
            for (const t of tracks) this.addTrack(t);
        } else if (tracks && typeof tracks === 'object') {
            for (const t of Object.values(tracks)) this.addTrack(t);
        }
    }

    /**
     * Whether this plan contains zero tracks and operations.
     * @returns {boolean}
     */
    get isEmpty() {
        return this.tracks.size === 0 && this.operations.length === 0;
    }

    /**
     * Total number of clips across all tracks.
     * @returns {number}
     */
    get totalClips() {
        let count = 0;
        for (const track of this.tracks.values()) {
            count += track.clips.length;
        }
        return count;
    }

    /**
     * Add a track to this plan.
     * @param {AnimationTrack|object} track
     * @returns {AnimationTrack}
     */
    addTrack(track) {
        const animTrack = track instanceof AnimationTrack ? track : new AnimationTrack(track);
        this.tracks.set(animTrack.id, animTrack);
        this.duration = Math.max(this.duration, animTrack.duration);
        return animTrack;
    }

    /**
     * Get track by ID.
     * @param {string} trackId
     * @returns {AnimationTrack|null}
     */
    getTrack(trackId) {
        return this.tracks.get(trackId) || null;
    }

    /**
     * Add an AnimationClip, creating or appending to the corresponding target:property track.
     * @param {AnimationClip|object} clip
     * @returns {AnimationClip}
     */
    addClip(clip) {
        const animClip = clip instanceof AnimationClip ? clip : new AnimationClip(clip);
        const trackId = `${animClip.targetId}:${animClip.property}`;
        let track = this.tracks.get(trackId);
        if (!track) {
            track = new AnimationTrack({
                id: trackId,
                targetId: animClip.targetId,
                property: animClip.property,
            });
            this.tracks.set(trackId, track);
        }
        track.addClip(animClip);
        this.duration = Math.max(this.duration, track.duration);
        return animClip;
    }

    /**
     * Return all tracks in deterministic order (sorted by track id).
     * @returns {AnimationTrack[]}
     */
    getAllTracks() {
        const keys = Array.from(this.tracks.keys()).sort();
        return keys.map(k => this.tracks.get(k));
    }

    /**
     * Return all clips across all tracks in deterministic order.
     * @returns {AnimationClip[]}
     */
    getAllClips() {
        const clips = [];
        for (const track of this.getAllTracks()) {
            clips.push(...track.getClips());
        }
        return clips;
    }

    /**
     * Generate pure reverse animation plan.
     * @returns {AnimationPlan}
     */
    reverse() {
        const reversedTracks = [];
        for (const track of this.getAllTracks()) {
            reversedTracks.push(track.reverse(this.duration));
        }

        return new AnimationPlan({
            id: `${this.id}_reverse`,
            fromFrame: this.toFrame,
            toFrame: this.fromFrame,
            direction: this.direction === 'forward' ? 'reverse' : 'forward',
            duration: this.duration,
            tracks: reversedTracks,
            operations: [...this.operations].reverse(),
            metadata: { ...this.metadata, isReversed: true },
        });
    }

    clone() {
        const clonedTracks = this.getAllTracks().map(t => t.clone());
        return new AnimationPlan({
            id: this.id,
            fromFrame: this.fromFrame,
            toFrame: this.toFrame,
            direction: this.direction,
            duration: this.duration,
            tracks: clonedTracks,
            operations: [...this.operations],
            metadata: { ...this.metadata },
        });
    }

    equals(other) {
        if (!other || !(other instanceof AnimationPlan)) return false;
        if (
            this.id !== other.id ||
            this.fromFrame !== other.fromFrame ||
            this.toFrame !== other.toFrame ||
            this.direction !== other.direction ||
            this.duration !== other.duration
        ) {
            return false;
        }

        const tracksA = this.getAllTracks();
        const tracksB = other.getAllTracks();
        if (tracksA.length !== tracksB.length) return false;

        for (let i = 0; i < tracksA.length; i++) {
            if (!tracksA[i].equals(tracksB[i])) return false;
        }

        return true;
    }

    toJSON() {
        const tracksObj = {};
        for (const track of this.getAllTracks()) {
            tracksObj[track.id] = track.toJSON();
        }

        return {
            id: this.id,
            fromFrame: this.fromFrame,
            toFrame: this.toFrame,
            direction: this.direction,
            duration: this.duration,
            tracks: tracksObj,
            totalClips: this.totalClips,
            operations: this.operations,
            metadata: this.metadata,
        };
    }
}
