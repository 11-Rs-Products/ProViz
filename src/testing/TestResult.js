/**
 * TestResult — Immutable result of executing and validating a TestCase.
 */

import { TestObservation } from './TestObservation.js';
import { Coverage } from './Coverage.js';

export const TEST_RESULT_STATUSES = Object.freeze({
    PASS: 'PASS',
    FAIL: 'FAIL',
    MISMATCH: 'MISMATCH',
    INCONCLUSIVE: 'INCONCLUSIVE',
    UNEXECUTABLE: 'UNEXECUTABLE',
    TIMEOUT: 'TIMEOUT',
    ERROR: 'ERROR',
});

export class TestResult {
    /**
     * @param {object} params
     * @param {string} params.testId
     * @param {string} [params.status=TEST_RESULT_STATUSES.PASS]
     * @param {TestObservation|object} [params.observation]
     * @param {object} [params.comparison={}]
     * @param {Coverage|object} [params.coverage]
     * @param {object} [params.validation={}]
     * @param {Array<string>} [params.diagnostics=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        testId,
        status = TEST_RESULT_STATUSES.PASS,
        observation = new TestObservation(),
        comparison = {},
        coverage = new Coverage(),
        validation = {},
        diagnostics = [],
        metadata = {},
    } = {}) {
        this.testId = String(testId || '');
        this.status = status;
        this.observation = observation instanceof TestObservation ? observation : TestObservation.fromJSON(observation);
        this.comparison = Object.freeze({ ...comparison });
        this.coverage = coverage instanceof Coverage ? coverage : Coverage.fromJSON(coverage);
        this.validation = Object.freeze({ ...validation });
        this.diagnostics = Object.freeze([...diagnostics]);
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    isSuccess() {
        return this.status === TEST_RESULT_STATUSES.PASS;
    }

    toJSON() {
        return {
            testId: this.testId,
            status: this.status,
            observation: this.observation.toJSON(),
            comparison: this.comparison,
            coverage: this.coverage.toJSON(),
            validation: this.validation,
            diagnostics: this.diagnostics,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TestResult({
            testId: json.testId,
            status: json.status,
            observation: TestObservation.fromJSON(json.observation),
            comparison: json.comparison,
            coverage: Coverage.fromJSON(json.coverage),
            validation: json.validation,
            diagnostics: json.diagnostics,
            metadata: json.metadata,
        });
    }
}
