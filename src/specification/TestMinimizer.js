/**
 * TestMinimizer — Minimizes test suite while preserving objective coverage.
 */

export class TestMinimizer {
    /**
     * @param {Array<SemanticTestCase>} tests
     * @param {Array<object>} objectives
     * @returns {Array<SemanticTestCase>}
     */
    static minimize(tests = [], objectives = []) {
        const coveredObjectives = new Set();
        const minimized = [];

        // Greedy set cover
        for (const test of tests) {
            const objId = test.objective?.id;
            if (objId && !coveredObjectives.has(objId)) {
                coveredObjectives.add(objId);
                minimized.push(test);
            } else if (!objId && minimized.length < 50) {
                minimized.push(test);
            }
        }

        return minimized.length > 0 ? minimized : tests;
    }
}
