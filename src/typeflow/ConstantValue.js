/**
 * ConstantValue — Safe static representation of provable constant values.
 */

export class ConstantValue {
    /**
     * @param {object} params
     * @param {string} params.type - 'int', 'float', 'string', 'bool', 'none', 'bytes'
     * @param {*} params.value
     * @param {string} [params.raw]
     */
    constructor({ type = 'unknown', value = null, raw = null } = {}) {
        this.type = type;
        this.value = value;
        this.raw = raw !== null ? raw : String(value);
        this.isKnown = type !== 'unknown' && type !== null;
    }

    static int(val) { return new ConstantValue({ type: 'int', value: Number(val), raw: String(val) }); }
    static float(val) { return new ConstantValue({ type: 'float', value: Number(val), raw: String(val) }); }
    static string(val) { return new ConstantValue({ type: 'string', value: String(val), raw: JSON.stringify(val) }); }
    static bool(val) { return new ConstantValue({ type: 'bool', value: Boolean(val), raw: val ? 'True' : 'False' }); }
    static none() { return new ConstantValue({ type: 'none', value: null, raw: 'None' }); }
    static unknown() { return new ConstantValue({ type: 'unknown', value: null, raw: '<unknown>' }); }

    equals(other) {
        if (!other || !(other instanceof ConstantValue)) return false;
        if (this.type !== other.type) return false;
        return this.value === other.value;
    }

    toString() {
        return this.raw;
    }

    toJSON() {
        return {
            type: this.type,
            value: this.value,
            raw: this.raw,
            isKnown: this.isKnown,
        };
    }

    static fromJSON(json) {
        if (!json) return ConstantValue.unknown();
        return new ConstantValue(json);
    }
}
