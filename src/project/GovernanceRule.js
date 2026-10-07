/**
 * GovernanceRule.js
 * Atomic governance check asserting evidence, contract, security, or architecture requirements.
 */

export const GovernanceRuleKind = Object.freeze({
  NO_DEPENDENCY_CYCLES: 'NO_DEPENDENCY_CYCLES',
  NO_FORBIDDEN_ARCHITECTURE_EDGES: 'NO_FORBIDDEN_ARCHITECTURE_EDGES',
  PUBLIC_APIS_REQUIRE_CONTRACTS: 'PUBLIC_APIS_REQUIRE_CONTRACTS',
  SECURITY_PATHS_REQUIRE_VERIFICATION: 'SECURITY_PATHS_REQUIRE_VERIFICATION',
  PERFORMANCE_SENSITIVE_REQUIRE_EVIDENCE: 'PERFORMANCE_SENSITIVE_REQUIRE_EVIDENCE',
  CONCURRENCY_REQUIRE_SCHEDULE_EXPLORATION: 'CONCURRENCY_REQUIRE_SCHEDULE_EXPLORATION',
  HIGH_RISK_REQUIRE_APPROVAL: 'HIGH_RISK_REQUIRE_APPROVAL',
  NO_STALE_CRITICAL_EVIDENCE: 'NO_STALE_CRITICAL_EVIDENCE'
});

export class GovernanceRule {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {string} options.kind
   * @param {string} [options.severity='ERROR'] - 'INFO' | 'WARN' | 'ERROR' | 'BLOCKER'
   * @param {Object} [options.params={}]
   * @param {boolean} [options.enabled=true]
   */
  constructor({
    id,
    name,
    kind,
    severity = 'ERROR',
    params = {},
    enabled = true
  }) {
    if (!id || !name || !kind) throw new Error('GovernanceRule requires id, name, and kind');
    this.id = id;
    this.name = name;
    this.kind = kind;
    this.severity = severity;
    this.params = Object.freeze({ ...params });
    this.enabled = Boolean(enabled);
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      severity: this.severity,
      params: { ...this.params },
      enabled: this.enabled
    };
  }

  static fromJSON(json) {
    return new GovernanceRule(json);
  }
}
