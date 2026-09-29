/**
 * RegressionResult — Comparative execution result for a single test case.
 */

import { RegressionFinding } from './RegressionFinding.js';

export class RegressionResult {
    /**
     * @param {object} params
     * @param {string} params.testId
     * @param {object|null} [params.baselineObservation=null]
     * @param {object|null} [params.changedObservation=null]
     * @param {RegressionFinding|object|null} [params.finding=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        testId,
        baselineObservation = null,
        changedObservation = null,
        finding = null,
        metadata = {},
    } = {}) {
        if (!testId) throw new Error('RegressionResult requires testId');
        this.testId = String(testId);
        this.baselineObservation = baselineObservation ? Object.freeze({ ...baselineObservation }) : null;
        this.changedObservation = changedObservation ? Object.freeze({ ...changedObservation }) : null;
        this.finding = finding instanceof RegressionFinding ? finding : (finding ? RegressionFinding.fromJSON(finding) : null);
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    get isRegression() {
        return this.finding ? this.finding.classification === 'UNEXPECTED_REGRESSION' || this.finding.classification === 'RETURN_VALUE_CHANGED' : false;
    }

    toJSON() {
        return {
            testId: this.testId,
            baselineObservation: this.baselineObservation,
            changedObservation: this.changedObservation,
            finding: this.finding ? this.finding.toJSON() : null,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RegressionResult({
            testId: json.testId,
            baselineObservation: json.baselineObservation,
            changedObservation: json.changedObservation,
            finding: json.finding ? RegressionFinding.fromJSON(json.finding) : null,
            metadata: json.metadata,
        });
    }
}
