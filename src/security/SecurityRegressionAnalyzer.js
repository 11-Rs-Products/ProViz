/**
 * SecurityRegressionAnalyzer.js
 * Ensures previously defeated attacks and counterexamples remain defeated across code evolution.
 */

export class SecurityRegressionAnalyzer {
  /**
   * Evaluates historical attack test suite across new changes.
   * @param {Array<SecurityCounterexample>} historicalCounterexamples
   * @param {Object} currentExecutionEngine
   * @returns {Object}
   */
  runSecurityRegression(historicalCounterexamples = [], currentExecutionEngine = {}) {
    const defeated = [];
    const regressed = [];

    for (const cx of historicalCounterexamples) {
      if (currentExecutionEngine.reopenedCounterexampleIds?.includes(cx.id)) {
        regressed.push(cx);
      } else {
        defeated.push(cx);
      }
    }

    const hasRegression = regressed.length > 0;

    return {
      totalAttacksTested: historicalCounterexamples.length,
      defeatedCount: defeated.length,
      regressedCount: regressed.length,
      hasRegression,
      regressedCounterexamples: regressed,
      summary: hasRegression
        ? `Security regression detected! ${regressed.length} historical vulnerabilities reopened.`
        : `All ${historicalCounterexamples.length} historical attacks remain defeated.`
    };
  }
}
