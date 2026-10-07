/**
 * ProbabilityEstimate — Quantified estimate with sample count, intervals, and provenance.
 */

import { ProbabilityInterval } from './ProbabilityInterval.js';

export class ProbabilityEstimate {
    constructor({
        point = 0.5,
        interval = null,
        sampleCount = 0,
        successCount = 0,
        failureCount = 0,
        unknownCount = 0,
        confidence = 'MEDIUM',
    } = {}) {
        this.point = Math.max(0, Math.min(1, Number(point) || 0));
        this.sampleCount = Number(sampleCount) || 0;
        this.successCount = Number(successCount) || 0;
        this.failureCount = Number(failureCount) || 0;
        this.unknownCount = Number(unknownCount) || 0;
        this.confidence = confidence;

        this.interval = interval instanceof ProbabilityInterval
            ? interval
            : (interval ? new ProbabilityInterval(interval) : new ProbabilityInterval({ point: this.point }));

        Object.freeze(this);
    }

    toJSON() {
        return {
            point: this.point,
            interval: this.interval.toJSON(),
            sampleCount: this.sampleCount,
            successCount: this.successCount,
            failureCount: this.failureCount,
            unknownCount: this.unknownCount,
            confidence: this.confidence,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ProbabilityEstimate({
            ...json,
            interval: ProbabilityInterval.fromJSON(json.interval),
        });
    }
}
