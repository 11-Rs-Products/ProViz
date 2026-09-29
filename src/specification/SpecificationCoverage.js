/**
 * SpecificationCoverage — Measures coverage over mined behavioral specifications.
 */

export class SpecificationCoverage {
    /**
     * @param {object} params
     * @param {number} [params.total=0]
     * @param {number} [params.exercised=0]
     * @param {number} [params.validated=0]
     * @param {number} [params.violated=0]
     * @param {number} [params.untested=0]
     * @param {number} [params.inconclusive=0]
     * @param {object} [params.details={}]
     */
    constructor({
        total = 0,
        exercised = 0,
        validated = 0,
        violated = 0,
        untested = 0,
        inconclusive = 0,
        details = {},
    } = {}) {
        this.total = Number(total);
        this.exercised = Number(exercised);
        this.validated = Number(validated);
        this.violated = Number(violated);
        this.untested = Number(untested);
        this.inconclusive = Number(inconclusive);
        this.details = Object.freeze({ ...details });
        this.coverageRatio = this.total > 0 ? (this.exercised / this.total) : 1.0;
        Object.freeze(this);
    }

    toJSON() {
        return {
            total: this.total,
            exercised: this.exercised,
            validated: this.validated,
            violated: this.violated,
            untested: this.untested,
            inconclusive: this.inconclusive,
            coverageRatio: this.coverageRatio,
            details: this.details,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SpecificationCoverage(json);
    }
}
