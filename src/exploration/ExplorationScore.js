/**
 * ExplorationScore — Composite multi-factor score and explainable component breakdown.
 */

export class ExplorationScore {
    /**
     * @param {object} params
     * @param {number} [params.total=0.0]
     * @param {number} [params.novelty=0.0]
     * @param {number} [params.coverageGain=0.0]
     * @param {number} [params.gapReduction=0.0]
     * @param {number} [params.mutationDiscrimination=0.0]
     * @param {number} [params.regressionRelevance=0.0]
     * @param {number} [params.boundaryRelevance=0.0]
     * @param {number} [params.generationCost=0.0]
     * @param {Array<string>} [params.reasons=[]]
     */
    constructor({
        total = 0.0,
        novelty = 0.0,
        coverageGain = 0.0,
        gapReduction = 0.0,
        mutationDiscrimination = 0.0,
        regressionRelevance = 0.0,
        boundaryRelevance = 0.0,
        generationCost = 0.0,
        reasons = [],
    } = {}) {
        this.total = Math.max(0.0, Number(total));
        this.novelty = Number(novelty);
        this.coverageGain = Number(coverageGain);
        this.gapReduction = Number(gapReduction);
        this.mutationDiscrimination = Number(mutationDiscrimination);
        this.regressionRelevance = Number(regressionRelevance);
        this.boundaryRelevance = Number(boundaryRelevance);
        this.generationCost = Number(generationCost);
        this.reasons = Object.freeze([...reasons]);
        Object.freeze(this);
    }

    static compute(factors = {}) {
        const novelty = factors.novelty || 0;
        const coverage = factors.coverageGain || 0;
        const gap = factors.gapReduction || 0;
        const mut = factors.mutationDiscrimination || 0;
        const regr = factors.regressionRelevance || 0;
        const bound = factors.boundaryRelevance || 0;
        const cost = factors.generationCost || 0;

        const reasons = [];
        if (novelty > 0.5) reasons.push('+ high behavioral novelty target');
        if (coverage > 0) reasons.push('+ new branch/path coverage target');
        if (gap > 0) reasons.push('+ specification gap closure');
        if (mut > 0) reasons.push('+ surviving mutant discrimination');
        if (regr > 0) reasons.push('+ changed region relevance');
        if (bound > 0) reasons.push('+ semantic boundary exploration');

        const total = (novelty * 0.3) + (coverage * 0.25) + (gap * 0.2) +
            (mut * 0.15) + (regr * 0.1) + (bound * 0.1) - (cost * 0.05);

        return new ExplorationScore({
            total: Math.round(Math.max(0.01, total) * 100) / 100,
            novelty,
            coverageGain: coverage,
            gapReduction: gap,
            mutationDiscrimination: mut,
            regressionRelevance: regr,
            boundaryRelevance: bound,
            generationCost: cost,
            reasons,
        });
    }

    toJSON() {
        return {
            total: this.total,
            novelty: this.novelty,
            coverageGain: this.coverageGain,
            gapReduction: this.gapReduction,
            mutationDiscrimination: this.mutationDiscrimination,
            regressionRelevance: this.regressionRelevance,
            boundaryRelevance: this.boundaryRelevance,
            generationCost: this.generationCost,
            reasons: this.reasons,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationScore(json);
    }
}
