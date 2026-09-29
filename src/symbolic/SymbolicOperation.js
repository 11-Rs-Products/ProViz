/**
 * SymbolicOperation — Represents binary and unary symbolic operations.
 */

import { SymbolicExpression } from './SymbolicExpression.js';

export class SymbolicOperation {
    static binary(op, left, right) {
        if (op === '+') return SymbolicExpression.add(left, right);
        if (op === '-') return SymbolicExpression.sub(left, right);
        if (op === '*') return SymbolicExpression.mul(left, right);
        if (op === '/') return SymbolicExpression.div(left, right);
        return SymbolicExpression.func(op, [left, right]);
    }

    static unary(op, operand) {
        if (op === 'not') return SymbolicExpression.not(operand);
        if (op === '-') return SymbolicExpression.sub(0, operand);
        return SymbolicExpression.func(op, [operand]);
    }
}
