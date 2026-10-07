export class EarlyStoppingPolicy {
  constructor({
    stopOnCounterexample = true,
    stopOnConfidenceTarget = true,
    targetConfidence = 0.95,
    minObservations = 20,
    maxObservations = 5000
  } = {}) {
    this.stopOnCounterexample = stopOnCounterexample;
    this.stopOnConfidenceTarget = stopOnConfidenceTarget;
    this.targetConfidence = targetConfidence;
    this.minObservations = minObservations;
    this.maxObservations = maxObservations;
    Object.freeze(this);
  }

  shouldStop(state = {}) {
    if (this.stopOnCounterexample && (state.counterexamplesCount || 0) > 0) {
      return { stop: true, reason: 'COUNTEREXAMPLE_FOUND' };
    }
    if ((state.sampleCount || 0) >= this.maxObservations) {
      return { stop: true, reason: 'MAX_OBSERVATIONS_REACHED' };
    }
    if (
      this.stopOnConfidenceTarget &&
      (state.sampleCount || 0) >= this.minObservations &&
      (state.confidenceScore || 0) >= this.targetConfidence
    ) {
      return { stop: true, reason: 'TARGET_CONFIDENCE_REACHED' };
    }
    return { stop: false, reason: '' };
  }

  toJSON() {
    return {
      stopOnCounterexample: this.stopOnCounterexample,
      stopOnConfidenceTarget: this.stopOnConfidenceTarget,
      targetConfidence: this.targetConfidence,
      minObservations: this.minObservations,
      maxObservations: this.maxObservations
    };
  }
}
