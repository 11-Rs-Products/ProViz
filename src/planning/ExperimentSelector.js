import { ExperimentRank } from './ExperimentRank.js';
import { ExperimentUtility } from './ExperimentUtility.js';

export const SelectionPolicy = Object.freeze({
  UNCERTAINTY_FIRST: 'UNCERTAINTY_FIRST',
  RISK_FIRST: 'RISK_FIRST',
  COVERAGE_FIRST: 'COVERAGE_FIRST',
  FINDINGS_FIRST: 'FINDINGS_FIRST',
  MUTATION_FIRST: 'MUTATION_FIRST',
  CONFIDENCE_FIRST: 'CONFIDENCE_FIRST',
  INFORMATION_GAIN: 'INFORMATION_GAIN',
  COST_AWARE: 'COST_AWARE',
  BALANCED: 'BALANCED'
});

export class ExperimentSelector {
  /**
   * Deterministically rank and select candidates.
   */
  static rankCandidates(candidates = [], policy = SelectionPolicy.BALANCED) {
    if (!candidates || candidates.length === 0) return [];

    let weights = {};
    switch (policy) {
      case SelectionPolicy.UNCERTAINTY_FIRST:
        weights = { uncertaintyReductionWeight: 0.60, informationGainWeight: 0.20, riskReductionWeight: 0.10, coverageGainWeight: 0.05, confidenceGainWeight: 0.05, executionCostWeight: 0.02 };
        break;
      case SelectionPolicy.RISK_FIRST:
        weights = { riskReductionWeight: 0.65, findingResolutionWeight: 0.15, uncertaintyReductionWeight: 0.10, informationGainWeight: 0.05, executionCostWeight: 0.05 };
        break;
      case SelectionPolicy.COVERAGE_FIRST:
        weights = { coverageGainWeight: 0.70, informationGainWeight: 0.15, uncertaintyReductionWeight: 0.10, executionCostWeight: 0.05 };
        break;
      case SelectionPolicy.MUTATION_FIRST:
        weights = { mutationAdequacyGainWeight: 0.65, riskReductionWeight: 0.15, informationGainWeight: 0.10, executionCostWeight: 0.10 };
        break;
      case SelectionPolicy.INFORMATION_GAIN:
        weights = { informationGainWeight: 0.70, uncertaintyReductionWeight: 0.20, riskReductionWeight: 0.05, executionCostWeight: 0.05 };
        break;
      case SelectionPolicy.COST_AWARE:
        weights = { executionCostWeight: 0.40, informationGainWeight: 0.25, riskReductionWeight: 0.20, uncertaintyReductionWeight: 0.15 };
        break;
      case SelectionPolicy.CONFIDENCE_FIRST:
        weights = { confidenceGainWeight: 0.60, uncertaintyReductionWeight: 0.20, riskReductionWeight: 0.15, executionCostWeight: 0.05 };
        break;
      case SelectionPolicy.BALANCED:
      default:
        weights = { informationGainWeight: 0.25, uncertaintyReductionWeight: 0.20, riskReductionWeight: 0.25, coverageGainWeight: 0.15, confidenceGainWeight: 0.15, executionCostWeight: 0.05 };
        break;
    }

    const scored = candidates.map(candidate => {
      const u = candidate.utility || ExperimentUtility.computeUtility(candidate.expectedValue, candidate.estimatedCost, weights);
      return {
        candidate,
        utility: u,
        riskRed: candidate.expectedValue.riskReduction,
        infoGain: candidate.expectedValue.informationGain,
        cost: candidate.estimatedCost.totalCostScore || candidate.estimatedCost.wallClockEstimateMs,
        id: candidate.experiment.id
      };
    });

    // Deterministic tie-breaking rules:
    // 1. highest utility
    // 2. highest risk reduction
    // 3. highest information gain
    // 4. lowest cost
    // 5. canonical experiment ID
    scored.sort((a, b) => {
      if (Math.abs(b.utility - a.utility) > 1e-6) return b.utility - a.utility;
      if (Math.abs(b.riskRed - a.riskRed) > 1e-6) return b.riskRed - a.riskRed;
      if (Math.abs(b.infoGain - a.infoGain) > 1e-6) return b.infoGain - a.infoGain;
      if (Math.abs(a.cost - b.cost) > 1e-6) return a.cost - b.cost;
      return String(a.id).localeCompare(String(b.id));
    });

    return scored.map((item, idx) => {
      return new ExperimentRank({
        candidate: item.candidate,
        rank: idx + 1,
        score: item.utility,
        policy,
        reasons: [`Utility score ${item.utility.toFixed(4)} evaluated under ${policy} policy.`]
      });
    });
  }

  static selectNext(candidates = [], policy = SelectionPolicy.BALANCED) {
    const ranks = this.rankCandidates(candidates, policy);
    return ranks.length > 0 ? ranks[0].candidate : null;
  }
}
