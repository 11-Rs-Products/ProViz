/**
 * RefactoringPlanner.js
 * Evaluates candidate utility and creates sequenced TransformationPlans using:
 * Utility(T) = Benefit(T) - Risk(T) - Cost(T) - VerificationCost(T)
 */

import { TransformationPlan } from './TransformationPlan.js';

export class RefactoringPlanner {
  /**
   * Calculates net utility for a candidate transformation.
   */
  calculateUtility(candidate, options = {}) {
    const benefit = options.benefit !== undefined ? options.benefit : (candidate.predictedImpact?.estimatedSpeedup ? 0.8 : 0.6);
    const risk = candidate.predictedRisk?.riskScore !== undefined ? candidate.predictedRisk.riskScore : 0.2;
    const cost = options.cost !== undefined ? options.cost : 0.1;
    const verificationCost = options.verificationCost !== undefined ? options.verificationCost : 0.1;

    const utility = benefit - risk - cost - verificationCost;
    return {
      candidateId: candidate.candidateId,
      utility,
      factors: { benefit, risk, cost, verificationCost }
    };
  }

  /**
   * Plans and sequences transformations to achieve a set of goals.
   */
  createPlan(goals, candidates, options = {}) {
    const scored = candidates.map(c => ({
      candidate: c,
      eval: this.calculateUtility(c, options)
    }));

    // Sort descending by utility, deterministic tie-breaker by candidateId
    scored.sort((a, b) => b.eval.utility - a.eval.utility || a.candidate.candidateId.localeCompare(b.candidate.candidateId));

    const selectedTransformations = scored.map(s => s.candidate.transformation);
    const planId = `plan:${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return new TransformationPlan({
      planId,
      goals: goals.map(g => g.id || g),
      transformations: selectedTransformations,
      checkpoints: [`cp:init_${planId}`],
      acceptancePolicy: options.acceptancePolicy || { minConfidence: 0.85 }
    });
  }
}
