/**
 * PropertyValue — Encapsulates the target value or payload associated with a property.
 */

export class PropertyValue {
    /**
     * @param {object} [params]
     * @param {string} [params.type] - 'constant' | 'range' | 'type' | 'boolean' | 'shape' | 'raw'
     * @param {any} [params.value]
     * @param {object} [params.metadata]
     */
    constructor({ type = 'raw', value = null, metadata = {} } = {}) {
        this.type = type;
        this.value = value;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    static constant(val) {
        return new PropertyValue({ type: 'constant', value: val });
    }

    static range(min, max) {
        return new PropertyValue({ type: 'range', value: { min, max } });
    }

    static type(typeName) {
        return new PropertyValue({ type: 'type', value: typeName });
    }

    static boolean(val) {
        return new PropertyValue({ type: 'boolean', value: Boolean(val) });
    }

    static raw(val) {
        return new PropertyValue({ type: 'raw', value: val });
    }

    equals(other) {
        if (!other || !(other instanceof PropertyValue)) return false;
        if (this.type !== other.type) return false;
        return JSON.stringify(this.value) === JSON.stringify(other.value);
    }

    toJSON() {
        return {
            type: this.type,
            value: this.value,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new PropertyValue(json);
    }
}
