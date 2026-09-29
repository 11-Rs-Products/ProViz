/**
 * OracleExpression — Safe executable expression descriptor for oracles.
 */

export class OracleExpression {
    /**
     * @param {object} params
     * @param {string} params.expression
     * @param {string} [params.operator='==']
     * @param {any} [params.expectedValue]
     * @param {string} [params.targetVariable='$return']
     */
    constructor({
        expression,
        operator = '==',
        expectedValue = undefined,
        targetVariable = '$return',
    } = {}) {
        this.expression = String(expression || '');
        this.operator = String(operator);
        this.expectedValue = expectedValue;
        this.targetVariable = targetVariable;
        Object.freeze(this);
    }

    toJSON() {
        return {
            expression: this.expression,
            operator: this.operator,
            expectedValue: this.expectedValue,
            targetVariable: this.targetVariable,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new OracleExpression(json);
    }
}
