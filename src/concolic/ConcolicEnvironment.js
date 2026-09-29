/**
 * ConcolicEnvironment — Dual concrete and symbolic environment bindings.
 */

import { ConcolicValue } from './ConcolicValue.js';

export class ConcolicEnvironment {
    /**
     * @param {Map<string, ConcolicValue>|object} [bindings={}]
     */
    constructor(bindings = {}) {
        this.bindings = new Map();
        if (bindings instanceof Map) {
            for (const [k, v] of bindings.entries()) {
                this.bindings.set(k, v instanceof ConcolicValue ? v : new ConcolicValue({ concreteValue: v }));
            }
        } else if (bindings && typeof bindings === 'object') {
            for (const [k, v] of Object.entries(bindings)) {
                this.bindings.set(k, v instanceof ConcolicValue ? v : new ConcolicValue({ concreteValue: v }));
            }
        }
    }

    get(name) {
        return this.bindings.get(name) || null;
    }

    has(name) {
        return this.bindings.has(name);
    }

    set(name, val) {
        const next = new Map(this.bindings);
        next.set(name, val instanceof ConcolicValue ? val : new ConcolicValue({ concreteValue: val }));
        return new ConcolicEnvironment(next);
    }

    toJSON() {
        const obj = {};
        for (const [k, v] of this.bindings.entries()) {
            obj[k] = v.toJSON();
        }
        return obj;
    }

    static fromJSON(json) {
        if (!json) return new ConcolicEnvironment();
        const map = new Map();
        for (const [k, v] of Object.entries(json)) {
            map.set(k, ConcolicValue.fromJSON(v));
        }
        return new ConcolicEnvironment(map);
    }
}
