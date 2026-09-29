/**
 * Postcondition — Specification constraining output state or return values after execution.
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class Postcondition extends Specification {
    /**
     * @param {object} params
     * @param {string} [params.expression]
     * @param {any} [params.expectedReturn]
     * @param {string} [params.relation]
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.POSTCONDITION,
        });
        this.expression = params.expression || '';
        this.expectedReturn = params.expectedReturn;
        this.relation = params.relation || '==';
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            expression: this.expression,
            expectedReturn: this.expectedReturn,
            relation: this.relation,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Postcondition(json);
    }
}
