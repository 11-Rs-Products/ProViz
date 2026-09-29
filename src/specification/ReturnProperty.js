/**
 * ReturnProperty — Specification of return value properties under given conditions.
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class ReturnProperty extends Specification {
    /**
     * @param {object} params
     * @param {string} [params.condition='']
     * @param {string} [params.returnExpression='']
     * @param {any} [params.expectedValue]
     * @param {string} [params.returnType]
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.RETURN_PROPERTY,
        });
        this.condition = params.condition || '';
        this.returnExpression = params.returnExpression || '';
        this.expectedValue = params.expectedValue;
        this.returnType = params.returnType || 'any';
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            condition: this.condition,
            returnExpression: this.returnExpression,
            expectedValue: this.expectedValue,
            returnType: this.returnType,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ReturnProperty(json);
    }
}
