/**
 * ConstraintAssignment — Concrete variable assignments derived from symbolic constraints.
 */

export const ASSIGNMENT_STATUSES = Object.freeze({
    SATISFIED: 'SATISFIED',
    PARTIAL: 'PARTIAL',
    UNCONSTRUCTABLE: 'UNCONSTRUCTABLE',
    UNSAT: 'UNSAT',
    UNKNOWN: 'UNKNOWN',
});

export class ConstraintAssignment {
    /**
     * @param {object} params
     * @param {string} [params.status=ASSIGNMENT_STATUSES.SATISFIED]
     * @param {Map<string, *>} [params.bindings=new Map()]
     * @param {Array<object>} [params.residualConstraints=[]]
     * @param {Array<object>} [params.unsupportedConstraints=[]]
     * @param {object|null} [params.proof=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        status = ASSIGNMENT_STATUSES.SATISFIED,
        bindings = new Map(),
        residualConstraints = [],
        unsupportedConstraints = [],
        proof = null,
        metadata = {},
    } = {}) {
        this.status = status;
        this.bindings = bindings instanceof Map ? new Map(bindings) : new Map(Object.entries(bindings || {}));
        this.residualConstraints = Object.freeze([...residualConstraints]);
        this.unsupportedConstraints = Object.freeze([...unsupportedConstraints]);
        this.proof = proof;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    getBinding(varName) {
        return this.bindings.get(varName);
    }

    hasBinding(varName) {
        return this.bindings.has(varName);
    }

    toJSON() {
        return {
            status: this.status,
            bindings: Object.fromEntries(this.bindings.entries()),
            residualConstraints: this.residualConstraints,
            unsupportedConstraints: this.unsupportedConstraints,
            proof: this.proof,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return new ConstraintAssignment();
        return new ConstraintAssignment({
            status: json.status,
            bindings: new Map(Object.entries(json.bindings || {})),
            residualConstraints: json.residualConstraints,
            unsupportedConstraints: json.unsupportedConstraints,
            proof: json.proof,
            metadata: json.metadata,
        });
    }
}
