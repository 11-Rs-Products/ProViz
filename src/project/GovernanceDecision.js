/**
 * GovernanceDecision.js
 * Result of governance evaluation: PASSED, CONDITIONALLY_PASSED, or BLOCKED.
 */

import { GovernanceViolation } from './GovernanceViolation.js';

export const DecisionOutcome = Object.freeze({
  PASSED: 'PASSED',
  CONDITIONALLY_PASSED: 'CONDITIONALLY_PASSED',
  BLOCKED: 'BLOCKED'
});

export class GovernanceDecision {
  /**
   * @param {Object} options
   * @param {string} options.policySetVersion
   * @param {string} options.outcome - 'PASSED' | 'CONDITIONALLY_PASSED' | 'BLOCKED'
   * @param {GovernanceViolation[]} [options.violations=[]]
   * @param {string[]} [options.blockingReasons=[]]
   * @param {Object} [options.summary={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    policySetVersion,
    outcome,
    violations = [],
    blockingReasons = [],
    summary = {},
    timestamp = Date.now()
  }) {
    this.policySetVersion = policySetVersion;
    this.outcome = outcome;
    this.violations = Object.freeze(violations.map(v => v instanceof GovernanceViolation ? v : new GovernanceViolation(v)));
    this.blockingReasons = Object.freeze([...blockingReasons]);
    this.summary = Object.freeze({ ...summary });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  get isPassed() {
    return this.outcome === DecisionOutcome.PASSED;
  }

  get isBlocked() {
    return this.outcome === DecisionOutcome.BLOCKED;
  }

  toJSON() {
    return {
      policySetVersion: this.policySetVersion,
      outcome: this.outcome,
      isPassed: this.isPassed,
      isBlocked: this.isBlocked,
      violations: this.violations.map(v => v.toJSON()),
      blockingReasons: [...this.blockingReasons],
      summary: this.summary,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new GovernanceDecision({
      policySetVersion: json.policySetVersion,
      outcome: json.outcome,
      violations: (json.violations || []).map(v => GovernanceViolation.fromJSON(v)),
      blockingReasons: json.blockingReasons,
      summary: json.summary,
      timestamp: json.timestamp
    });
  }
}
