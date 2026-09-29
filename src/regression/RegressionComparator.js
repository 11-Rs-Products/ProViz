/**
 * RegressionComparator — Compares baseline and changed test execution observations and assigns classification.
 */

import { REGRESSION_CLASSIFICATIONS } from './RegressionClassification.js';

export class RegressionComparator {
    /**
     * Compare baseline observation and changed observation against optional expectations.
     *
     * @param {object} baselineObs
     * @param {object} changedObs
     * @param {import('./RegressionExpectation.js').RegressionExpectation|null} [expectation=null]
     * @returns {object} { classification, delta, isRegression }
     */
    static compare(baselineObs, changedObs, expectation = null) {
        if (!baselineObs || !changedObs) {
            return {
                classification: REGRESSION_CLASSIFICATIONS.UNRESOLVED,
                delta: { error: 'Missing baseline or changed observation' },
                isRegression: false,
            };
        }

        const baseStatus = baselineObs.executionStatus;
        const changedStatus = changedObs.executionStatus;

        const baseReturn = baselineObs.returnValue;
        const changedReturn = changedObs.returnValue;

        const baseEx = baselineObs.exception;
        const changedEx = changedObs.exception;

        const returnChanged = baseReturn !== changedReturn && JSON.stringify(baseReturn) !== JSON.stringify(changedReturn);
        const exChanged = (!baseEx && changedEx) || (baseEx && !changedEx) || (baseEx && changedEx && (baseEx.type !== changedEx.type || baseEx.message !== changedEx.message));

        const delta = {
            statusChanged: baseStatus !== changedStatus,
            returnChanged,
            exceptionChanged: exChanged,
            baseline: { status: baseStatus, return: baseReturn, exception: baseEx },
            changed: { status: changedStatus, return: changedReturn, exception: changedEx },
        };

        // If expectation matches
        if (expectation && expectation.matches(changedObs)) {
            return {
                classification: REGRESSION_CLASSIFICATIONS.EXPECTED_CHANGE,
                delta,
                isRegression: false,
            };
        }

        // Fixed failure: baseline had error, changed succeeded
        if (baseEx && !changedEx) {
            return {
                classification: REGRESSION_CLASSIFICATIONS.FIXED_FAILURE,
                delta,
                isRegression: false,
            };
        }

        // New failure / unexpected regression: baseline succeeded, changed raised error
        if (!baseEx && changedEx) {
            return {
                classification: REGRESSION_CLASSIFICATIONS.UNEXPECTED_REGRESSION,
                delta,
                isRegression: true,
            };
        }

        // Return value changed
        if (returnChanged) {
            return {
                classification: REGRESSION_CLASSIFICATIONS.RETURN_VALUE_CHANGED,
                delta,
                isRegression: true,
            };
        }

        // Exception changed to another exception
        if (exChanged) {
            return {
                classification: REGRESSION_CLASSIFICATIONS.EXCEPTION_CHANGED,
                delta,
                isRegression: true,
            };
        }

        return {
            classification: REGRESSION_CLASSIFICATIONS.NO_REGRESSION,
            delta,
            isRegression: false,
        };
    }
}
