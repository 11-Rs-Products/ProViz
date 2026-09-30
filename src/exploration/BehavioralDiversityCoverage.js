export class BehavioralDiversityCoverage {
  constructor({ totalClusters = 0, targetClusters = 10 } = {}) {
    this.totalClusters = totalClusters;
    this.targetClusters = targetClusters;
  }

  get score() {
    if (this.targetClusters <= 0) return 1.0;
    return Math.min(1.0, this.totalClusters / this.targetClusters);
  }

  toJSON() {
    return {
      totalClusters: this.totalClusters,
      targetClusters: this.targetClusters,
      score: this.score
    };
  }
}
