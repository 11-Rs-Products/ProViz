export class ExplorationHealth {
  constructor({
    totalInputsExplored = 0,
    noveltyRate = 0.0,
    coverage = 0.0,
    uncertaintyReductionRate = 0.0
  }) {
    this.totalInputsExplored = totalInputsExplored;
    this.noveltyRate = noveltyRate;
    this.coverage = coverage;
    this.uncertaintyReductionRate = uncertaintyReductionRate;
    Object.freeze(this);
  }

  toJSON() {
    return {
      totalInputsExplored: this.totalInputsExplored,
      noveltyRate: this.noveltyRate,
      coverage: this.coverage,
      uncertaintyReductionRate: this.uncertaintyReductionRate
    };
  }
}
