/**
 * DataflowEdge — Explicit semantic relationship between two DataflowNodes.
 */

export const DATAFLOW_EDGE_TYPES = Object.freeze({
    DEFINES: 'DEFINES',
    USES: 'USES',
    DEPENDS_ON: 'DEPENDS_ON',
    ASSIGNS: 'ASSIGNS',
    PASSES_ARGUMENT: 'PASSES_ARGUMENT',
    RECEIVES_PARAMETER: 'RECEIVES_PARAMETER',
    RETURNS: 'RETURNS',
    RECEIVES_RETURN: 'RECEIVES_RETURN',
    MUTATES: 'MUTATES',
    READS: 'READS',
    WRITES: 'WRITES',
    ALIASES: 'ALIASES',
    CONTAINS: 'CONTAINS',
    ELEMENT_OF: 'ELEMENT_OF',
    FIELD_OF: 'FIELD_OF',
    CALLS: 'CALLS',
    CALLED_BY: 'CALLED_BY',
    CONTROL_DEPENDS_ON: 'CONTROL_DEPENDS_ON',
    DATA_DEPENDS_ON: 'DATA_DEPENDS_ON',
});

export class DataflowEdge {
    /**
     * @param {object} params
     * @param {string} [params.id] - Optional deterministic edge ID (generated if omitted)
     * @param {string} params.type - One of DATAFLOW_EDGE_TYPES
     * @param {string} params.fromId - Producer / Source Node ID
     * @param {string} params.toId - Consumer / Target Node ID
     * @param {object} [params.sourceLocation] - Source location metadata
     * @param {number} [params.frameIndex] - Timeline frame index
     * @param {object} [params.metadata] - Optional edge metadata
     */
    constructor({
        id = null,
        type = DATAFLOW_EDGE_TYPES.DATA_DEPENDS_ON,
        fromId,
        toId,
        sourceLocation = null,
        frameIndex = null,
        metadata = {},
    }) {
        if (!fromId || !toId) {
            throw new Error(`DataflowEdge requires valid fromId and toId: from=${fromId}, to=${toId}`);
        }
        this.type = type;
        this.fromId = fromId;
        this.toId = toId;
        this.frameIndex = typeof frameIndex === 'number' ? frameIndex : null;
        this.id = id || DataflowEdge.generateId(fromId, type, toId, this.frameIndex);
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.metadata = { ...metadata };
    }

    static generateId(fromId, type, toId, frameIndex = null) {
        const framePart = frameIndex !== null ? `_f${frameIndex}` : '';
        return `df_edge_${fromId}_${type}_${toId}${framePart}`;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            fromId: this.fromId,
            toId: this.toId,
            sourceLocation: this.sourceLocation,
            frameIndex: this.frameIndex,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new DataflowEdge(json);
    }
}
