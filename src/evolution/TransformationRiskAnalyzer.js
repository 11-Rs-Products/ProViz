/**
 * TransformationRiskAnalyzer.js
 * Evaluates comprehensive transformation risk:
 * Risk*(T) = Risk(T) + VerificationCost(T) + RollbackCost(T) + Uncertainty(T)
 */

export class TransformationRiskAnalyzer {
  /**
   * Analyzes baseline and augmented risk for a candidate transformation.
   */
  analyzeRisk(candidate, impactResult, options = {}) {
    const impactScore = impactResult.impactScore || 0.3;
    const failureProbability = options.failureProbability !== undefined ? options.failureProbability : 0.15;
    const baseRisk = failureProbability * impactScore;

    const verificationCost = options.verificationCost !== undefined ? options.verificationCost : 0.05;
    const rollbackCost = options.rollbackCost !== undefined ? options.rollbackCost : 0.05;
    const uncertainty = options.uncertainty !== undefined ? options.uncertainty : (1.0 - (options.confidence || 0.85)) * 0.2;

    const augmentedRisk = Math.min(1.0, baseRisk + verificationCost + rollbackCost + uncertainty);

    return {
      candidateId: candidate.candidateId,
      failureProbability,
      impactScore,
      baseRisk,
      augmentedRisk,
      riskScore: augmentedRisk,
      factors: {
        baseRisk,
        verificationCost,
        rollbackCost,
        uncertainty
      },
      isWithinBudget: (budget = 0.5) => augmentedRisk <= budget
    };
  }
}
