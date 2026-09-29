/**
 * TestDependencyGraph — Explicit mapping between Tests, coverage sites, functions, symbols, and contracts.
 */

export class TestDependencyGraph {
    /**
     * @param {object} [params]
     * @param {Map<string, Set<string>>} [params.testToEntities]
     * @param {Map<string, Set<string>>} [params.entityToTests]
     */
    constructor({ testToEntities = new Map(), entityToTests = new Map() } = {}) {
        this._testToEntities = new Map();
        this._entityToTests = new Map();

        for (const [tId, set] of testToEntities.entries()) {
            this._testToEntities.set(tId, new Set(set));
        }
        for (const [eId, set] of entityToTests.entries()) {
            this._entityToTests.set(eId, new Set(set));
        }
    }

    addCoverage(testId, entityId) {
        if (!testId || !entityId) return this;
        const tId = String(testId);
        const eId = String(entityId);

        if (!this._testToEntities.has(tId)) this._testToEntities.set(tId, new Set());
        this._testToEntities.get(tId).add(eId);

        if (!this._entityToTests.has(eId)) this._entityToTests.set(eId, new Set());
        this._entityToTests.get(eId).add(tId);

        return this;
    }

    getCoveredEntities(testId) {
        const set = this._testToEntities.get(String(testId));
        return set ? Array.from(set) : [];
    }

    getAffectedTests(entityIds) {
        const tests = new Set();
        for (const eId of entityIds) {
            const set = this._entityToTests.get(String(eId));
            if (set) {
                for (const t of set) tests.add(t);
            }
        }
        return Array.from(tests);
    }

    hasTest(testId) {
        return this._testToEntities.has(String(testId));
    }

    toJSON() {
        return {
            testToEntities: Object.fromEntries(Array.from(this._testToEntities.entries()).map(([k, set]) => [k, Array.from(set)])),
            entityToTests: Object.fromEntries(Array.from(this._entityToTests.entries()).map(([k, set]) => [k, Array.from(set)])),
        };
    }

    static fromJSON(json) {
        if (!json) return new TestDependencyGraph();
        const testToEntities = new Map(Object.entries(json.testToEntities || {}).map(([k, arr]) => [k, new Set(arr)]));
        const entityToTests = new Map(Object.entries(json.entityToTests || {}).map(([k, arr]) => [k, new Set(arr)]));
        return new TestDependencyGraph({ testToEntities, entityToTests });
    }
}
