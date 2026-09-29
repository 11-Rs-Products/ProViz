/**
 * BehavioralCoverage — Measures coverage over distinct behavioral regions (normal, boundary, exception, etc.).
 */

export class BehavioralCoverage {
    /**
     * @param {object} params
     * @param {number} [params.totalRegions=0]
     * @param {number} [params.coveredRegions=0]
     * @param {Array<string>} [params.regions=[]]
     * @param {object} [params.details={}]
     */
    constructor({
        totalRegions = 0,
        coveredRegions = 0,
        regions = [],
        details = {},
    } = {}) {
        this.totalRegions = Number(totalRegions);
        this.coveredRegions = Number(coveredRegions);
        this.regions = Object.freeze([...regions]);
        this.details = Object.freeze({ ...details });
        this.coverageRatio = this.totalRegions > 0 ? (this.coveredRegions / this.totalRegions) : 1.0;
        Object.freeze(this);
    }

    toJSON() {
        return {
            totalRegions: this.totalRegions,
            coveredRegions: this.coveredRegions,
            regions: this.regions,
            coverageRatio: this.coverageRatio,
            details: this.details,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BehavioralCoverage(json);
    }
}
