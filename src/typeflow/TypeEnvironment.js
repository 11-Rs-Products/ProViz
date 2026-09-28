/**
 * TypeEnvironment — Scope-aware environment mapping variables and SSA values to AbstractValues.
 */

import { AbstractValue } from './AbstractValue.js';

export class TypeEnvironment {
    /**
     * @param {object} [params]
     * @param {string} [params.scopeName='local']
     * @param {Map<string, AbstractValue>} [params.bindings]
     * @param {TypeEnvironment|null} [params.parent=null]
     */
    constructor({ scopeName = 'local', bindings = null, parent = null } = {}) {
        this.scopeName = scopeName;
        this.bindings = new Map();
        this.parent = parent;
        if (bindings instanceof Map) {
            for (const [k, v] of bindings.entries()) this.bindings.set(k, v);
        } else if (typeof bindings === 'object' && bindings !== null) {
            for (const [k, v] of Object.entries(bindings)) {
                this.bindings.set(k, v instanceof AbstractValue ? v : AbstractValue.fromJSON(v));
            }
        }
    }

    get(variableId) {
        if (this.bindings.has(variableId)) return this.bindings.get(variableId);
        return this.parent ? this.parent.get(variableId) : null;
    }

    set(variableId, abstractValue) {
        const val = abstractValue instanceof AbstractValue ? abstractValue : new AbstractValue(abstractValue);
        this.bindings.set(variableId, val);
        return this;
    }

    has(variableId) {
        if (this.bindings.has(variableId)) return true;
        return this.parent ? this.parent.has(variableId) : false;
    }

    keys() {
        const set = new Set(this.bindings.keys());
        if (this.parent) {
            for (const k of this.parent.keys()) set.add(k);
        }
        return Array.from(set).sort();
    }

    clone() {
        return new TypeEnvironment({ scopeName: this.scopeName, parent: this });
    }

    getAllBindings() {
        const out = new Map();
        if (this.parent) {
            for (const [k, v] of this.parent.getAllBindings().entries()) out.set(k, v);
        }
        for (const [k, v] of this.bindings.entries()) out.set(k, v);
        return out;
    }

    join(other) {
        if (!other || !(other instanceof TypeEnvironment)) return this.clone();
        const joined = new TypeEnvironment({ scopeName: this.scopeName });

        const allKeys = new Set([...this.keys(), ...other.keys()]);
        for (const k of allKeys) {
            const valA = this.get(k);
            const valB = other.get(k);
            if (valA && valB) {
                joined.set(k, valA.join(valB));
            } else if (valA) {
                joined.set(k, valA);
            } else if (valB) {
                joined.set(k, valB);
            }
        }
        return joined;
    }

    equals(other) {
        if (!other || !(other instanceof TypeEnvironment)) return false;
        const myKeys = this.keys();
        const otherKeys = other.keys();
        if (myKeys.length !== otherKeys.length) return false;
        for (const k of myKeys) {
            const v1 = this.get(k);
            const v2 = other.get(k);
            if (!v2 || v1.toString() !== v2.toString()) return false;
        }
        return true;
    }

    toJSON() {
        const out = {};
        for (const [k, v] of this.getAllBindings().entries()) {
            out[k] = v.toJSON();
        }
        return {
            scopeName: this.scopeName,
            bindings: out,
        };
    }

    static fromJSON(json) {
        if (!json) return new TypeEnvironment();
        return new TypeEnvironment(json);
    }
}
