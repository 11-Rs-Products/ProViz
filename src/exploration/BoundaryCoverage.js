export class BoundaryCoverage {
  constructor({ testedBoundaries = 0, totalBoundaries = 0 } = {}) {
    this.testedBoundaries = testedBoundaries;
    this.totalBoundaries = totalBoundaries;
  }

  get score() {
    if (this.totalBoundaries <= 0) return 1.0;
    return Math.min(1.0, this.testedBoundaries / this.totalBoundaries);
  }

  toJSON() {
    return {
      testedBoundaries: this.testedBoundaries,
      totalBoundaries: this.totalBoundaries,
      score: this.score
    };
  }
}
