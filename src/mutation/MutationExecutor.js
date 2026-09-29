/**
 * MutationExecutor — Executes a mutation candidate against a test suite to determine kill or survival.
 */

import { DifferentialExecutor } from './DifferentialExecutor.js';
import { TestCase } from '../testing/TestCase.js';
import { TestInput } from '../testing/TestInput.js';

export class MutationExecutor {
    /**
     * @param {object} [options]
     */
    constructor(options = {}) {
        this.diffExecutor = new DifferentialExecutor(options);
    }

    /**
     * Execute a mutant against a test suite.
     *
     * @param {import('./MutationCandidate.js').MutationCandidate} candidate
     * @param {string} originalSource
     * @param {Array<TestCase|object>} [testSuite=[]]
     * @param {object} [options={}]
     * @returns {{ killed: boolean, killingTests: Array<string>, survivingTests: Array<string>, details: Array<object> }}
     */
    executeMutant(candidate, originalSource, testSuite = [], options = {}) {
        const mutatedSource = candidate.patch.apply(originalSource);

        const tests = testSuite.length > 0 ? testSuite : [
            new TestCase({
                input: new TestInput({ bindings: { x: 10, y: 5, a: 2, b: 3, xs: [1, 2, 3], i: 0 } }),
                targetKind: 'MUTATION_TEST',
            }),
        ];

        const killingTests = [];
        const survivingTests = [];
        const details = [];

        for (const t of tests) {
            const testCase = t instanceof TestCase ? t : new TestCase(t);
            const res = this.diffExecutor.executePair(testCase, originalSource, mutatedSource, options);

            if (res.killed) {
                killingTests.push(testCase.testId);
                details.push({ testId: testCase.testId, status: 'KILLED', reason: res.comparison.reason });
            } else {
                survivingTests.push(testCase.testId);
                details.push({ testId: testCase.testId, status: 'SURVIVED', reason: res.comparison.reason });
            }
        }

        return {
            killed: killingTests.length > 0,
            killingTests,
            survivingTests,
            details,
        };
    }
}
