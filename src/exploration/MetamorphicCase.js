/**
 * MetamorphicCase — Represents an instance of a seed input, transformed input, relation, and evaluation outcome.
 */

import { MetamorphicRelation } from './MetamorphicRelation.js';

export class MetamorphicCase {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {MetamorphicRelation} params.relation
     * @param {any} params.seedInput
     * @param {any} params.transformedInput
     * @param {any} [params.baselineOutput]
     * @param {any} [params.transformedOutput]
     * @param {boolean} [params.passed=false]
     * @param {string} [params.reason='']
     */
    constructor({
        id = null,
        relation,
        seedInput,
        transformedInput,
        baselineOutput = undefined,
        transformedOutput = undefined,
        passed = false,
        reason = '',
    } = {}) {
        this.relation = relation instanceof MetamorphicRelation ? relation : MetamorphicRelation.fromJSON(relation);
        this.seedInput = seedInput;
        this.transformedInput = transformedInput;
        this.baselineOutput = baselineOutput;
        this.transformedOutput = transformedOutput;
        this.passed = Boolean(passed);
        this.reason = String(reason || '');

        const hashPayload = JSON.stringify({
            relationId: this.relation?.id,
            seed: this.seedInput,
            transformed: this.transformedInput,
        });
        this.id = id || `meta_case_${MetamorphicCase.computeHash(hashPayload)}`;
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
            id: this.id,
            relation: this.relation ? this.relation.toJSON() : null,
            seedInput: this.seedInput,
            transformedInput: this.transformedInput,
            baselineOutput: this.baselineOutput,
            transformedOutput: this.transformedOutput,
            passed: this.passed,
            reason: this.reason,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MetamorphicCase(json);
    }
}
