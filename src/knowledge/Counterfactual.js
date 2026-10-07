/**
 * Represents a counterfactual verification hypothesis and simulated outcome
 */
export class Counterfactual {
  constructor({
    hypothesisId,
    targetEntityId,
    changedAssumption = '',
    observedOutcome = {},
    counterfactualOutcome = {},
    affectedEvidence = [],
    confidence = 0.9,
    timestamp = Date.now(),
    metadata = {}
  } = {}) {
    this.hypothesisId = hypothesisId || `cf-${Math.random().toString(36).slice(2, 9)}`;
    this.targetEntityId = targetEntityId;
    this.changedAssumption = changedAssumption;
    this.observedOutcome = Object.freeze({ ...observedOutcome });
    this.counterfactualOutcome = Object.freeze({ ...counterfactualOutcome });
    this.affectedEvidence = Object.freeze([...new Set(affectedEvidence)]);
    this.confidence = Math.max(0, Math.min(1, confidence));
    this.timestamp = timestamp;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      hypothesisId: this.hypothesisId,
      targetEntityId: this.targetEntityId,
      changedAssumption: this.changedAssumption,
      observedOutcome: { ...this.observedOutcome },
      counterfactualOutcome: { ...this.counterfactualOutcome },
      affectedEvidence: [...this.affectedEvidence],
      confidence: this.confidence,
      timestamp: this.timestamp,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new Counterfactual(json);
  }
}
