/**
 * DependencyRiskAnalyzer.js
 * Computes evidence-backed dependency risk based on Centrality, ChangeFrequency, FailureImpact, and VerificationSensitivity.
 * Formula:
 * DependencyRisk(n) = Centrality(n) * ChangeFrequency(n) * FailureImpact(n) * VerificationSensitivity(n)
 */

import { DependencyCentralityAnalyzer } from './DependencyCentralityAnalyzer.js';

export class DependencyRiskAnalyzer {
  constructor() {
    this.centralityAnalyzer = new DependencyCentralityAnalyzer();
  }

  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   * @param {Object} [options]
   * @param {Map<string, number>|Object} [options.changeFrequencies={}] - Normalized [0, 1] or counts
   * @param {Map<string, number>|Object} [options.failureImpacts={}] - Normalized [0, 1]
   * @param {Map<string, number>|Object} [options.verificationSensitivities={}] - Normalized [0, 1]
   */
  analyze(graph, options = {}) {
    const { changeFrequencies = {}, failureImpacts = {}, verificationSensitivities = {} } = options;
    const centralityResult = this.centralityAnalyzer.analyze(graph);

    const getVal = (dict, key, def) => {
      if (dict instanceof Map) return dict.has(key) ? dict.get(key) : def;
      return dict[key] !== undefined ? dict[key] : def;
    };

    const risks = [];

    for (const item of centralityResult.centralities) {
      const centrality = item.centrality || 0.1;
      const changeFreq = Math.min(1.0, Math.max(0.01, getVal(changeFrequencies, item.id, 0.1)));
      const failureImpact = Math.min(1.0, Math.max(0.01, getVal(failureImpacts, item.id, 0.5)));
      const verifSens = Math.min(1.0, Math.max(0.01, getVal(verificationSensitivities, item.id, 0.5)));

      const riskScore = centrality * changeFreq * failureImpact * verifSens;

      risks.push({
        id: item.id,
        centrality,
        changeFrequency: changeFreq,
        failureImpact,
        verificationSensitivity: verifSens,
        dependencyRisk: riskScore,
        isHighRisk: riskScore > 0.05
      });
    }

    risks.sort((a, b) => b.dependencyRisk - a.dependencyRisk);

    return {
      timestamp: Date.now(),
      totalAnalyzed: risks.length,
      highRiskCount: risks.filter(r => r.isHighRisk).length,
      risks,
      topRisks: risks.slice(0, 10)
    };
  }
}
