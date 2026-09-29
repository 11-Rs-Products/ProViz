/**
 * TestDeduplicator — Filters duplicate test cases based on canonical input signatures and targets.
 */

export class TestDeduplicator {
    /**
     * Deduplicate an array of TestCases.
     * @param {Array<import('./TestCase.js').TestCase>} testCases
     * @returns {Array<import('./TestCase.js').TestCase>}
     */
    static deduplicate(testCases = []) {
        const seen = new Set();
        const result = [];

        for (const tc of testCases) {
            if (!tc) continue;
            const sig = this.computeSignature(tc);
            if (!seen.has(sig)) {
                seen.add(sig);
                result.push(tc);
            }
        }

        return result;
    }

    static computeSignature(testCase) {
        const inputBindings = testCase.inputs?.toJSON()?.bindings || {};
        const sortedKeys = Object.keys(inputBindings).sort();
        const parts = [testCase.targetKind, testCase.targetId];

        for (const k of sortedKeys) {
            parts.push(`${k}:${JSON.stringify(inputBindings[k])}`);
        }

        return parts.join('|');
    }
}
