export class StoppingCriterion {
  constructor(name = 'GenericStoppingCriterion') {
    this.name = name;
  }

  isSatisfied(state = {}) {
    return false;
  }

  toJSON() {
    return { name: this.name };
  }
}

export class ConfidenceStoppingCriterion extends StoppingCriterion {
  constructor(targetConfidence = 0.95) {
    super('TARGET_CONFIDENCE');
    this.targetConfidence = targetConfidence;
  }

  isSatisfied(state = {}) {
    return (state.confidenceScore || 0) >= this.targetConfidence;
  }
}

export class CoverageStoppingCriterion extends StoppingCriterion {
  constructor(targetCoverage = 0.90) {
    super('TARGET_COVERAGE');
    this.targetCoverage = targetCoverage;
  }

  isSatisfied(state = {}) {
    return (state.coverage || 0) >= this.targetCoverage;
  }
}

export class StabilityStoppingCriterion extends StoppingCriterion {
  constructor(minSamples = 50, stabilityThreshold = 0.99) {
    super('STABILITY_REACHED');
    this.minSamples = minSamples;
    this.stabilityThreshold = stabilityThreshold;
  }

  isSatisfied(state = {}) {
    return (state.sampleCount || 0) >= this.minSamples && (state.stability || 0) >= this.stabilityThreshold;
  }
}

export class EvidenceStoppingCriterion extends StoppingCriterion {
  constructor(maxSamples = 1000) {
    super('TARGET_SAMPLE_COUNT');
    this.maxSamples = maxSamples;
  }

  isSatisfied(state = {}) {
    return (state.sampleCount || 0) >= this.maxSamples;
  }
}
