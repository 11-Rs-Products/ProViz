export class LearningObservation {
  constructor({
    experimentKind,
    targetGapKind,
    predictedValue = 0.5,
    actualValue = 0.5,
    costMs = 10,
    confidenceChange = 0.0,
    uncertaintyReduction = 0.0,
    timestamp = Date.now()
  }) {
    this.experimentKind = experimentKind;
    this.targetGapKind = targetGapKind;
    this.predictedValue = Number(predictedValue);
    this.actualValue = Number(actualValue);
    this.costMs = Number(costMs);
    this.confidenceChange = Number(confidenceChange);
    this.uncertaintyReduction = Number(uncertaintyReduction);
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      experimentKind: this.experimentKind,
      targetGapKind: this.targetGapKind,
      predictedValue: this.predictedValue,
      actualValue: this.actualValue,
      costMs: this.costMs,
      confidenceChange: this.confidenceChange,
      uncertaintyReduction: this.uncertaintyReduction,
      timestamp: this.timestamp
    };
  }
}
