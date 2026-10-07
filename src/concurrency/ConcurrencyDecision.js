/**
 * ConcurrencyDecision.js
 * Explicit verification outcomes for concurrency, temporal, and distributed analysis.
 */

export const ConcurrencyDecisionKind = Object.freeze({
  VERIFIED: 'VERIFIED',
  RACE_DETECTED: 'RACE_DETECTED',
  DEADLOCK_DETECTED: 'DEADLOCK_DETECTED',
  LIVENESS_VIOLATION: 'LIVENESS_VIOLATION',
  TEMPORAL_VIOLATION: 'TEMPORAL_VIOLATION',
  CONSISTENCY_VIOLATION: 'CONSISTENCY_VIOLATION',
  ATOMICITY_VIOLATION: 'ATOMICITY_VIOLATION',
  FAULT_TOLERANCE_FAILURE: 'FAULT_TOLERANCE_FAILURE',
  SCHEDULE_SPACE_EXHAUSTED: 'SCHEDULE_SPACE_EXHAUSTED',
  INCONCLUSIVE: 'INCONCLUSIVE'
});

export class ConcurrencyDecision {
  /**
   * @param {Object} options
   * @param {string} options.kind
   * @param {boolean} options.passed
   * @param {string} [options.summary='']
   * @param {Array<Object>} [options.findings=[]]
   * @param {Object} [options.bounds={}]
   * @param {Array<string>} [options.assumptions=[]]
   */
  constructor({
    kind,
    passed,
    summary = '',
    findings = [],
    bounds = {},
    assumptions = []
  }) {
    this.kind = kind;
    this.passed = passed;
    this.summary = summary;
    this.findings = Object.freeze([...findings]);
    this.bounds = Object.freeze({ ...bounds });
    this.assumptions = Object.freeze([...assumptions]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      kind: this.kind,
      passed: this.passed,
      summary: this.summary,
      findingsCount: this.findings.length,
      findings: [...this.findings],
      bounds: { ...this.bounds },
      assumptions: [...this.assumptions]
    };
  }
}
