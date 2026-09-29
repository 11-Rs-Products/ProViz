/**
 * TestRelevance — Categorization and priority metadata for a test relative to a semantic change.
 */

export const TEST_RELEVANCE_LEVELS = Object.freeze({
    DIRECTLY_AFFECTED: 'DIRECTLY_AFFECTED',
    INDIRECTLY_AFFECTED: 'INDIRECTLY_AFFECTED',
    COVERAGE_RELATED: 'COVERAGE_RELATED',
    DATA_DEPENDENT: 'DATA_DEPENDENT',
    CONTROL_DEPENDENT: 'CONTROL_DEPENDENT',
    TYPE_DEPENDENT: 'TYPE_DEPENDENT',
    SYMBOLICALLY_RELEVANT: 'SYMBOLICALLY_RELEVANT',
    RUNTIME_RELEVANT: 'RUNTIME_RELEVANT',
    MUTATION_RELEVANT: 'MUTATION_RELEVANT',
    REPAIR_RELEVANT: 'REPAIR_RELEVANT',
    UNRELATED: 'UNRELATED',
    UNKNOWN: 'UNKNOWN',
});

export class TestRelevance {
    /**
     * @param {object} params
     * @param {string} params.testId
     * @param {string} [params.relevance=TEST_RELEVANCE_LEVELS.DIRECTLY_AFFECTED]
     * @param {Array<string>} [params.reasons=[]]
     * @param {Array<string>} [params.impactedEntities=[]]
     * @param {string} [params.confidence='HIGH_CONFIDENCE']
     * @param {number} [params.priority=0.5]
     * @param {object} [params.metadata={}]
     */
    constructor({
        testId,
        relevance = TEST_RELEVANCE_LEVELS.DIRECTLY_AFFECTED,
        reasons = [],
        impactedEntities = [],
        confidence = 'HIGH_CONFIDENCE',
        priority = 0.5,
        metadata = {},
    } = {}) {
        if (!testId) throw new Error('TestRelevance requires a testId');
        this.testId = String(testId);
        this.relevance = relevance;
        this.reasons = Object.freeze([...reasons]);
        this.impactedEntities = Object.freeze([...impactedEntities]);
        this.confidence = confidence;
        this.priority = Math.max(0, Math.min(1, Number(priority) || 0.5));
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            testId: this.testId,
            relevance: this.relevance,
            reasons: this.reasons,
            impactedEntities: this.impactedEntities,
            confidence: this.confidence,
            priority: this.priority,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TestRelevance(json);
    }
}
