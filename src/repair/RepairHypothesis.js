/**
 * RepairHypothesis — Structured hypothesis for a proposed transformation.
 */

import { RootCause } from './RootCause.js';

export class RepairHypothesis {
    /**
     * @param {object} params
     * @param {string} [params.hypothesisId=null]
     * @param {string} params.strategy
     * @param {string} params.problem
     * @param {RootCause|object} params.rootCause
     * @param {object} [params.proposedTransformation={}]
     * @param {string} [params.expectedInvariant='']
     * @param {string} [params.expectedBehaviorChange='']
     * @param {Array<string>|string} [params.supportingEvidence=[]]
     */
    constructor({
        hypothesisId = null,
        strategy = 'GUARD',
        problem = '',
        rootCause = null,
        proposedTransformation = {},
        expectedInvariant = '',
        expectedBehaviorChange = '',
        supportingEvidence = [],
    } = {}) {
        this.strategy = String(strategy);
        this.problem = String(problem || '');
        this.rootCause = rootCause instanceof RootCause ? rootCause : new RootCause(rootCause || {});
        this.proposedTransformation = Object.freeze({ ...proposedTransformation });
        this.expectedInvariant = String(expectedInvariant || '');
        this.expectedBehaviorChange = String(expectedBehaviorChange || '');
        this.supportingEvidence = Object.freeze(
            Array.isArray(supportingEvidence) ? [...supportingEvidence] : [String(supportingEvidence)]
        );

        const hash = RepairHypothesis.computeHash(JSON.stringify({
            strat: this.strategy,
            prob: this.problem,
            rc: this.rootCause.location,
            inv: this.expectedInvariant,
        }));
        this.hypothesisId = hypothesisId || `hyp_${hash}`;
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

    toJSON() {
        return {
            hypothesisId: this.hypothesisId,
            strategy: this.strategy,
            problem: this.problem,
            rootCause: this.rootCause.toJSON(),
            proposedTransformation: this.proposedTransformation,
            expectedInvariant: this.expectedInvariant,
            expectedBehaviorChange: this.expectedBehaviorChange,
            supportingEvidence: this.supportingEvidence,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RepairHypothesis({
            ...json,
            rootCause: RootCause.fromJSON(json.rootCause),
        });
    }
}
