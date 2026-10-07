export class OracleHealth {
  constructor({
    totalOracles = 0,
    stableCount = 0,
    uncertainCount = 0,
    flakyCount = 0
  }) {
    this.totalOracles = totalOracles;
    this.stableCount = stableCount;
    this.uncertainCount = uncertainCount;
    this.flakyCount = flakyCount;
    Object.freeze(this);
  }

  toJSON() {
    return {
      totalOracles: this.totalOracles,
      stableCount: this.stableCount,
      uncertainCount: this.uncertainCount,
      flakyCount: this.flakyCount
    };
  }
}
