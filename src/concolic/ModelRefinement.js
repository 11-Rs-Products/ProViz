/**
 * ModelRefinement — Structured refinement record generated when symbolic prediction diverges from dynamic execution.
 */

export const REFINEMENT_KINDS = Object.freeze({
    SYMBOLIC_TYPE_TOO_WEAK: 'SYMBOLIC_TYPE_TOO_WEAK',
    MISSING_RELATION: 'MISSING_RELATION',
    MISSING_ALIAS: 'MISSING_ALIAS',
    MISSING_SHAPE_CONSTRAINT: 'MISSING_SHAPE_CONSTRAINT',
    UNMODELED_BUILTIN: 'UNMODELED_BUILTIN',
    UNMODELED_CALL: 'UNMODELED_CALL',
    UNSUPPORTED_DYNAMIC_BEHAVIOR: 'UNSUPPORTED_DYNAMIC_BEHAVIOR',
    CONCRETIZATION_LOSS: 'CONCRETIZATION_LOSS',
    CONTROL_FLOW_MODEL_LIMIT: 'CONTROL_FLOW_MODEL_LIMIT',
});

export class ModelRefinement {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.kind=REFINEMENT_KINDS.MISSING_RELATION]
     * @param {string} [params.divergenceId='']
     * @param {string} [params.description='']
     * @param {Array<import('./RefinementConstraint.js').RefinementConstraint>} [params.refinementConstraints=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        kind = REFINEMENT_KINDS.MISSING_RELATION,
        divergenceId = '',
        description = '',
        refinementConstraints = [],
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.divergenceId = String(divergenceId);
        this.description = String(description);
        this.refinementConstraints = Object.freeze([...refinementConstraints]);
        this.metadata = Object.freeze({ ...metadata });
        this.id = id || `ref_${this.kind}_${this.divergenceId}`;
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            divergenceId: this.divergenceId,
            description: this.description,
            refinementConstraints: this.refinementConstraints.map(r => r.toJSON ? r.toJSON() : r),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ModelRefinement(json);
    }
}
