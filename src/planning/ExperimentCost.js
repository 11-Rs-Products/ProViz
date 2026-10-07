export class ExperimentCost {
  constructor({
    cpuCost = 1.0,
    memoryCost = 1.0,
    memoryCostMb,
    executionCount = 1,
    wallClockEstimateMs = 10,
    environmentalCost = 0.0
  } = {}) {
    this.cpuCost = Number(cpuCost);
    this.memoryCost = Number(memoryCostMb ?? memoryCost);
    this.memoryCostMb = this.memoryCost;
    this.executionCount = Number(executionCount);
    this.wallClockEstimateMs = Number(wallClockEstimateMs);
    this.environmentalCost = Number(environmentalCost);
    Object.freeze(this);
  }

  getCompositeCost() {
    return this.totalCostScore;
  }

  get totalCostScore() {
    return this.cpuCost * 0.4 + (this.wallClockEstimateMs / 100) * 0.4 + this.memoryCost * 0.2;
  }

  toJSON() {
    return {
      cpuCost: this.cpuCost,
      memoryCost: this.memoryCost,
      executionCount: this.executionCount,
      wallClockEstimateMs: this.wallClockEstimateMs,
      environmentalCost: this.environmentalCost,
      totalCostScore: this.totalCostScore
    };
  }
}
