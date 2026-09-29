/**
 * SymbolicVariable — Helper representing a named variable referencing a Symbol.
 */

import { Symbol } from './Symbol.js';
import { SymbolicExpression } from './SymbolicExpression.js';

export class SymbolicVariable {
    /**
     * @param {object} params
     * @param {string} params.name
     * @param {Symbol} [params.symbol]
     * @param {object} [params.typeInfo]
     */
    constructor({ name, symbol = null, typeInfo = null } = {}) {
        this.name = String(name);
        this.symbol = symbol instanceof Symbol ? symbol : new Symbol({ name: this.name });
        this.typeInfo = typeInfo;
        Object.freeze(this);
    }

    toExpression() {
        return SymbolicExpression.symbol(this.symbol);
    }

    toString() {
        return this.name;
    }
}
