/**
 * ChangeRiskAnalyzer.js
 * Analyzes risk factors including mutation sensitivity, dependency count,
 * specification drift, coupling metrics, and evidence freshness.
 */

import { ChangeRiskModel } from './ChangeRiskModel.js';
import { CouplingMetrics } from './CouplingMetrics.js';

export class ChangeRiskAnalyzer {
  analyzeRisk(impactResult, programGraph, options = {}) {
    const { change, impactScore, breakdown } = impactResult;

    const coupling = CouplingMetrics.calculate(change.targetId, programGraph);

    // 1. Estimate P(semantic failure | C)
    const historicalFailRate = options.historicalFailRate !== undefined ? options.historicalFailRate : 0.25;
    const mutationSensitivity = options.mutationSensitivity !== undefined ? options.mutationSensitivity : 0.60;
    const specUncertainty = breakdown.specificationImpact || 0.3;
    const dependencyFactor = Math.min(1.0, (coupling.fanIn + coupling.fanOut) / 10);
    const instability = coupling.instability;

    const failureProbability = Math.min(1.0, (
      (historicalFailRate * 0.25) +
      (mutationSensitivity * 0.25) +
      (specUncertainty * 0.25) +
      (instability * 0.25)
    ));

    // Risk(C) = P(failure | C) * Impact(C)
    const riskScore = failureProbability * impactScore;

    return new ChangeRiskModel({
      changeId: change.id,
      failureProbability,
      impactScore,
      riskScore,
      riskFactors: {
        historicalFailRate,
        mutationSensitivity,
        specUncertainty,
        dependencyFactor,
        instability,
        couplingFanIn: coupling.fanIn,
        couplingFanOut: coupling.fanOut
      }
    });
  }
}
