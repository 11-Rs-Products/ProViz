/**
 * MutationProperty — Specification of side effects or object mutations.
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class MutationProperty extends Specification {
    /**
     * @param {object} params
     * @param {string} params.targetObject
     * @param {string} params.mutationType - APPEND, SET_FIELD, DELETE, REBIND, CLEAR
     * @param {string} [params.condition='']
     * @param {object} [params.mutationDelta={}]
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.MUTATION_PROPERTY,
        });
        this.targetObject = params.targetObject || '';
        this.mutationType = params.mutationType || 'GENERIC';
        this.condition = params.condition || '';
        this.mutationDelta = Object.freeze({ ...(params.mutationDelta || {}) });
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            targetObject: this.targetObject,
            mutationType: this.mutationType,
            condition: this.condition,
            mutationDelta: this.mutationDelta,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MutationProperty(json);
    }
}
