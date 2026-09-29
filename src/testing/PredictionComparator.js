/**
 * PredictionComparator — Compares symbolic predictions (TestExpectation) against runtime observations (TestObservation).
 */

export const COMPARISON_STATUSES = Object.freeze({
    MATCH: 'MATCH',
    MISMATCH: 'MISMATCH',
    PARTIAL_MATCH: 'PARTIAL_MATCH',
    NOT_OBSERVED: 'NOT_OBSERVED',
    INCONCLUSIVE: 'INCONCLUSIVE',
});

export class PredictionComparator {
    /**
     * Compare expected behavior with observed execution outcome.
     * @param {import('./TestExpectation.js').TestExpectation} expectation
     * @param {import('./TestObservation.js').TestObservation} observation
     * @returns {object} - { status, matches: boolean, mismatches: Array<string>, details: object }
     */
    static compare(expectation, observation) {
        if (!expectation || !observation) {
            return { status: COMPARISON_STATUSES.INCONCLUSIVE, matches: false, mismatches: ['Missing expectation or observation'], details: {} };
        }

        const mismatches = [];
        let checks = 0;
        let passes = 0;

        // 1. Exception Check
        if (expectation.expectedException) {
            checks++;
            const obsExcType = observation.exception?.type || observation.exception?.name;
            if (obsExcType === expectation.expectedException || (obsExcType && obsExcType.includes(expectation.expectedException))) {
                passes++;
            } else {
                mismatches.push(`Expected exception '${expectation.expectedException}', but observed '${obsExcType || 'NONE'}'`);
            }
        }

        // 2. Return Value Check
        if (expectation.expectedReturnValue !== undefined) {
            checks++;
            if (observation.returnValue === expectation.expectedReturnValue) {
                passes++;
            } else {
                mismatches.push(`Expected return value '${expectation.expectedReturnValue}', but observed '${observation.returnValue}'`);
            }
        }

        // 3. Path Check
        if (expectation.expectedPathId && observation.observedPath.length > 0) {
            checks++;
            if (observation.observedPath.includes(expectation.expectedPathId)) {
                passes++;
            } else {
                mismatches.push(`Expected path '${expectation.expectedPathId}' was not in observed path`);
            }
        }

        let status = COMPARISON_STATUSES.MATCH;
        if (checks === 0) {
            status = COMPARISON_STATUSES.MATCH;
        } else if (passes === checks) {
            status = COMPARISON_STATUSES.MATCH;
        } else if (passes > 0) {
            status = COMPARISON_STATUSES.PARTIAL_MATCH;
        } else {
            status = COMPARISON_STATUSES.MISMATCH;
        }

        return {
            status,
            matches: status === COMPARISON_STATUSES.MATCH,
            mismatches,
            details: {
                checks,
                passes,
                expectedException: expectation.expectedException,
                observedException: observation.exception?.type || null,
            },
        };
    }
}
