/**
 * RecoveryAnalyzer.js
 * Measures Mean Time To Recovery (MTTR) and recovery correctness after injected or empirical failures.
 */

export class RecoveryAnalyzer {
  /**
   * Calculates MTTR and recovery stats from failure injection runs.
   * @param {Array<Object>} injectionResults
   * @returns {Object}
   */
  measureRecovery(injectionResults = []) {
    const recovered = injectionResults.filter(r => r.recovered && r.recoveryDurationMs > 0);
    if (recovered.length === 0) {
      return {
        mttrMs: 0,
        recoverySuccessRate: 1.0,
        recoveredCount: 0,
        summary: 'No recovery events recorded'
      };
    }

    const totalMs = recovered.reduce((acc, r) => acc + r.recoveryDurationMs, 0);
    const mttrMs = totalMs / recovered.length;
    const recoverySuccessRate = recovered.length / injectionResults.length;

    return {
      mttrMs: Math.round(mttrMs * 10) / 10,
      recoverySuccessRate,
      recoveredCount: recovered.length,
      summary: `Mean Time To Recovery (MTTR): ${mttrMs.toFixed(1)}ms across ${recovered.length} recovered failures`
    };
  }
}
