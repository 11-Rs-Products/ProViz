/**
 * GovernanceViolation.js
 * Explicit record of an unmet governance rule with full evidence and affected scope.
 */

export class GovernanceViolation {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.policyId
   * @param {string} options.ruleId
   * @param {string} options.ruleKind
   * @param {string} [options.severity='ERROR'] - 'INFO' | 'WARN' | 'ERROR' | 'BLOCKER'
   * @param {string} options.targetScope
   * @param {string} options.message
   * @param {Object} [options.evidence={}]
   */
  constructor({
    id,
    policyId,
    ruleId,
    ruleKind,
    severity = 'ERROR',
    targetScope,
    message,
    evidence = {}
  }) {
    if (!policyId || !ruleId || !targetScope) {
      throw new Error('GovernanceViolation requires policyId, ruleId, and targetScope');
    }
    this.id = id || `GOV_VIOLATION_${ruleId}_${Date.now()}`;
    this.policyId = policyId;
    this.ruleId = ruleId;
    this.ruleKind = ruleKind;
    this.severity = severity;
    this.targetScope = targetScope;
    this.message = message;
    this.evidence = Object.freeze({ ...evidence });
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      policyId: this.policyId,
      ruleId: this.ruleId,
      ruleKind: this.ruleKind,
      severity: this.severity,
      targetScope: this.targetScope,
      message: this.message,
      evidence: { ...this.evidence },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new GovernanceViolation(json);
  }
}
