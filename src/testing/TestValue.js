/**
 * TestValue — Safe representation of concrete test values.
 */

export const TEST_VALUE_TYPES = Object.freeze({
    NONE: 'NONE',
    BOOL: 'BOOL',
    INT: 'INT',
    FLOAT: 'FLOAT',
    STRING: 'STRING',
    BYTES: 'BYTES',
    LIST: 'LIST',
    TUPLE: 'TUPLE',
    SET: 'SET',
    DICT: 'DICT',
    UNCONSTRUCTABLE: 'UNCONSTRUCTABLE',
});

export class TestValue {
    /**
     * @param {object} params
     * @param {*} params.value
     * @param {string} [params.type='INT']
     * @param {object|null} [params.originConstraint=null]
     * @param {string|null} [params.symbolId=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        value,
        type = TEST_VALUE_TYPES.INT,
        originConstraint = null,
        symbolId = null,
        metadata = {},
    } = {}) {
        this.value = value;
        this.type = type;
        this.originConstraint = originConstraint;
        this.symbolId = symbolId;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    static none(originConstraint = null, symbolId = null) {
        return new TestValue({ value: null, type: TEST_VALUE_TYPES.NONE, originConstraint, symbolId });
    }

    static bool(val, originConstraint = null, symbolId = null) {
        return new TestValue({ value: Boolean(val), type: TEST_VALUE_TYPES.BOOL, originConstraint, symbolId });
    }

    static int(val, originConstraint = null, symbolId = null) {
        return new TestValue({ value: Math.trunc(Number(val) || 0), type: TEST_VALUE_TYPES.INT, originConstraint, symbolId });
    }

    static float(val, originConstraint = null, symbolId = null) {
        return new TestValue({ value: Number(val) || 0.0, type: TEST_VALUE_TYPES.FLOAT, originConstraint, symbolId });
    }

    static string(val, originConstraint = null, symbolId = null) {
        return new TestValue({ value: String(val ?? ''), type: TEST_VALUE_TYPES.STRING, originConstraint, symbolId });
    }

    static list(items = [], originConstraint = null, symbolId = null) {
        return new TestValue({ value: Object.freeze([...items]), type: TEST_VALUE_TYPES.LIST, originConstraint, symbolId });
    }

    static dict(entries = {}, originConstraint = null, symbolId = null) {
        return new TestValue({ value: Object.freeze({ ...entries }), type: TEST_VALUE_TYPES.DICT, originConstraint, symbolId });
    }

    static unconstructable(reason = 'Unsupported symbolic domain', originConstraint = null, symbolId = null) {
        return new TestValue({
            value: null,
            type: TEST_VALUE_TYPES.UNCONSTRUCTABLE,
            originConstraint,
            symbolId,
            metadata: { reason },
        });
    }

    isConstructable() {
        return this.type !== TEST_VALUE_TYPES.UNCONSTRUCTABLE;
    }

    toJSON() {
        return {
            value: this.value,
            type: this.type,
            originConstraint: this.originConstraint,
            symbolId: this.symbolId,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return TestValue.none();
        return new TestValue(json);
    }
}
