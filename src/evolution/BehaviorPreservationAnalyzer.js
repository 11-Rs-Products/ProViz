/**
 * BehaviorPreservationAnalyzer.js
 * Analyzes whether observable program behavior is preserved across transformations.
 * Integrates symbolic execution, test suite executions, and concolic feedback.
 */

export class BehaviorPreservationAnalyzer {
  /**
   * Evaluates behavioral preservation between original and transformed variants.
   */
  evaluate(candidate, originalModel, transformedModel, options = {}) {
    const testResults = options.testResults || [];
    const symbolicProof = options.symbolicProof || null;
    const concolicResult = options.concolicResult || null;

    const failedTests = testResults.filter(t => !t.passed);
    const hasDivergence = failedTests.length > 0 || (concolicResult && concolicResult.diverged);

    let confidence = 0.85;
    let isPreserved = true;
    const evidence = [];

    if (symbolicProof && symbolicProof.equivalent) {
      confidence = 0.99;
      evidence.push('SMT formal proof confirmed input-output semantic equivalence');
    } else if (hasDivergence) {
      confidence = 0.95;
      isPreserved = false;
      evidence.push(`Behavioral divergence detected in ${failedTests.length} tests or concolic execution`);
    } else if (testResults.length > 0) {
      confidence = Math.min(0.95, Math.round((0.75 + (testResults.length * 0.05)) * 100) / 100);
      evidence.push(`${testResults.length} regression tests executed with 100% pass rate`);
    } else {
      confidence = 0.50;
      evidence.push('No tests executed: preservation remains empirically unvalidated');
    }

    return {
      candidateId: candidate.candidateId,
      isPreserved,
      confidence,
      hasFormalProof: Boolean(symbolicProof?.equivalent),
      divergenceDetected: hasDivergence,
      evidence
    };
  }
}
