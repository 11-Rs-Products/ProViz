export class ExpectedInformationGain {
  constructor({
    experimentId,
    targetSubject,
    expectedInformationGain = 0.0, // in bits / nats
    priorEntropy = 1.0,
    expectedPosteriorEntropy = 0.5
  }) {
    this.experimentId = experimentId;
    this.targetSubject = targetSubject;
    this.expectedInformationGain = expectedInformationGain;
    this.priorEntropy = priorEntropy;
    this.expectedPosteriorEntropy = expectedPosteriorEntropy;
    Object.freeze(this);
  }

  toJSON() {
    return {
      experimentId: this.experimentId,
      targetSubject: this.targetSubject,
      expectedInformationGain: this.expectedInformationGain,
      priorEntropy: this.priorEntropy,
      expectedPosteriorEntropy: this.expectedPosteriorEntropy
    };
  }
}
