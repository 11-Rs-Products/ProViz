/**
 * VerificationEscalation.js
 * Represents structured human escalation events when autonomous decision requires human intervention.
 */

export class VerificationEscalation {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.reason
   * @param {string} [options.severity='HIGH']
   * @param {Array<Object>} [options.conflictingEvidence=[]]
   * @param {Array<Object>} [options.candidateOptions=[]]
   * @param {string} [options.explanation='']
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    reason,
    severity = 'HIGH',
    conflictingEvidence = [],
    candidateOptions = [],
    explanation = '',
    timestamp = Date.now()
  }) {
    if (!id || !reason) throw new Error('VerificationEscalation requires id and reason');
    this.id = id;
    this.reason = reason;
    this.severity = severity;
    this.conflictingEvidence = Object.freeze([...conflictingEvidence]);
    this.candidateOptions = Object.freeze([...candidateOptions]);
    this.explanation = explanation || reason;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      reason: this.reason,
      severity: this.severity,
      conflictingEvidence: [...this.conflictingEvidence],
      candidateOptions: [...this.candidateOptions],
      explanation: this.explanation,
      timestamp: this.timestamp
    };
  }
}
