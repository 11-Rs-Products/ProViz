export class StrategyPerformance {
  constructor({
    strategyName = 'BALANCED',
    totalRuns = 0,
    successRate = 1.0,
    avgInformationGain = 0.5,
    avgCostMs = 10,
    avgConfidenceGain = 0.4,
    avgRiskReduction = 0.4
  } = {}) {
    this.strategyName = strategyName;
    this.totalRuns = Number(totalRuns);
    this.successRate = Number(successRate);
    this.avgInformationGain = Number(avgInformationGain);
    this.avgCostMs = Number(avgCostMs);
    this.avgConfidenceGain = Number(avgConfidenceGain);
    this.avgRiskReduction = Number(avgRiskReduction);
    Object.freeze(this);
  }

  toJSON() {
    return {
      strategyName: this.strategyName,
      totalRuns: this.totalRuns,
      successRate: this.successRate,
      avgInformationGain: this.avgInformationGain,
      avgCostMs: this.avgCostMs,
      avgConfidenceGain: this.avgConfidenceGain,
      avgRiskReduction: this.avgRiskReduction
    };
  }
}
