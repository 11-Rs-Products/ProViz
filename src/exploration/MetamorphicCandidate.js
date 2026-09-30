/**
 * MetamorphicCandidate — Represents a mined candidate metamorphic relation.
 */

import { MetamorphicRelation } from './MetamorphicRelation.js';

export class MetamorphicCandidate {
    /**
     * @param {object} params
     * @param {MetamorphicRelation} params.relation
     * @param {number} [params.validationCount=0]
     * @param {number} [params.violationCount=0]
     */
    constructor({
        relation,
        validationCount = 0,
        violationCount = 0,
    } = {}) {
        this.relation = relation instanceof MetamorphicRelation ? relation : MetamorphicRelation.fromJSON(relation);
        this.validationCount = Number(validationCount);
        this.violationCount = Number(violationCount);
        Object.freeze(this);
    }

    recordOutcome(passed) {
        return new MetamorphicCandidate({
            relation: this.relation,
            validationCount: this.validationCount + (passed ? 1 : 0),
            violationCount: this.violationCount + (passed ? 0 : 1),
        });
    }

    toJSON() {
        return {
            relation: this.relation.toJSON(),
            validationCount: this.validationCount,
            violationCount: this.violationCount,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MetamorphicCandidate({
            relation: MetamorphicRelation.fromJSON(json.relation),
            validationCount: json.validationCount,
            violationCount: json.violationCount,
        });
    }
}
