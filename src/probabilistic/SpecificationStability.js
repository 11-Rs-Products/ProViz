export class SpecificationStability {
  constructor({
    specificationId,
    stabilityScore = 1.0, // 0.0 (erratic) to 1.0 (perfectly stable)
    isStable = true,
    varianceAcrossEnvironments = 0.0
  }) {
    this.specificationId = specificationId;
    this.stabilityScore = stabilityScore;
    this.isStable = isStable;
    this.varianceAcrossEnvironments = varianceAcrossEnvironments;
    Object.freeze(this);
  }

  toJSON() {
    return {
      specificationId: this.specificationId,
      stabilityScore: this.stabilityScore,
      isStable: this.isStable,
      varianceAcrossEnvironments: this.varianceAcrossEnvironments
    };
  }
}
