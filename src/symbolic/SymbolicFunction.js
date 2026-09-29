/**
 * SymbolicFunction — Symbolic representation of named function call expressions.
 */

import { SymbolicExpression } from './SymbolicExpression.js';

export class SymbolicFunction {
    /**
     * @param {string} name
     * @param {Array<SymbolicExpression>} [args=[]]
     */
    constructor(name, args = []) {
        this.name = String(name);
        this.args = Object.freeze([...args]);
        Object.freeze(this);
    }

    toExpression() {
        return SymbolicExpression.func(this.name, this.args);
    }

    toString() {
        return `${this.name}(${this.args.join(', ')})`;
    }
}
