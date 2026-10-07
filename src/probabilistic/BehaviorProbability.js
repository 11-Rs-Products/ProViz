import { ProbabilityInterval } from './ProbabilityInterval.js';
import { ConfidenceScale } from './ConfidenceScale.js';

export class BehaviorProbability {
  constructor({
    outcome,
    observedFrequency = 0,
    estimatedProbability = 0.0,
    evidenceCount = 0,
    confidenceInterval = null,
    confidence = ConfidenceScale.UNKNOWN,
    supportingEvidence = [],
    contradictingEvidence = []
  }) {
    this.outcome = outcome;
    this.observedFrequency = observedFrequency;
    this.estimatedProbability = estimatedProbability;
    this.evidenceCount = evidenceCount;
    this.confidenceInterval = confidenceInterval || new ProbabilityInterval(0, 1, estimatedProbability);
    this.confidence = confidence;
    this.supportingEvidence = Object.freeze([...supportingEvidence]);
    this.contradictingEvidence = Object.freeze([...contradictingEvidence]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      outcome: this.outcome ? this.outcome.toJSON() : null,
      observedFrequency: this.observedFrequency,
      estimatedProbability: this.estimatedProbability,
      evidenceCount: this.evidenceCount,
      confidenceInterval: this.confidenceInterval.toJSON(),
      confidence: this.confidence,
      supportingCount: this.supportingEvidence.length,
      contradictingCount: this.contradictingEvidence.length
    };
  }
}
