/**
 * TypeFlowEdge — Explicit semantic transition edge in the Type/Value Flow Graph.
 */

export const TYPEFLOW_EDGE_TYPES = Object.freeze({
    TYPE_FLOWS_TO: 'TYPE_FLOWS_TO',
    VALUE_FLOWS_TO: 'VALUE_FLOWS_TO',
    CONSTRAINTS: 'CONSTRAINTS',
    NARROWS_TO: 'NARROWS_TO',
    WIDENS_TO: 'WIDENS_TO',
    ARGUMENT_TO_PARAMETER: 'ARGUMENT_TO_PARAMETER',
    RETURN_TO_CALLER: 'RETURN_TO_CALLER',
    FIELD_TO_USE: 'FIELD_TO_USE',
    ELEMENT_TO_USE: 'ELEMENT_TO_USE',
});

export class TypeFlowEdge {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.type=TYPEFLOW_EDGE_TYPES.TYPE_FLOWS_TO]
     * @param {string} params.fromId
     * @param {string} params.toId
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        type = TYPEFLOW_EDGE_TYPES.TYPE_FLOWS_TO,
        fromId,
        toId,
        metadata = {},
    }) {
        this.fromId = fromId;
        this.toId = toId;
        this.type = type;
        this.id = id || `tfe_${fromId}__${type}__${toId}`;
        this.metadata = Object.freeze({ ...metadata });
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            fromId: this.fromId,
            toId: this.toId,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TypeFlowEdge(json);
    }
}
