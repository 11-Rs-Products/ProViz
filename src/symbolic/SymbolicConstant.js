/**
 * SymbolicConstant — Representation of deterministic constant values within symbolic expressions.
 */

export class SymbolicConstant {
    /**
     * @param {object} params
     * @param {string} params.type - 'int' | 'float' | 'string' | 'bool' | 'none'
     * @param {any} params.value
     * @param {string} [params.raw]
     */
    constructor({ type = 'none', value = null, raw = null } = {}) {
        this.type = type;
        this.value = value;
        this.raw = raw !== null ? raw : String(value);
        Object.freeze(this);
    }

    static int(val) { return new SymbolicConstant({ type: 'int', value: Number(val), raw: String(val) }); }
    static float(val) { return new SymbolicConstant({ type: 'float', value: Number(val), raw: String(val) }); }
    static string(val) { return new SymbolicConstant({ type: 'string', value: String(val), raw: JSON.stringify(val) }); }
    static bool(val) { return new SymbolicConstant({ type: 'bool', value: Boolean(val), raw: val ? 'True' : 'False' }); }
    static none() { return new SymbolicConstant({ type: 'none', value: null, raw: 'None' }); }

    isZero() {
        return (this.type === 'int' || this.type === 'float') && this.value === 0;
    }

    isOne() {
        return (this.type === 'int' || this.type === 'float') && this.value === 1;
    }

    equals(other) {
        if (!other || !(other instanceof SymbolicConstant)) return false;
        return this.type === other.type && this.value === other.value;
    }

    toString() {
        return this.raw;
    }

    toJSON() {
        return {
            type: this.type,
            value: this.value,
            raw: this.raw,
        };
    }

    static fromJSON(json) {
        if (!json) return SymbolicConstant.none();
        return new SymbolicConstant(json);
    }
}
