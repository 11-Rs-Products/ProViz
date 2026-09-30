/**
 * MetamorphicEvidence — Structured evidence supporting or challenging a MetamorphicRelation.
 */

export class MetamorphicEvidence {
    /**
     * @param {object} params
     * @param {string} params.relationId
     * @param {any} params.seedInput
     * @param {any} params.transformedInput
     * @param {boolean} params.holds
     * @param {string} [params.explanation='']
     */
    constructor({
        relationId,
        seedInput,
        transformedInput,
        holds,
        explanation = '',
    } = {}) {
        this.relationId = String(relationId || '');
        this.seedInput = seedInput;
        this.transformedInput = transformedInput;
        this.holds = Boolean(holds);
        this.explanation = String(explanation || '');
        Object.freeze(this);
    }

    toJSON() {
        return {
            relationId: this.relationId,
            seedInput: this.seedInput,
            transformedInput: this.transformedInput,
            holds: this.holds,
            explanation: this.explanation,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MetamorphicEvidence(json);
    }
}
