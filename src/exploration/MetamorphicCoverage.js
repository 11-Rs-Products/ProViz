export class MetamorphicCoverage {
  constructor({ validatedRelations = 0, totalRelations = 0, violationsCount = 0 } = {}) {
    this.validatedRelations = validatedRelations;
    this.totalRelations = totalRelations;
    this.violationsCount = violationsCount;
  }

  get score() {
    if (this.totalRelations <= 0) return 1.0;
    return Math.min(1.0, this.validatedRelations / this.totalRelations);
  }

  toJSON() {
    return {
      validatedRelations: this.validatedRelations,
      totalRelations: this.totalRelations,
      violationsCount: this.violationsCount,
      score: this.score
    };
  }
}
