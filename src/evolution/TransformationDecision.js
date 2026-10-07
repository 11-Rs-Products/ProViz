/**
 * TransformationDecision.js
 * Explicit deterministic decision record for accepting, rejecting, or rolling back a transformation.
 */

export const DecisionOutcome = Object.freeze({
  ACCEPT: 'ACCEPT',
  ACCEPT_WITH_WARNINGS: 'ACCEPT_WITH_WARNINGS',
  REQUIRES_MORE_VERIFICATION: 'REQUIRES_MORE_VERIFICATION',
  REJECT: 'REJECT',
  ROLLBACK: 'ROLLBACK',
  INCONCLUSIVE: 'INCONCLUSIVE'
});

export class TransformationDecision {
  /**
   * @param {Object} options
   * @param {string} options.decisionId
   * @param {string} options.candidateId
   * @param {string} options.outcome - DecisionOutcome
   * @param {Array<string>} [options.reasons=[]]
   * @param {Array<string>} [options.evidenceIds=[]]
   * @param {number} [options.confidence=1.0]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    decisionId,
    candidateId,
    outcome = DecisionOutcome.ACCEPT,
    reasons = [],
    evidenceIds = [],
    confidence = 1.0,
    timestamp = Date.now()
  }) {
    if (!decisionId || !candidateId) {
      throw new Error('TransformationDecision requires decisionId and candidateId');
    }

    this.decisionId = decisionId;
    this.candidateId = candidateId;
    this.outcome = outcome;
    this.reasons = Object.freeze([...reasons]);
    this.evidenceIds = Object.freeze([...evidenceIds]);
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 1.0));
    this.timestamp = timestamp;

    Object.freeze(this);
  }

  isApproved() {
    return this.outcome === DecisionOutcome.ACCEPT || this.outcome === DecisionOutcome.ACCEPT_WITH_WARNINGS;
  }

  toJSON() {
    return {
      decisionId: this.decisionId,
      candidateId: this.candidateId,
      outcome: this.outcome,
      reasons: [...this.reasons],
      evidenceIds: [...this.evidenceIds],
      confidence: this.confidence,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new TransformationDecision(json);
  }
}
