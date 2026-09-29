/**
 * RegressionValidator — Runs existing regression test suites against patched code to detect regressions.
 */

import { TestExecutor } from '../testing/TestExecutor.js';
import { TestCase } from '../testing/TestCase.js';
import { TestInput } from '../testing/TestInput.js';

export class RegressionValidator {
    /**
     * Run regression tests against patched code.
     *
     * @param {import('./RepairCandidate.js').RepairCandidate} candidate
     * @param {string} patchedCode
     * @param {Array<TestCase|object>} [testSuite=[]]
     * @returns {{ valid: boolean, total: number, passed: number, failed: number, results: Array<object> }}
     */
    static validate(candidate, patchedCode, testSuite = []) {
        const executor = new TestExecutor();
        const results = [];

        // If no explicit test suite provided, construct a standard regression sanity test
        const tests = testSuite.length > 0 ? testSuite : [
            new TestCase({
                input: new TestInput({ bindings: { x: 10, xs: [1, 2, 3], i: 0, d: { key: 42 } } }),
                targetKind: 'REGRESSION_SANITY',
            }),
        ];

        let passed = 0;
        let failed = 0;

        for (const t of tests) {
            const testCase = t instanceof TestCase ? t : new TestCase(t);
            try {
                const execRes = executor.execute(testCase, patchedCode);
                const obs = execRes?.observation || execRes || {};
                const isPass = !obs.exception;
                if (isPass) {
                    passed++;
                    results.push({ testId: testCase.testId, status: 'PASS' });
                } else {
                    failed++;
                    results.push({ testId: testCase.testId, status: 'FAIL', error: obs.exception });
                }
            } catch (e) {
                failed++;
                results.push({ testId: testCase.testId, status: 'FAIL', error: e.message });
            }
        }

        return {
            valid: failed === 0,
            total: tests.length,
            passed,
            failed,
            results,
        };
    }
}
