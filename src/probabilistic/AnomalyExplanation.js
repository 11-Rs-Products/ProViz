export class AnomalyExplanation {
  constructor({
    baseline = '',
    observedBehavior = '',
    difference = '',
    evidence = null,
    confidence = 'HIGH'
  }) {
    this.baseline = baseline;
    this.observedBehavior = observedBehavior;
    this.difference = difference;
    this.evidence = evidence;
    this.confidence = confidence;
    Object.freeze(this);
  }

  toJSON() {
    return {
      baseline: this.baseline,
      observedBehavior: this.observedBehavior,
      difference: this.difference,
      evidence: this.evidence ? (this.evidence.toJSON ? this.evidence.toJSON() : this.evidence) : null,
      confidence: this.confidence
    };
  }
}
