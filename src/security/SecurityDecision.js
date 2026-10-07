/**
 * SecurityDecision.js
 * Explicit security outcome decision record.
 */

export const SecurityDecisionOutcome = Object.freeze({
  SECURE_WITHIN_SCOPE: 'SECURE_WITHIN_SCOPE',
  VULNERABLE: 'VULNERABLE',
  MITIGATION_REQUIRED: 'MITIGATION_REQUIRED',
  INCONCLUSIVE: 'INCONCLUSIVE',
  ASSUMPTION_VIOLATED: 'ASSUMPTION_VIOLATED',
  REQUIRES_MORE_ANALYSIS: 'REQUIRES_MORE_ANALYSIS'
});

export class SecurityDecision {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.outcome - SecurityDecisionOutcome
   * @param {Array<string>} [options.reasons=[]]
   * @param {Array<string>} [options.evidenceIds=[]]
   * @param {Array<string>} [options.counterexampleIds=[]]
   * @param {number} [options.confidence=1.0]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    outcome = SecurityDecisionOutcome.SECURE_WITHIN_SCOPE,
    reasons = [],
    evidenceIds = [],
    counterexampleIds = [],
    confidence = 1.0,
    timestamp = Date.now()
  }) {
    if (!id) throw new Error('SecurityDecision requires id');
    this.id = id;
    this.outcome = outcome;
    this.reasons = Object.freeze([...reasons]);
    this.evidenceIds = Object.freeze([...evidenceIds]);
    this.counterexampleIds = Object.freeze([...counterexampleIds]);
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 1.0));
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  isSecure() {
    return this.outcome === SecurityDecisionOutcome.SECURE_WITHIN_SCOPE;
  }

  toJSON() {
    return {
      id: this.id,
      outcome: this.outcome,
      reasons: [...this.reasons],
      evidenceIds: [...this.evidenceIds],
      counterexampleIds: [...this.counterexampleIds],
      confidence: this.confidence,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new SecurityDecision(json);
  }
}
