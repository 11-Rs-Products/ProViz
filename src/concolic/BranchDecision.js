/**
 * BranchDecision — Enumeration and records of branch choices.
 */

export const BRANCH_DECISIONS = Object.freeze({
    TRUE: 'TRUE',
    FALSE: 'FALSE',
    UNKNOWN: 'UNKNOWN',
    EXCEPTION: 'EXCEPTION',
});

export class BranchDecision {
    /**
     * @param {object} params
     * @param {string} params.decision - One of BRANCH_DECISIONS
     * @param {string|null} [params.cfgEdgeId=null]
     * @param {string|null} [params.fromNodeId=null]
     * @param {string|null} [params.toNodeId=null]
     */
    constructor({
        decision = BRANCH_DECISIONS.TRUE,
        cfgEdgeId = null,
        fromNodeId = null,
        toNodeId = null,
    } = {}) {
        this.decision = decision;
        this.cfgEdgeId = cfgEdgeId;
        this.fromNodeId = fromNodeId;
        this.toNodeId = toNodeId;
        Object.freeze(this);
    }

    toJSON() {
        return {
            decision: this.decision,
            cfgEdgeId: this.cfgEdgeId,
            fromNodeId: this.fromNodeId,
            toNodeId: this.toNodeId,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BranchDecision(json);
    }
}
