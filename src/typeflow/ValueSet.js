/**
 * ValueSet — Deterministic set of constant values.
 */

import { ConstantValue } from './ConstantValue.js';

export class ValueSet {
    /**
     * @param {Array<ConstantValue>} [values=[]]
     */
    constructor(values = []) {
        this.values = new Map(); // key -> ConstantValue
        for (const v of values) {
            this.add(v);
        }
    }

    _makeKey(v) {
        if (!v) return 'unknown';
        return `${v.type}:${v.raw}`;
    }

    add(val) {
        if (!val) return this;
        const cVal = val instanceof ConstantValue ? val : new ConstantValue(val);
        this.values.set(this._makeKey(cVal), cVal);
        return this;
    }

    has(val) {
        if (!val) return false;
        const cVal = val instanceof ConstantValue ? val : new ConstantValue(val);
        return this.values.has(this._makeKey(cVal));
    }

    get size() {
        return this.values.size;
    }

    isEmpty() {
        return this.values.size === 0;
    }

    toArray() {
        return Array.from(this.values.values()).sort((a, b) => a.raw.localeCompare(b.raw));
    }

    union(other) {
        const res = new ValueSet(this.toArray());
        if (other instanceof ValueSet) {
            for (const v of other.values.values()) {
                res.add(v);
            }
        }
        return res;
    }

    equals(other) {
        if (!other || !(other instanceof ValueSet)) return false;
        if (this.size !== other.size) return false;
        for (const k of this.values.keys()) {
            if (!other.values.has(k)) return false;
        }
        return true;
    }

    toString() {
        if (this.isEmpty()) return '{}';
        return `{${this.toArray().map(v => v.raw).join(', ')}}`;
    }

    toJSON() {
        return this.toArray().map(v => v.toJSON());
    }

    static fromJSON(json) {
        if (!Array.isArray(json)) return new ValueSet();
        return new ValueSet(json.map(j => ConstantValue.fromJSON(j)));
    }
}
