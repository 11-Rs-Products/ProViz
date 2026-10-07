export class ExplorationValue {
  constructor({
    candidateInput,
    targetSubject,
    expectedNovelty = 0.0,
    expectedCoverageGain = 0.0,
    expectedUncertaintyReduction = 0.0,
    expectedMutationDiscrimination = 0.0,
    overallValue = 0.0,
    rationale = ''
  }) {
    this.candidateInput = candidateInput;
    this.targetSubject = targetSubject;
    this.expectedNovelty = expectedNovelty;
    this.expectedCoverageGain = expectedCoverageGain;
    this.expectedUncertaintyReduction = expectedUncertaintyReduction;
    this.expectedMutationDiscrimination = expectedMutationDiscrimination;
    this.overallValue = overallValue;
    this.rationale = rationale;
    Object.freeze(this);
  }

  toJSON() {
    return {
      candidateInput: this.candidateInput,
      targetSubject: this.targetSubject,
      expectedNovelty: this.expectedNovelty,
      expectedCoverageGain: this.expectedCoverageGain,
      expectedUncertaintyReduction: this.expectedUncertaintyReduction,
      expectedMutationDiscrimination: this.expectedMutationDiscrimination,
      overallValue: this.overallValue,
      rationale: this.rationale
    };
  }
}
