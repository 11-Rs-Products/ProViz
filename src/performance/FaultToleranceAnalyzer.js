/**
 * FaultToleranceAnalyzer.js
 * Verifies whether system recovers safely from faults, retries appropriately, and preserves data invariants without cascading failures.
 */

export class FaultToleranceAnalyzer {
  /**
   * Evaluates fault tolerance from injection results.
   * @param {Array<Object>} injectionResults
   * @returns {Object}
   */
  evaluateFaultTolerance(injectionResults = []) {
    if (!injectionResults || injectionResults.length === 0) {
      return { isFaultTolerant: true, handledRatio: 1.0, summary: 'No faults evaluated' };
    }

    const unhandled = injectionResults.filter(r => !r.isHandled || !r.invariantsPreserved);
    const isFaultTolerant = unhandled.length === 0;
    const handledRatio = (injectionResults.length - unhandled.length) / injectionResults.length;

    return {
      isFaultTolerant,
      totalFaults: injectionResults.length,
      handledCount: injectionResults.length - unhandled.length,
      unhandledCount: unhandled.length,
      handledRatio,
      unhandledFaults: unhandled,
      summary: isFaultTolerant ? 'System demonstrates robust fault tolerance' : `Fault tolerance failure: ${unhandled.length} unhandled faults`
    };
  }
}
