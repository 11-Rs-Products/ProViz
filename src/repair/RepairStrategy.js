/**
 * RepairStrategy — Enumeration and metadata of supported fix strategies.
 */

export const REPAIR_STRATEGIES = Object.freeze({
    NULL_GUARD: 'NULL_GUARD',
    DEFAULT_VALUE: 'DEFAULT_VALUE',
    BOUNDS_CHECK: 'BOUNDS_CHECK',
    DIVISION_GUARD: 'DIVISION_GUARD',
    TYPE_GUARD: 'TYPE_GUARD',
    ATTRIBUTE_GUARD: 'ATTRIBUTE_GUARD',
    EMPTY_COLLECTION_GUARD: 'EMPTY_COLLECTION_GUARD',
    KEY_EXISTENCE_GUARD: 'KEY_EXISTENCE_GUARD',
    LOOP_BOUND_GUARD: 'LOOP_BOUND_GUARD',
    RETURN_GUARD: 'RETURN_GUARD',
    PRECONDITION_GUARD: 'PRECONDITION_GUARD',
    POSTCONDITION_GUARD: 'POSTCONDITION_GUARD',
    VALIDATION_CHECK: 'VALIDATION_CHECK',
    EXCEPTION_HANDLING: 'EXCEPTION_HANDLING',
});

export class RepairStrategy {
    /**
     * @param {object} params
     * @param {string} params.kind
     * @param {string} [params.description='']
     * @param {object} [params.options={}]
     */
    constructor({
        kind = REPAIR_STRATEGIES.NULL_GUARD,
        description = '',
        options = {},
    } = {}) {
        this.kind = kind;
        this.description = description || `Repair strategy for ${kind}`;
        this.options = Object.freeze({ ...options });
        Object.freeze(this);
    }

    toJSON() {
        return {
            kind: this.kind,
            description: this.description,
            options: this.options,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RepairStrategy(json);
    }
}
