/**
 * RegressionFinding — Auditable report of a behavioral regression or validated change.
 */

import { REGRESSION_CLASSIFICATIONS } from './RegressionClassification.js';

export class RegressionFinding {
    /**
     * @param {object} params
     * @param {string} [params.id=null]
     * @param {string} [params.classification=REGRESSION_CLASSIFICATIONS.NO_REGRESSION]
     * @param {string} params.testId
     * @param {Array<object>} [params.sourceLocations=[]]
     * @param {Array<string>} [params.changedEntities=[]]
     * @param {Array<string>} [params.impactedEntities=[]]
     * @param {object|null} [params.baselineObservation=null]
     * @param {object|null} [params.changedObservation=null]
     * @param {object|null} [params.behavioralDelta=null]
     * @param {object|null} [params.expectation=null]
     * @param {Array<string|object>} [params.evidence=[]]
     * @param {string} [params.confidence='HIGH_CONFIDENCE']
     * @param {string} [params.explanation='']
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        classification = REGRESSION_CLASSIFICATIONS.NO_REGRESSION,
        testId,
        sourceLocations = [],
        changedEntities = [],
        impactedEntities = [],
        baselineObservation = null,
        changedObservation = null,
        behavioralDelta = null,
        expectation = null,
        evidence = [],
        confidence = 'HIGH_CONFIDENCE',
        explanation = '',
        metadata = {},
    } = {}) {
        if (!testId) throw new Error('RegressionFinding requires testId');
        this.classification = classification;
        this.testId = String(testId);
        this.sourceLocations = Object.freeze([...sourceLocations]);
        this.changedEntities = Object.freeze([...changedEntities].sort());
        this.impactedEntities = Object.freeze([...impactedEntities].sort());
        this.baselineObservation = baselineObservation ? Object.freeze({ ...baselineObservation }) : null;
        this.changedObservation = changedObservation ? Object.freeze({ ...changedObservation }) : null;
        this.behavioralDelta = behavioralDelta ? Object.freeze({ ...behavioralDelta }) : null;
        this.expectation = expectation ? Object.freeze({ ...expectation }) : null;
        this.evidence = Object.freeze([...evidence]);
        this.confidence = confidence;
        this.explanation = String(explanation || '');
        this.metadata = Object.freeze({ ...metadata });

        const hashInput = JSON.stringify({
            testId: this.testId,
            class: this.classification,
            delta: this.behavioralDelta,
            changed: this.changedEntities,
            impacted: this.impactedEntities,
        });

        this.id = id || `regression_${RegressionFinding.computeHash(hashInput)}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            id: this.id,
            classification: this.classification,
            testId: this.testId,
            sourceLocations: [...this.sourceLocations],
            changedEntities: [...this.changedEntities],
            impactedEntities: [...this.impactedEntities],
            baselineObservation: this.baselineObservation,
            changedObservation: this.changedObservation,
            behavioralDelta: this.behavioralDelta,
            expectation: this.expectation,
            evidence: [...this.evidence],
            confidence: this.confidence,
            explanation: this.explanation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RegressionFinding(json);
    }
}
