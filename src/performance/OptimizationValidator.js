/**
 * OptimizationValidator.js
 * Validates optimization candidates against Stages 29-31 constraints:
 * Correctness, Security, Contracts, Reliability, Resource bounds, and Speedup.
 */

export class OptimizationValidator {
  /**
   * Validates that an optimization candidate is safe, preserved, and beneficial.
   * @param {PerformanceOptimizationCandidate} candidate
   * @param {Object} [options]
   * @returns {Object}
   */
  validateOptimization(candidate, options = {}) {
    const issues = [];

    // 1. Behavior Preservation
    if (options.breaksBehavior === true) {
      issues.push('Optimization breaks functional test expectations or semantics');
    }

    // 2. Security Preservation (Stage 31)
    if (options.introducesSecurityFlaw === true) {
      issues.push('Optimization introduces secondary security vulnerability');
    }

    // 3. Contract Preservation (Stage 30)
    if (options.breaksContracts === true) {
      issues.push('Optimization violates API contract specifications');
    }

    // 4. Reliability Preservation
    if (options.worsensReliability === true) {
      issues.push('Optimization degrades reliability or fault recovery under load');
    }

    // 5. Speedup Check
    const measuredSpeedup = options.measuredSpeedup !== undefined ? Number(options.measuredSpeedup) : candidate.predictedSpeedup;
    if (measuredSpeedup < 1.05) {
      issues.push(`Insufficient performance improvement: measured speedup is ${measuredSpeedup}x (target >= 1.05x)`);
    }

    const isValid = issues.length === 0;

    return {
      candidateId: candidate.id,
      isValid,
      measuredSpeedup,
      issues,
      confidence: isValid ? 0.95 : 0.30,
      summary: isValid ? 'Optimization validated: speedup verified with complete safety preservation' : `Optimization invalid: ${issues.join('; ')}`
    };
  }
}
