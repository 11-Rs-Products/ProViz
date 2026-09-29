/**
 * SymbolicEnvironment — Scoped immutable mapping from variables/SSA values to SymbolicExpressions.
 */

import { SymbolicExpression } from './SymbolicExpression.js';

export class SymbolicEnvironment {
    /**
     * @param {Map<string, SymbolicExpression>|object} [bindings]
     * @param {SymbolicEnvironment|null} [parent=null]
     */
    constructor(bindings = null, parent = null) {
        this.parent = parent;
        this.bindings = new Map();

        if (bindings instanceof Map) {
            for (const [k, v] of bindings.entries()) {
                this.bindings.set(k, v instanceof SymbolicExpression ? v : SymbolicExpression.constant(v));
            }
        } else if (bindings && typeof bindings === 'object') {
            for (const [k, v] of Object.entries(bindings)) {
                this.bindings.set(k, v instanceof SymbolicExpression ? v : SymbolicExpression.constant(v));
            }
        }
    }

    get(name) {
        if (this.bindings.has(name)) return this.bindings.get(name);
        if (this.parent) return this.parent.get(name);
        return null;
    }

    has(name) {
        if (this.bindings.has(name)) return true;
        if (this.parent) return this.parent.has(name);
        return false;
    }

    set(name, expr) {
        const next = new SymbolicEnvironment(this.bindings, this.parent);
        next.bindings.set(name, expr instanceof SymbolicExpression ? expr : SymbolicExpression.constant(expr));
        return next;
    }

    getAllBindings() {
        const merged = new Map();
        if (this.parent) {
            for (const [k, v] of this.parent.getAllBindings().entries()) merged.set(k, v);
        }
        for (const [k, v] of this.bindings.entries()) merged.set(k, v);
        return merged;
    }

    toJSON() {
        const obj = {};
        for (const [k, v] of this.getAllBindings().entries()) {
            obj[k] = v.toJSON();
        }
        return obj;
    }

    static fromJSON(json) {
        const env = new SymbolicEnvironment();
        if (!json) return env;
        for (const [k, v] of Object.entries(json)) {
            env.bindings.set(k, SymbolicExpression.fromJSON(v));
        }
        return env;
    }
}
