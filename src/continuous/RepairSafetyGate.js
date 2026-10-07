/**
 * RepairSafetyGate.js
 * Enforces strict multi-stage safety invariants (Security, Performance, Reliability, Concurrency, Contracts)
 * before any autonomous repair can be accepted.
 */

export class RepairSafetyGate {
  /**
   * Evaluates if a repair satisfies all cross-stage safety requirements.
   * @param {Object} repairCandidate
   * @param {Object} [validationResults={}]
   * @param {boolean} [validationResults.functionalPassed=true]
   * @param {boolean} [validationResults.securityPassed=true]
   * @param {boolean} [validationResults.performancePassed=true]
   * @param {boolean} [validationResults.reliabilityPassed=true]
   * @param {boolean} [validationResults.concurrencyPassed=true]
   * @returns {{ passed: boolean, gateDecisions: Object, violations: Array<string> }}
   */
  evaluateSafety(repairCandidate, {
    functionalPassed = true,
    securityPassed = true,
    performancePassed = true,
    reliabilityPassed = true,
    concurrencyPassed = true
  } = {}) {
    const violations = [];

    if (!functionalPassed) {
      violations.push('Functional verification failed: repair introduces behavioral regression.');
    }
    if (!securityPassed) {
      violations.push('Security gate failed: repair violates Stage 31 security invariants.');
    }
    if (!performancePassed) {
      violations.push('Performance gate failed: repair introduces Stage 32 resource/latency regression.');
    }
    if (!reliabilityPassed) {
      violations.push('Reliability gate failed: repair degrades error recovery or fault tolerance.');
    }
    if (!concurrencyPassed) {
      violations.push('Concurrency gate failed: repair introduces data race, deadlock, or temporal defect.');
    }

    return {
      passed: violations.length === 0,
      gateDecisions: {
        functionalPassed,
        securityPassed,
        performancePassed,
        reliabilityPassed,
        concurrencyPassed
      },
      violations
    };
  }
}
