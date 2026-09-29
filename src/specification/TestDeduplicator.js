/**
 * TestDeduplicator — Deduplicates synthesized semantic tests by canonical behavioral signature.
 */

import { SemanticTestCase } from './SemanticTestCase.js';

export class TestDeduplicator {
    /**
     * @param {Array<SemanticTestCase>} tests
     * @returns {Array<SemanticTestCase>}
     */
    static deduplicate(tests = []) {
        const seen = new Set();
        const unique = [];

        for (const test of tests) {
            const signature = `${test.targetFunction}:${JSON.stringify(test.inputs)}:${test.objective?.kind || ''}:${test.oracle?.kind || ''}`;
            if (!seen.has(signature)) {
                seen.add(signature);
                unique.push(test);
            }
        }

        return unique;
    }
}
