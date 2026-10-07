import { StrategyPerformance } from './StrategyPerformance.js';

export class StrategyLearner {
  constructor() {
    this.performances = new Map(); // strategyName -> StrategyPerformance
  }

  recordRun(strategyName, result = {}) {
    const prev = this.performances.get(strategyName) || new StrategyPerformance({ strategyName, totalRuns: 0 });
    const n = prev.totalRuns + 1;

    const success = result.success ? 1 : 0;
    const nextSuccessRate = (prev.successRate * prev.totalRuns + success) / n;
    const nextInfoGain = (prev.avgInformationGain * prev.totalRuns + (result.informationGain || 0.5)) / n;
    const nextCost = (prev.avgCostMs * prev.totalRuns + (result.executionCostMs || 10)) / n;
    const nextConf = (prev.avgConfidenceGain * prev.totalRuns + (result.confidenceDelta || 0)) / n;

    const updated = new StrategyPerformance({
      strategyName,
      totalRuns: n,
      successRate: nextSuccessRate,
      avgInformationGain: nextInfoGain,
      avgCostMs: nextCost,
      avgConfidenceGain: nextConf,
      avgRiskReduction: prev.avgRiskReduction
    });

    this.performances.set(strategyName, updated);
    return updated;
  }

  getPerformance(strategyName) {
    return this.performances.get(strategyName) || new StrategyPerformance({ strategyName, totalRuns: 0 });
  }

  getAllPerformances() {
    return Array.from(this.performances.values());
  }

  toJSON() {
    return this.getAllPerformances().map(p => p.toJSON());
  }
}
