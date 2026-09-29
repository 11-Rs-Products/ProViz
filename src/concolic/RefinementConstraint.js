/**
 * RefinementConstraint — Constraint learned from concrete execution to refine the symbolic model.
 */

export class RefinementConstraint {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {import('../symbolic/Constraint.js').Constraint|object} params.constraint
     * @param {string} [params.justification='']
     * @param {string} [params.confidence='HIGH']
     */
    constructor({
        id = null,
        constraint,
        justification = '',
        confidence = 'HIGH',
    } = {}) {
        this.constraint = constraint;
        this.justification = String(justification);
        this.confidence = confidence;
        this.id = id || `ref_cst_${this.constraint?.toString ? this.constraint.toString() : 'cst'}`;
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            constraint: this.constraint?.toJSON ? this.constraint.toJSON() : this.constraint,
            justification: this.justification,
            confidence: this.confidence,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RefinementConstraint(json);
    }
}
