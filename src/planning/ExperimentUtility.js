import { ExperimentValue } from './ExperimentValue.js';
import { ExperimentCost } from './ExperimentCost.js';

export class ExperimentUtility {
  /**
   * Deterministic utility calculation:
   * utility = w_info * info + w_u * u_red + w_risk * risk_red + w_cov * cov_gain + w_conf * conf_gain - w_cost * cost
   */
  static computeUtility(value, cost, weights = {}) {
    const val = value instanceof ExperimentValue ? value : new ExperimentValue(value);
    const c = cost instanceof ExperimentCost ? cost : new ExperimentCost(cost);

    const wInfo = weights.informationGainWeight ?? 0.25;
    const wUncertainty = weights.uncertaintyReductionWeight ?? 0.20;
    const wRisk = weights.riskReductionWeight ?? 0.25;
    const wCoverage = weights.coverageGainWeight ?? 0.15;
    const wConfidence = weights.confidenceGainWeight ?? 0.15;
    const wCost = weights.executionCostWeight ?? 0.05;

    const utility =
      wInfo * val.informationGain +
      wUncertainty * val.uncertaintyReduction +
      wRisk * val.riskReduction +
      wCoverage * val.coverageGain +
      wConfidence * val.confidenceGain -
      wCost * (c.totalCostScore || c.wallClockEstimateMs / 100 || 0.1);

    return Number(utility);
  }
}
