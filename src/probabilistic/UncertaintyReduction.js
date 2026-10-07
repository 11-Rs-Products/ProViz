export class UncertaintyReduction {
  constructor({
    target,
    priorUncertainty = 1.0,
    expectedPosteriorUncertainty = 0.5,
    reduction = 0.5
  }) {
    this.target = target;
    this.priorUncertainty = priorUncertainty;
    this.expectedPosteriorUncertainty = expectedPosteriorUncertainty;
    this.reduction = reduction;
    Object.freeze(this);
  }

  toJSON() {
    return {
      target: this.target,
      priorUncertainty: this.priorUncertainty,
      expectedPosteriorUncertainty: this.expectedPosteriorUncertainty,
      reduction: this.reduction
    };
  }
}
