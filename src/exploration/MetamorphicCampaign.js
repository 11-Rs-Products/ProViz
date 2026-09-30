/**
 * MetamorphicCampaign — Orchestrates metamorphic execution over seed inputs.
 */

import { MetamorphicGenerator } from './MetamorphicGenerator.js';
import { MetamorphicEvaluator } from './MetamorphicEvaluator.js';
import { MetamorphicCampaignResult } from './MetamorphicCampaignResult.js';

export class MetamorphicCampaign {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {MetamorphicRelation} params.relation
     * @param {Array<any>} [params.seeds=[]]
     */
    constructor({
        id = null,
        relation,
        seeds = [],
    } = {}) {
        this.relation = relation;
        this.seeds = Object.freeze([...seeds]);
        this.id = id || `meta_camp_${MetamorphicCampaign.computeHash(relation?.id || '')}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Executes the campaign using the provided executor.
     * @param {Function} executor
     * @returns {MetamorphicCampaignResult}
     */
    run(executor) {
        let validations = 0;
        let violations = 0;
        const cases = [];
        const findings = [];

        for (const seed of this.seeds) {
            const transformed = MetamorphicGenerator.transform(this.relation, seed);
            const mCase = MetamorphicEvaluator.evaluate(this.relation, seed, transformed, executor);
            cases.push(mCase);

            if (mCase.passed) {
                validations++;
            } else {
                violations++;
                findings.push({
                    kind: 'METAMORPHIC_VIOLATION',
                    relationId: this.relation.id,
                    seedInput: seed,
                    transformedInput: transformed,
                    reason: mCase.reason,
                });
            }
        }

        return new MetamorphicCampaignResult({
            campaignId: this.id,
            totalEvaluations: this.seeds.length,
            validations,
            violations,
            cases,
            findings,
        });
    }
}
