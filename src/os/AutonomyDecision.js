/**
 * AutonomyDecision.js
 * Explicit evaluation outcome determining whether an operation is AUTONOMOUSLY_ALLOWED, REQUIRES_HUMAN_APPROVAL, or PROHIBITED.
 */

export const AutonomyOutcome = Object.freeze({
  ALLOWED: 'ALLOWED',
  REQUIRES_HUMAN_APPROVAL: 'REQUIRES_HUMAN_APPROVAL',
  PROHIBITED: 'PROHIBITED'
});

export class AutonomyDecision {
  /**
   * @param {Object} options
   * @param {string} options.operation
   * @param {string} options.outcome - from AutonomyOutcome
   * @param {string} options.reason
   * @param {string} [options.requiredAutonomyLevel]
   * @param {string} [options.currentAutonomyLevel]
   */
  constructor({
    operation,
    outcome,
    reason,
    requiredAutonomyLevel = 'LEVEL_3_AUTO_REPAIR',
    currentAutonomyLevel = 'LEVEL_3_AUTO_REPAIR'
  }) {
    this.operation = operation;
    this.outcome = outcome;
    this.reason = reason;
    this.requiredAutonomyLevel = requiredAutonomyLevel;
    this.currentAutonomyLevel = currentAutonomyLevel;
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  get isAllowed() {
    return this.outcome === AutonomyOutcome.ALLOWED;
  }

  get requiresHumanApproval() {
    return this.outcome === AutonomyOutcome.REQUIRES_HUMAN_APPROVAL;
  }

  toJSON() {
    return {
      operation: this.operation,
      outcome: this.outcome,
      isAllowed: this.isAllowed,
      requiresHumanApproval: this.requiresHumanApproval,
      reason: this.reason,
      requiredAutonomyLevel: this.requiredAutonomyLevel,
      currentAutonomyLevel: this.currentAutonomyLevel,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new AutonomyDecision(json);
  }
}
