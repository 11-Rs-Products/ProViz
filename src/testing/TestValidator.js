/**
 * TestValidator — Validates dynamic test executions against TestCases and creates TestResults.
 */

import { TestResult, TEST_RESULT_STATUSES } from './TestResult.js';
import { PredictionComparator, COMPARISON_STATUSES } from './PredictionComparator.js';

export class TestValidator {
    /**
     * Validate a TestCase against an observed dynamic execution.
     * @param {import('./TestCase.js').TestCase} testCase
     * @param {import('./TestObservation.js').TestObservation} observation
     * @returns {TestResult}
     */
    static validate(testCase, observation) {
        if (!testCase || !observation) {
            return new TestResult({
                testId: testCase?.id || 'unknown',
                status: TEST_RESULT_STATUSES.INCONCLUSIVE,
                observation,
            });
        }

        const comp = PredictionComparator.compare(testCase.expected, observation);
        let resultStatus = TEST_RESULT_STATUSES.PASS;

        if (comp.status === COMPARISON_STATUSES.MISMATCH) {
            resultStatus = TEST_RESULT_STATUSES.MISMATCH;
        } else if (observation.executionStatus === 'ERROR' && !testCase.expected.expectedException) {
            resultStatus = TEST_RESULT_STATUSES.FAIL;
        } else if (comp.status === COMPARISON_STATUSES.PARTIAL_MATCH) {
            resultStatus = TEST_RESULT_STATUSES.PASS;
        }

        return new TestResult({
            testId: testCase.id,
            status: resultStatus,
            observation,
            comparison: comp,
            coverage: observation.coverage,
            validation: {
                targetKind: testCase.targetKind,
                targetId: testCase.targetId,
                findingId: testCase.findingId,
                matches: comp.matches,
            },
            diagnostics: comp.mismatches,
        });
    }
}
