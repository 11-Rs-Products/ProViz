/**
 * AdequacyResult — Comprehensive measurement of test suite adequacy across all criteria.
 */

import { SpecificationCoverage } from './SpecificationCoverage.js';
import { OracleCoverage } from './OracleCoverage.js';
import { BehavioralCoverage } from './BehavioralCoverage.js';

export class AdequacyResult {
    /**
     * @param {object} params
     * @param {SpecificationCoverage|object} [params.specificationCoverage]
     * @param {OracleCoverage|object} [params.oracleCoverage]
     * @param {BehavioralCoverage|object} [params.behavioralCoverage]
     * @param {number} [params.overallScore=1.0]
     * @param {object} [params.components={}]
     */
    constructor({
        specificationCoverage = new SpecificationCoverage(),
        oracleCoverage = new OracleCoverage(),
        behavioralCoverage = new BehavioralCoverage(),
        overallScore = 1.0,
        components = {},
    } = {}) {
        this.specificationCoverage = specificationCoverage instanceof SpecificationCoverage
            ? specificationCoverage
            : SpecificationCoverage.fromJSON(specificationCoverage);
        this.oracleCoverage = oracleCoverage instanceof OracleCoverage
            ? oracleCoverage
            : OracleCoverage.fromJSON(oracleCoverage);
        this.behavioralCoverage = behavioralCoverage instanceof BehavioralCoverage
            ? behavioralCoverage
            : BehavioralCoverage.fromJSON(behavioralCoverage);
        this.overallScore = Number(overallScore);
        this.components = Object.freeze({ ...components });
        Object.freeze(this);
    }

    toJSON() {
        return {
            specificationCoverage: this.specificationCoverage.toJSON(),
            oracleCoverage: this.oracleCoverage.toJSON(),
            behavioralCoverage: this.behavioralCoverage.toJSON(),
            overallScore: this.overallScore,
            components: this.components,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new AdequacyResult(json);
    }
}
