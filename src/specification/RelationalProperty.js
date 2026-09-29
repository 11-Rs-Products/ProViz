/**
 * RelationalProperty — Specification of algebraic or order relations between variables (e.g. x < y, result == a / b).
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class RelationalProperty extends Specification {
    /**
     * @param {object} params
     * @param {string} params.leftExpression
     * @param {string} params.operator - '==', '!=', '<', '<=', '>', '>='
     * @param {string} params.rightExpression
     * @param {string} [params.condition='']
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.RELATIONAL_PROPERTY,
        });
        this.leftExpression = params.leftExpression || '';
        this.operator = params.operator || '==';
        this.rightExpression = params.rightExpression || '';
        this.condition = params.condition || '';
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            leftExpression: this.leftExpression,
            operator: this.operator,
            rightExpression: this.rightExpression,
            condition: this.condition,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RelationalProperty(json);
    }
}
