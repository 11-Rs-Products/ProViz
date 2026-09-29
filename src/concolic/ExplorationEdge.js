/**
 * ExplorationEdge — Directed edge connecting exploration steps.
 */

export const EXPLORATION_EDGE_KINDS = Object.freeze({
    EXECUTED: 'EXECUTED',
    UNEXPLORED: 'UNEXPLORED',
    NEGATED: 'NEGATED',
    UNSAT: 'UNSAT',
    UNKNOWN: 'UNKNOWN',
    DIVERGED: 'DIVERGED',
    REPRODUCED: 'REPRODUCED',
});

export class ExplorationEdge {
    /**
     * @param {object} params
     * @param {string} params.fromId
     * @param {string} params.toId
     * @param {string} [params.kind=EXPLORATION_EDGE_KINDS.EXECUTED]
     * @param {object} [params.metadata={}]
     */
    constructor({
        fromId,
        toId,
        kind = EXPLORATION_EDGE_KINDS.EXECUTED,
        metadata = {},
    } = {}) {
        this.fromId = String(fromId);
        this.toId = String(toId);
        this.kind = kind;
        this.metadata = Object.freeze({ ...metadata });
        this.id = `edge_${this.fromId}_${this.kind}_${this.toId}`;
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            fromId: this.fromId,
            toId: this.toId,
            kind: this.kind,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationEdge(json);
    }
}
