export class VerificationIteration {
  constructor({
    iterationNumber = 1,
    gapsCount = 0,
    candidatesCount = 0,
    selectedExperiment = null,
    result = null,
    confidenceDelta = 0.0,
    uncertaintyDelta = 0.0,
    timestamp = Date.now()
  }) {
    this.iterationNumber = Number(iterationNumber ?? iteration ?? 1);
    this.iteration = this.iterationNumber;
    this.gapsCount = Number(gapsCount);
    this.candidatesCount = Number(candidatesCount);
    this.selectedExperiment = selectedExperiment;
    this.result = result;
    this.confidenceDelta = Number(confidenceDelta);
    this.uncertaintyDelta = Number(uncertaintyDelta);
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      iterationNumber: this.iterationNumber,
      gapsCount: this.gapsCount,
      candidatesCount: this.candidatesCount,
      selectedExperiment: this.selectedExperiment ? (this.selectedExperiment.toJSON ? this.selectedExperiment.toJSON() : this.selectedExperiment) : null,
      result: this.result ? (this.result.toJSON ? this.result.toJSON() : this.result) : null,
      confidenceDelta: this.confidenceDelta,
      uncertaintyDelta: this.uncertaintyDelta,
      timestamp: this.timestamp
    };
  }
}
