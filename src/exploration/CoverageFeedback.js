/**
 * CoverageFeedback — Feedback model tracking newly discovered coverage and structural novelty.
 */

export class CoverageFeedback {
    /**
     * @param {object} params
     * @param {Array<string|number>} [params.newBranches=[]]
     * @param {Array<string>} [params.newPaths=[]]
     * @param {Array<string>} [params.newStates=[]]
     * @param {number} [params.coverageGain=0.0]
     */
    constructor({
        newBranches = [],
        newPaths = [],
        newStates = [],
        coverageGain = 0.0,
    } = {}) {
        this.newBranches = Object.freeze([...newBranches]);
        this.newPaths = Object.freeze([...newPaths]);
        this.newStates = Object.freeze([...newStates]);
        this.coverageGain = Number(coverageGain);
        this.hasNewCoverage = this.newBranches.length > 0 || this.newPaths.length > 0 || this.newStates.length > 0;
        Object.freeze(this);
    }

    toJSON() {
        return {
            newBranches: this.newBranches,
            newPaths: this.newPaths,
            newStates: this.newStates,
            coverageGain: this.coverageGain,
            hasNewCoverage: this.hasNewCoverage,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new CoverageFeedback(json);
    }
}
