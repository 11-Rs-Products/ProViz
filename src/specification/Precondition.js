/**
 * Precondition — Specification constraining input state or arguments before execution.
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class Precondition extends Specification {
    /**
     * @param {object} params
     * @param {string} [params.expression]
     * @param {Array<string>} [params.variables=[]]
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.PRECONDITION,
        });
        this.expression = params.expression || '';
        this.variables = Object.freeze([...(params.variables || [])]);
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            expression: this.expression,
            variables: this.variables,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Precondition(json);
    }
}
