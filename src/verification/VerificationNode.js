/**
 * VerificationNode — Semantic node in VerificationGraph.
 */

export const VERIFICATION_NODE_KINDS = Object.freeze({
    FINDING: 'FINDING',
    PROPERTY: 'PROPERTY',
    CFG_NODE: 'CFG_NODE',
    SSA_VALUE: 'SSA_VALUE',
    DATAFLOW_NODE: 'DATAFLOW_NODE',
    TYPEFLOW_NODE: 'TYPEFLOW_NODE',
    SOURCE_LOCATION: 'SOURCE_LOCATION',
    RUNTIME_FRAME: 'RUNTIME_FRAME',
    OBJECT_IDENTITY: 'OBJECT_IDENTITY',
});

export class VerificationNode {
    /**
     * @param {object} params
     * @param {string} params.id
     * @param {string} params.kind - VERIFICATION_NODE_KINDS member
     * @param {string} [params.label]
     * @param {object} [params.payload]
     * @param {object} [params.metadata]
     */
    constructor({
        id,
        kind = VERIFICATION_NODE_KINDS.FINDING,
        label = '',
        payload = null,
        metadata = {},
    }) {
        this.id = String(id);
        this.kind = kind;
        this.label = String(label || id);
        this.payload = payload ? Object.freeze({ ...payload }) : null;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            label: this.label,
            payload: this.payload,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new VerificationNode(json);
    }
}
