/**
 * TypeExplanation — Serializable structured explanation for type inferences and type changes.
 */

export class TypeExplanation {
    /**
     * @param {object} params
     * @param {string} params.target - Variable or expression
     * @param {string} params.inferredType - Type string
     * @param {Array<object>} [params.evidence=[]]
     * @param {Array<object>} [params.constraints=[]]
     * @param {Array<object>} [params.provenance=[]]
     * @param {string} [params.confidence='STATIC_INFERENCE']
     * @param {string} [params.summary='']
     */
    constructor({
        target,
        inferredType,
        evidence = [],
        constraints = [],
        provenance = [],
        confidence = 'STATIC_INFERENCE',
        summary = '',
    }) {
        this.target = target;
        this.inferredType = inferredType;
        this.evidence = Array.isArray(evidence) ? evidence : [];
        this.constraints = Array.isArray(constraints) ? constraints : [];
        this.provenance = Array.isArray(provenance) ? provenance : [];
        this.confidence = confidence;
        this.summary = summary || `Inferred type '${inferredType}' for '${target}' with ${confidence}.`;
    }

    toJSON() {
        return {
            target: this.target,
            inferredType: this.inferredType,
            evidence: this.evidence,
            constraints: this.constraints,
            provenance: this.provenance,
            confidence: this.confidence,
            summary: this.summary,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TypeExplanation(json);
    }
}
