export class ExperimentValue {
  constructor({
    informationGain = 0.5,
    uncertaintyReduction = 0.4,
    riskReduction = 0.5,
    coverageGain = 0.3,
    confidenceGain = 0.4,
    findingResolution = 0.5,
    mutationAdequacyGain = 0.3
  } = {}) {
    this.informationGain = Number(informationGain);
    this.uncertaintyReduction = Number(uncertaintyReduction);
    this.riskReduction = Number(riskReduction);
    this.coverageGain = Number(coverageGain);
    this.confidenceGain = Number(confidenceGain);
    this.findingResolution = Number(findingResolution);
    this.mutationAdequacyGain = Number(mutationAdequacyGain);
    Object.freeze(this);
  }

  getCompositeValue() {
    return (
      this.informationGain * 0.25 +
      this.uncertaintyReduction * 0.20 +
      this.riskReduction * 0.20 +
      this.coverageGain * 0.15 +
      this.confidenceGain * 0.10 +
      this.findingResolution * 0.10
    );
  }

  toJSON() {
    return {
      informationGain: this.informationGain,
      uncertaintyReduction: this.uncertaintyReduction,
      riskReduction: this.riskReduction,
      coverageGain: this.coverageGain,
      confidenceGain: this.confidenceGain,
      findingResolution: this.findingResolution,
      mutationAdequacyGain: this.mutationAdequacyGain
    };
  }
}
