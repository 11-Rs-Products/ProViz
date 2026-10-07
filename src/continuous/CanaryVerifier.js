/**
 * CanaryVerifier.js
 * Runs a rapid canary verification portfolio across highest-risk properties before full execution.
 */

export class CanaryVerifier {
  /**
   * Selects and executes a fast canary verification portfolio.
   * @param {Array<import('./VerificationObligation.js').VerificationObligation>} obligations
   * @param {Object} [options={}]
   * @param {number} [options.maxCanaryCount=3]
   * @param {Function} [options.executor]
   * @returns {{ canaryPassed: boolean, testedCount: number, failures: Array<Object> }}
   */
  runCanary(obligations, { maxCanaryCount = 3, executor = () => ({ success: true }) } = {}) {
    // Sort descending by risk * impact to pick top canary obligations
    const sorted = [...obligations].sort((a, b) => (b.risk * b.impact) - (a.risk * a.impact));
    const canarySet = sorted.slice(0, maxCanaryCount);

    const failures = [];
    for (const obl of canarySet) {
      const res = executor(obl);
      if (!res.success) {
        failures.push({ obligation: obl, result: res });
      }
    }

    return {
      canaryPassed: failures.length === 0,
      testedCount: canarySet.length,
      failures
    };
  }
}
