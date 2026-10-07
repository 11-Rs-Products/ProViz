/**
 * PerformanceDecision.js
 * Explicit operational decision outcome record:
 * MEETS_TARGET, REGRESSION, RESOURCE_VIOLATION, RELIABILITY_FAILURE, INCONCLUSIVE, OPTIMIZATION_REQUIRED, WITHIN_BUDGET.
 */

export const PerformanceDecisionOutcome = Object.freeze({
  MEETS_TARGET: 'MEETS_TARGET',
  REGRESSION: 'REGRESSION',
  RESOURCE_VIOLATION: 'RESOURCE_VIOLATION',
  RELIABILITY_FAILURE: 'RELIABILITY_FAILURE',
  INCONCLUSIVE: 'INCONCLUSIVE',
  OPTIMIZATION_REQUIRED: 'OPTIMIZATION_REQUIRED',
  WITHIN_BUDGET: 'WITHIN_BUDGET'
});

export class PerformanceDecision {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.outcome - PerformanceDecisionOutcome
   * @param {Array<string>} [options.reasons=[]]
   * @param {Array<string>} [options.evidenceIds=[]]
   * @param {number} [options.confidence=1.0]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    outcome = PerformanceDecisionOutcome.MEETS_TARGET,
    reasons = [],
    evidenceIds = [],
    confidence = 1.0,
    timestamp = Date.now()
  }) {
    if (!id) throw new Error('PerformanceDecision requires id');
    this.id = id;
    this.outcome = outcome;
    this.reasons = Object.freeze([...reasons]);
    this.evidenceIds = Object.freeze([...evidenceIds]);
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 1.0));
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  isAcceptable() {
    return this.outcome === PerformanceDecisionOutcome.MEETS_TARGET || this.outcome === PerformanceDecisionOutcome.WITHIN_BUDGET;
  }

  toJSON() {
    return {
      id: this.id,
      outcome: this.outcome,
      reasons: [...this.reasons],
      evidenceIds: [...this.evidenceIds],
      confidence: this.confidence,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new PerformanceDecision(json);
  }
}
