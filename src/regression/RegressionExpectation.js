/**
 * RegressionExpectation — Declarative specification of legitimate/expected behavioral alterations.
 */

export const EXPECTATION_KINDS = Object.freeze({
    EXPECTED_RETURN_CHANGE: 'EXPECTED_RETURN_CHANGE',
    EXPECTED_EXCEPTION_CHANGE: 'EXPECTED_EXCEPTION_CHANGE',
    EXPECTED_OUTPUT_CHANGE: 'EXPECTED_OUTPUT_CHANGE',
    EXPECTED_STATE_CHANGE: 'EXPECTED_STATE_CHANGE',
    EXPECTED_PATH_CHANGE: 'EXPECTED_PATH_CHANGE',
    EXPECTED_COVERAGE_CHANGE: 'EXPECTED_COVERAGE_CHANGE',
    EXPECTED_REMOVED_FAILURE: 'EXPECTED_REMOVED_FAILURE',
});

export class RegressionExpectation {
    /**
     * @param {object} params
     * @param {string} params.kind - From EXPECTATION_KINDS
     * @param {string} [params.testId='']
     * @param {string} [params.targetFunction='']
     * @param {*} [params.expectedReturn=undefined]
     * @param {string|null} [params.expectedException=null]
     * @param {string} [params.rationale='']
     */
    constructor({
        kind = EXPECTATION_KINDS.EXPECTED_RETURN_CHANGE,
        testId = '',
        targetFunction = '',
        expectedReturn = undefined,
        expectedException = null,
        rationale = '',
    } = {}) {
        this.kind = kind;
        this.testId = String(testId || '');
        this.targetFunction = String(targetFunction || '');
        this.expectedReturn = expectedReturn;
        this.expectedException = expectedException;
        this.rationale = String(rationale || '');
        Object.freeze(this);
    }

    matches(observation) {
        if (!observation) return false;
        if (this.expectedException) {
            return observation.exception && (observation.exception.type === this.expectedException || observation.exception.name === this.expectedException);
        }
        if (this.expectedReturn !== undefined) {
            return JSON.stringify(observation.returnValue) === JSON.stringify(this.expectedReturn);
        }
        return true;
    }

    toJSON() {
        return {
            kind: this.kind,
            testId: this.testId,
            targetFunction: this.targetFunction,
            expectedReturn: this.expectedReturn,
            expectedException: this.expectedException,
            rationale: this.rationale,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RegressionExpectation(json);
    }
}
