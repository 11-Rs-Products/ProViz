/**
 * ExplorationPolicy — Configuration and weights governing candidate selection and exploration decisions.
 */

export class ExplorationPolicy {
    /**
     * @param {object} params
     * @param {string} [params.strategy='HYBRID']
     * @param {number} [params.noveltyWeight=0.3]
     * @param {number} [params.coverageWeight=0.25]
     * @param {number} [params.gapWeight=0.2]
     * @param {number} [params.mutationWeight=0.15]
     * @param {number} [params.regressionWeight=0.1]
     */
    constructor({
        strategy = 'HYBRID',
        noveltyWeight = 0.3,
        coverageWeight = 0.25,
        gapWeight = 0.2,
        mutationWeight = 0.15,
        regressionWeight = 0.1,
    } = {}) {
        this.strategy = String(strategy);
        this.noveltyWeight = Number(noveltyWeight);
        this.coverageWeight = Number(coverageWeight);
        this.gapWeight = Number(gapWeight);
        this.mutationWeight = Number(mutationWeight);
        this.regressionWeight = Number(regressionWeight);
        Object.freeze(this);
    }
}
