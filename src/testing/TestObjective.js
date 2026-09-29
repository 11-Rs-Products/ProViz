/**
 * TestObjective — Concrete objective for generating a test scenario.
 */

export const TEST_OBJECTIVES = Object.freeze({
    VALIDATE_COUNTEREXAMPLE: 'VALIDATE_COUNTEREXAMPLE',
    TRIGGER_EXCEPTION: 'TRIGGER_EXCEPTION',
    COVER_BRANCH: 'COVER_BRANCH',
    PROVE_SAFE: 'PROVE_SAFE',
    REACH_NODE: 'REACH_NODE',
    EXPLORE_PATH: 'EXPLORE_PATH',
    REGRESSION: 'REGRESSION',
});

export class TestObjective {
    /**
     * @param {object} params
     * @param {string} params.type - One of TEST_OBJECTIVES
     * @param {string|null} [params.description]
     * @param {object} [params.metadata={}]
     */
    constructor({
        type = TEST_OBJECTIVES.TRIGGER_EXCEPTION,
        description = null,
        metadata = {},
    } = {}) {
        this.type = type;
        this.description = description || `Objective: ${this.type}`;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            type: this.type,
            description: this.description,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return new TestObjective({});
        return new TestObjective(json);
    }
}
