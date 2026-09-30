/**
 * SpecificationGapTarget / SpecificationFeedback / SpecificationExplorer — Integration with Stage 22 specifications and gaps.
 */

export class SpecificationGapTarget {
    /**
     * @param {object} params
     * @param {string} params.gapId
     * @param {string} params.kind
     * @param {string} params.functionId
     * @param {object} [params.targetCondition]
     * @param {object} [params.suggestedInputs={}]
     */
    constructor({
        gapId,
        kind,
        functionId,
        targetCondition = '',
        suggestedInputs = {},
    } = {}) {
        this.gapId = String(gapId || '');
        this.kind = String(kind);
        this.functionId = String(functionId || '');
        this.targetCondition = String(targetCondition);
        this.suggestedInputs = Object.freeze({ ...suggestedInputs });
        Object.freeze(this);
    }
}

export class SpecificationFeedback {
    /**
     * @param {object} params
     * @param {Array<string>} [params.closedGaps=[]]
     * @param {Array<string>} [params.validatedSpecs=[]]
     * @param {Array<string>} [params.violatedSpecs=[]]
     */
    constructor({
        closedGaps = [],
        validatedSpecs = [],
        violatedSpecs = [],
    } = {}) {
        this.closedGaps = Object.freeze([...closedGaps]);
        this.validatedSpecs = Object.freeze([...validatedSpecs]);
        this.violatedSpecs = Object.freeze([...violatedSpecs]);
        Object.freeze(this);
    }
}

export class SpecificationExplorer {
    /**
     * Converts Stage 22 gaps into exploration targets.
     * @param {Array<object>} gaps
     * @returns {Array<SpecificationGapTarget>}
     */
    static extractTargets(gaps = []) {
        return gaps.map(g => new SpecificationGapTarget({
            gapId: g.id,
            kind: g.kind,
            functionId: g.functionId,
            targetCondition: g.suggestedObjective?.targetCondition || '',
            suggestedInputs: g.suggestedInputs || g.suggestedObjective?.suggestedInputs || {},
        }));
    }
}
