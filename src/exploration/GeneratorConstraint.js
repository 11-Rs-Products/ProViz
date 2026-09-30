/**
 * GeneratorConstraint — Immutable constraint model for generators.
 */

export class GeneratorConstraint {
    /**
     * @param {object} params
     * @param {string} [params.expression='']
     * @param {string} [params.variable='']
     * @param {string} [params.operator='==']
     * @param {any} [params.targetValue]
     * @param {boolean} [params.isExclusion=false]
     */
    constructor({
        expression = '',
        variable = '',
        operator = '==',
        targetValue = undefined,
        isExclusion = false,
    } = {}) {
        this.expression = String(expression || '');
        this.variable = String(variable || '');
        this.operator = String(operator || '==');
        this.targetValue = targetValue;
        this.isExclusion = Boolean(isExclusion);
        this.predicate = typeof arguments[0]?.predicate === 'function' ? arguments[0].predicate : null;
        Object.freeze(this);
    }

    satisfies(val) {
        if (typeof this.predicate === 'function') {
            return this.predicate(val);
        }
        if (this.isExclusion) {
            return val !== this.targetValue;
        }
        if (this.operator === '!=') return val !== this.targetValue;
        if (this.operator === '==') return val === this.targetValue;
        if (this.operator === '>') return val > this.targetValue;
        if (this.operator === '>=') return val >= this.targetValue;
        if (this.operator === '<') return val < this.targetValue;
        if (this.operator === '<=') return val <= this.targetValue;
        if (this.operator === 'is_not_none') return val !== null && val !== undefined;
        return true;
    }

    toJSON() {
        return {
            expression: this.expression,
            variable: this.variable,
            operator: this.operator,
            targetValue: this.targetValue,
            isExclusion: this.isExclusion,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new GeneratorConstraint(json);
    }
}
