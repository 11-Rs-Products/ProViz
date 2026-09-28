/**
 * ControlFlowEdge — Directed semantic edge between ControlFlowNodes in a CFG.
 */

export const CFG_EDGE_TYPES = Object.freeze({
    NORMAL: 'NORMAL',
    TRUE_BRANCH: 'TRUE_BRANCH',
    FALSE_BRANCH: 'FALSE_BRANCH',
    LOOP_BACK: 'LOOP_BACK',
    LOOP_EXIT: 'LOOP_EXIT',
    EXCEPTION: 'EXCEPTION',
    RETURN: 'RETURN',
    CALL: 'CALL',
    CALL_RETURN: 'CALL_RETURN',
    YIELD: 'YIELD',
    RESUME: 'RESUME',
    FALLTHROUGH: 'FALLTHROUGH',
});

export class ControlFlowEdge {
    /**
     * @param {object} params
     * @param {string} [params.id] - Deterministic edge ID
     * @param {string} params.type - One of CFG_EDGE_TYPES
     * @param {string} params.fromId - Source node ID
     * @param {string} params.toId - Target node ID
     * @param {string|null} [params.condition] - Condition expression if conditional branch
     * @param {object|null} [params.sourceLocation] - Location descriptor
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        type = CFG_EDGE_TYPES.NORMAL,
        fromId,
        toId,
        condition = null,
        sourceLocation = null,
        metadata = {},
    }) {
        if (!fromId || !toId) {
            throw new Error(`ControlFlowEdge requires fromId and toId: from=${fromId}, to=${toId}`);
        }
        this.type = type;
        this.fromId = fromId;
        this.toId = toId;
        this.condition = condition;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.metadata = { ...metadata };
        this.id = id || `cfg_edge_${fromId}_${type}_${toId}`;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            fromId: this.fromId,
            toId: this.toId,
            condition: this.condition,
            sourceLocation: this.sourceLocation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new ControlFlowEdge(json);
    }
}
