/**
 * ExplorationNode — Vertex in the concolic exploration graph.
 */

export const EXPLORATION_NODE_KINDS = Object.freeze({
    ROOT: 'ROOT',
    PATH: 'PATH',
    BRANCH: 'BRANCH',
    TERMINAL: 'TERMINAL',
    EXCEPTION: 'EXCEPTION',
    UNREACHABLE: 'UNREACHABLE',
    UNKNOWN: 'UNKNOWN',
});

export class ExplorationNode {
    /**
     * @param {object} params
     * @param {string} params.id
     * @param {string} [params.kind=EXPLORATION_NODE_KINDS.PATH]
     * @param {string|null} [params.pathId=null]
     * @param {string|null} [params.branchId=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id,
        kind = EXPLORATION_NODE_KINDS.PATH,
        pathId = null,
        branchId = null,
        metadata = {},
    } = {}) {
        this.id = String(id || '');
        this.kind = kind;
        this.pathId = pathId;
        this.branchId = branchId;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            pathId: this.pathId,
            branchId: this.branchId,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationNode(json);
    }
}
