/**
 * AnimationState — Immutable snapshot of evaluated animation channels at time t.
 *
 * Provides downstream renderers with pure visual state without coupling to Three.js or GSAP.
 */

export const ANIMATION_STATUS = Object.freeze({
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
});

export class AnimationState {
    /**
     * @param {object} params
     * @param {string} [params.planId=''] - Originating AnimationPlan ID
     * @param {number} [params.time=0] - Current evaluated time in seconds
     * @param {number} [params.duration=0] - Total plan duration in seconds
     * @param {string} [params.direction='forward'] - 'forward' | 'reverse'
     * @param {number} [params.progress=0] - Normalized progress [0, 1]
     * @param {string} [params.status=ANIMATION_STATUS.IDLE] - Status enum
     * @param {Record<string, object>} [params.nodeStates={}] - Node property states keyed by nodeId
     * @param {Record<string, object>} [params.relationshipStates={}] - Relationship states keyed by relId
     * @param {string[]} [params.activeClips=[]] - Currently executing clip IDs
     * @param {object} [params.metadata={}]
     */
    constructor({
        planId = '',
        time = 0,
        duration = 0,
        direction = 'forward',
        progress = 0,
        status = ANIMATION_STATUS.IDLE,
        nodeStates = {},
        relationshipStates = {},
        activeClips = [],
        metadata = {},
    } = {}) {
        this.planId = planId;
        this.time = Math.max(0, time);
        this.duration = Math.max(0, duration);
        this.direction = direction;
        this.progress = Math.max(0, Math.min(1, progress));
        this.status = status;
        this.nodeStates = { ...nodeStates };
        this.relationshipStates = { ...relationshipStates };
        this.activeClips = Array.isArray(activeClips) ? [...activeClips] : [];
        this.metadata = { ...metadata };
    }

    get isComplete() {
        return this.status === ANIMATION_STATUS.COMPLETED || this.progress >= 1;
    }

    /**
     * Get evaluated state for a specific SceneNode.
     * @param {string} nodeId
     * @returns {object|null}
     */
    getNodeState(nodeId) {
        return this.nodeStates[nodeId] || null;
    }

    /**
     * Get evaluated state for a specific SceneRelationship.
     * @param {string} relId
     * @returns {object|null}
     */
    getRelationshipState(relId) {
        return this.relationshipStates[relId] || null;
    }

    toJSON() {
        return {
            planId: this.planId,
            time: this.time,
            duration: this.duration,
            direction: this.direction,
            progress: this.progress,
            status: this.status,
            nodeStates: this.nodeStates,
            relationshipStates: this.relationshipStates,
            activeClips: this.activeClips,
            completed: this.isComplete,
            metadata: this.metadata,
        };
    }
}
