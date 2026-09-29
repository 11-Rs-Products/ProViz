/**
 * SymbolicValue — Wrapper encapsulating a SymbolicExpression with type and range metadata.
 */

import { SymbolicExpression } from './SymbolicExpression.js';

export class SymbolicValue {
    /**
     * @param {object} params
     * @param {SymbolicExpression} params.expression
     * @param {object|null} [params.typeInfo]
     * @param {object|null} [params.rangeInfo]
     * @param {object} [params.metadata]
     */
    constructor({
        expression,
        typeInfo = null,
        rangeInfo = null,
        metadata = {},
    }) {
        this.expression = expression instanceof SymbolicExpression ? expression : SymbolicExpression.constant(expression);
        this.typeInfo = typeInfo ? Object.freeze({ ...typeInfo }) : null;
        this.rangeInfo = rangeInfo ? Object.freeze({ ...rangeInfo }) : null;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    isConstant() {
        return this.expression.isConstant();
    }

    isSymbol() {
        return this.expression.isSymbol();
    }

    equals(other) {
        if (!other || !(other instanceof SymbolicValue)) return false;
        return this.expression.equals(other.expression);
    }

    toString() {
        return this.expression.toString();
    }

    toJSON() {
        return {
            expression: this.expression.toJSON(),
            typeInfo: this.typeInfo,
            rangeInfo: this.rangeInfo,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SymbolicValue({
            expression: SymbolicExpression.fromJSON(json.expression),
            typeInfo: json.typeInfo,
            rangeInfo: json.rangeInfo,
            metadata: json.metadata || {},
        });
    }
}
