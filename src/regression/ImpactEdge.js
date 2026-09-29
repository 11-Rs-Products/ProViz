/**
 * ImpactEdge — Directed edge in the Universal Impact Graph.
 */

export const IMPACT_EDGE_KINDS = Object.freeze({
    DEFINES: 'DEFINES',
    USES: 'USES',
    CALLS: 'CALLS',
    CALLED_BY: 'CALLED_BY',
    DEPENDS_ON: 'DEPENDS_ON',
    DATA_DEPENDS_ON: 'DATA_DEPENDS_ON',
    CONTROL_DEPENDS_ON: 'CONTROL_DEPENDS_ON',
    ALIASES: 'ALIASES',
    MUTATES: 'MUTATES',
    RETURNS: 'RETURNS',
    IMPORTS: 'IMPORTS',
    EXPORTS: 'EXPORTS',
    AFFECTS: 'AFFECTS',
    COVERS: 'COVERS',
    OBSERVES: 'OBSERVES',
    TESTS: 'TESTS',
    DERIVES_FROM: 'DERIVES_FROM',
});

export class ImpactEdge {
    /**
     * @param {object} params
     * @param {string} params.fromId
     * @param {string} params.toId
     * @param {string} [params.kind=IMPACT_EDGE_KINDS.DEPENDS_ON]
     * @param {number} [params.weight=1.0]
     * @param {string|object} [params.evidence='']
     * @param {object} [params.metadata={}]
     */
    constructor({
        fromId,
        toId,
        kind = IMPACT_EDGE_KINDS.DEPENDS_ON,
        weight = 1.0,
        evidence = '',
        metadata = {},
    } = {}) {
        if (!fromId || !toId) throw new Error('ImpactEdge requires fromId and toId');
        this.fromId = String(fromId);
        this.toId = String(toId);
        this.kind = kind;
        this.weight = typeof weight === 'number' ? weight : 1.0;
        this.evidence = evidence;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    get id() {
        return `${this.fromId}->${this.kind}->${this.toId}`;
    }

    toJSON() {
        return {
            fromId: this.fromId,
            toId: this.toId,
            kind: this.kind,
            weight: this.weight,
            evidence: this.evidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ImpactEdge(json);
    }
}
