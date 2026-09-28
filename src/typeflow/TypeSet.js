/**
 * TypeSet — Deterministic set of possible AbstractType representations.
 */

import { AbstractType, TYPE_KINDS } from './AbstractType.js';

export class TypeSet {
    /**
     * @param {Array<AbstractType>} [types=[]]
     */
    constructor(types = []) {
        this.types = new Map(); // key -> AbstractType
        if (Array.isArray(types)) {
            for (const t of types) {
                this.add(t);
            }
        }
    }

    _makeKey(type) {
        if (!type) return 'unknown';
        return type.toString();
    }

    add(type) {
        if (!type) return this;
        const absType = type instanceof AbstractType ? type : new AbstractType(type);
        this.types.set(this._makeKey(absType), absType);
        return this;
    }

    remove(type) {
        if (!type) return this;
        const key = typeof type === 'string' ? type : this._makeKey(type);
        this.types.delete(key);
        return this;
    }

    has(type) {
        if (!type) return false;
        if (typeof type === 'string') {
            for (const t of this.types.values()) {
                if (t.kind === type || t.name === type) return true;
            }
            return false;
        }
        return this.types.has(this._makeKey(type));
    }

    get size() {
        return this.types.size;
    }

    isEmpty() {
        return this.types.size === 0;
    }

    isUnknown() {
        if (this.isEmpty()) return true;
        return this.types.size === 1 && this.has(TYPE_KINDS.UNKNOWN);
    }

    isSingle() {
        return this.types.size === 1;
    }

    first() {
        const it = this.types.values().next();
        return it.done ? null : it.value;
    }

    toArray() {
        // Return sorted by string representation for strict determinism
        return Array.from(this.types.values()).sort((a, b) => a.toString().localeCompare(b.toString()));
    }

    union(other) {
        const res = new TypeSet(this.toArray());
        if (other instanceof TypeSet) {
            for (const t of other.types.values()) {
                res.add(t);
            }
        }
        return res;
    }

    intersect(other) {
        const res = new TypeSet();
        if (other instanceof TypeSet) {
            for (const t of this.types.values()) {
                if (other.has(t)) {
                    res.add(t);
                }
            }
        }
        return res;
    }

    equals(other) {
        if (!other || !(other instanceof TypeSet)) return false;
        if (this.size !== other.size) return false;
        for (const [key] of this.types.entries()) {
            if (!other.types.has(key)) return false;
        }
        return true;
    }

    toString() {
        if (this.isEmpty()) return 'unknown';
        const sorted = this.toArray().map(t => t.toString());
        return sorted.join(' | ');
    }

    toJSON() {
        return this.toArray().map(t => t.toJSON());
    }

    static fromJSON(json) {
        if (!Array.isArray(json)) return new TypeSet([AbstractType.unknown()]);
        return new TypeSet(json.map(item => AbstractType.fromJSON(item)));
    }
}
