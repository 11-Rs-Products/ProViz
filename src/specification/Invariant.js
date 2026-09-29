/**
 * Invariant — Specification asserting a state property that holds continuously across execution points.
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class Invariant extends Specification {
    /**
     * @param {object} params
     * @param {string} [params.expression]
     * @param {string} [params.scope='GLOBAL']
     * @param {Array<string>} [params.variables=[]]
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.INVARIANT,
        });
        this.expression = params.expression || '';
        this.scope = params.scope || 'GLOBAL';
        this.variables = Object.freeze([...(params.variables || [])]);
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            expression: this.expression,
            scope: this.scope,
            variables: this.variables,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Invariant(json);
    }
}
