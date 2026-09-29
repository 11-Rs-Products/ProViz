/**
 * VerificationEdge — Semantic directed edge in VerificationGraph.
 */

export const VERIFICATION_EDGE_KINDS = Object.freeze({
    DEFINES: 'DEFINES',
    USES: 'USES',
    FLOWS_TO: 'FLOWS_TO',
    CONTROL_DEPENDS_ON: 'CONTROL_DEPENDS_ON',
    TYPE_DEPENDS_ON: 'TYPE_DEPENDS_ON',
    PROPERTY_DEPENDS_ON: 'PROPERTY_DEPENDS_ON',
    EVIDENCE_FOR: 'EVIDENCE_FOR',
    CAUSED_BY: 'CAUSED_BY',
    REACHES: 'REACHES',
    OBSERVED_AT: 'OBSERVED_AT',
    RELATED_TO: 'RELATED_TO',
});

export class VerificationEdge {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.from - Source node ID
     * @param {string} params.to - Target node ID
     * @param {string} params.kind - VERIFICATION_EDGE_KINDS member
     * @param {string} [params.label]
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        from,
        to,
        kind = VERIFICATION_EDGE_KINDS.RELATED_TO,
        label = '',
        metadata = {},
    }) {
        this.from = String(from);
        this.to = String(to);
        this.kind = kind;
        this.label = String(label);
        this.metadata = Object.freeze({ ...metadata });
        this.id = id || `vedge_${this.from}_${this.kind.toLowerCase()}_${this.to}`;
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            from: this.from,
            to: this.to,
            kind: this.kind,
            label: this.label,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new VerificationEdge(json);
    }
}
