/**
 * ProbabilityModel — Orchestrator holding priors, observations, posteriors, and intervals.
 */

import { ProbabilityEstimate } from './ProbabilityEstimate.js';
import { ProbabilityInterval } from './ProbabilityInterval.js';

export class ProbabilityModel {
    constructor({
        modelId = null,
        subject = 'default',
        modelType = 'bernoulli',
        estimate = null,
        prior = null,
        posterior = null,
        metadata = {},
    } = {}) {
        this.modelId = modelId || `pm_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
        this.subject = String(subject);
        this.modelType = modelType;
        this.estimate = estimate instanceof ProbabilityEstimate
            ? estimate
            : (estimate ? new ProbabilityEstimate(estimate) : new ProbabilityEstimate());
        this.prior = prior ? Object.freeze({ ...prior }) : null;
        this.posterior = posterior ? Object.freeze({ ...posterior }) : null;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            modelId: this.modelId,
            subject: this.subject,
            modelType: this.modelType,
            estimate: this.estimate.toJSON(),
            prior: this.prior,
            posterior: this.posterior,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ProbabilityModel({
            ...json,
            estimate: ProbabilityEstimate.fromJSON(json.estimate),
        });
    }
}
