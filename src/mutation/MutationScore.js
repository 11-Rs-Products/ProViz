/**
 * MutationScore — Metrics and adequacy ratios computed across a mutation campaign.
 */

export class MutationScore {
    /**
     * @param {object} params
     * @param {number} [params.totalMutants=0]
     * @param {number} [params.killed=0]
     * @param {number} [params.survived=0]
     * @param {number} [params.equivalent=0]
     * @param {number} [params.unknown=0]
     * @param {number} [params.unsupported=0]
     * @param {number} [params.timeout=0]
     */
    constructor({
        totalMutants = 0,
        killed = 0,
        survived = 0,
        equivalent = 0,
        unknown = 0,
        unsupported = 0,
        timeout = 0,
    } = {}) {
        this.totalMutants = Number(totalMutants) || 0;
        this.killed = Number(killed) || 0;
        this.survived = Number(survived) || 0;
        this.equivalent = Number(equivalent) || 0;
        this.unknown = Number(unknown) || 0;
        this.unsupported = Number(unsupported) || 0;
        this.timeout = Number(timeout) || 0;

        const nonEquivalent = Math.max(0, this.totalMutants - this.equivalent);
        this.rawMutationRatio = this.totalMutants > 0 ? this.killed / this.totalMutants : 1.0;
        this.effectiveMutationRatio = nonEquivalent > 0 ? this.killed / nonEquivalent : 1.0;

        Object.freeze(this);
    }

    /**
     * Compute score from array of classified mutation results.
     * @param {Array<object>} results
     * @returns {MutationScore}
     */
    static compute(results = []) {
        let killed = 0;
        let survived = 0;
        let equivalent = 0;
        let unknown = 0;
        let unsupported = 0;
        let timeout = 0;

        for (const r of results) {
            const status = String(r.status || r.classification || '').toUpperCase();
            if (status === 'KILLED') killed++;
            else if (status === 'SURVIVED') survived++;
            else if (status === 'EQUIVALENT') equivalent++;
            else if (status === 'TIMEOUT') timeout++;
            else if (status === 'UNSUPPORTED') unsupported++;
            else unknown++;
        }

        return new MutationScore({
            totalMutants: results.length,
            killed,
            survived,
            equivalent,
            unknown,
            unsupported,
            timeout,
        });
    }

    toJSON() {
        return {
            totalMutants: this.totalMutants,
            killed: this.killed,
            survived: this.survived,
            equivalent: this.equivalent,
            unknown: this.unknown,
            unsupported: this.unsupported,
            timeout: this.timeout,
            rawMutationRatio: this.rawMutationRatio,
            effectiveMutationRatio: this.effectiveMutationRatio,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MutationScore(json);
    }
}
