/**
 * MetamorphicCampaignResult — Summary outcome of a metamorphic test campaign.
 */

export class MetamorphicCampaignResult {
    /**
     * @param {object} params
     * @param {string} params.campaignId
     * @param {number} [params.totalEvaluations=0]
     * @param {number} [params.validations=0]
     * @param {number} [params.violations=0]
     * @param {Array<object>} [params.cases=[]]
     * @param {Array<object>} [params.findings=[]]
     */
    constructor({
        campaignId,
        totalEvaluations = 0,
        validations = 0,
        violations = 0,
        cases = [],
        findings = [],
    } = {}) {
        this.campaignId = String(campaignId || '');
        this.totalEvaluations = Number(totalEvaluations);
        this.validations = Number(validations);
        this.violations = Number(violations);
        this.cases = Object.freeze([...cases]);
        this.findings = Object.freeze([...findings]);
        this.isPassed = this.violations === 0 && this.validations > 0;
        Object.freeze(this);
    }

    toJSON() {
        return {
            campaignId: this.campaignId,
            totalEvaluations: this.totalEvaluations,
            validations: this.validations,
            violations: this.violations,
            isPassed: this.isPassed,
            cases: this.cases,
            findings: this.findings,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MetamorphicCampaignResult(json);
    }
}
