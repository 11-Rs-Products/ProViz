/**
 * TestSelectionReason — Structured, auditable reason why a test was selected.
 */

export class TestSelectionReason {
    /**
     * @param {object} params
     * @param {string} params.kind - e.g. 'CHANGED_FUNCTION_COVERAGE', 'DATA_DEPENDENCY', 'BRANCH_FEASIBILITY'
     * @param {string} params.description
     * @param {string} [params.entityId='']
     * @param {number} [params.weight=1.0]
     */
    constructor({
        kind,
        description,
        entityId = '',
        weight = 1.0,
    } = {}) {
        this.kind = String(kind || 'DIRECT_IMPACT');
        this.description = String(description || '');
        this.entityId = String(entityId || '');
        this.weight = typeof weight === 'number' ? weight : 1.0;
        Object.freeze(this);
    }

    toJSON() {
        return {
            kind: this.kind,
            description: this.description,
            entityId: this.entityId,
            weight: this.weight,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TestSelectionReason(json);
    }
}
