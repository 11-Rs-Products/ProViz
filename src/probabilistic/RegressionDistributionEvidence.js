export class RegressionDistributionEvidence {
  constructor({
    metricName,
    baselineValue = 0.0,
    currentValue = 0.0,
    baselineSamples = 0,
    currentSamples = 0,
    shiftMagnitude = 0.0,
    pValue = 1.0,
    isSignificant = false
  }) {
    this.metricName = metricName;
    this.baselineValue = baselineValue;
    this.currentValue = currentValue;
    this.baselineSamples = baselineSamples;
    this.currentSamples = currentSamples;
    this.shiftMagnitude = shiftMagnitude;
    this.pValue = pValue;
    this.isSignificant = isSignificant;
    Object.freeze(this);
  }

  toJSON() {
    return {
      metricName: this.metricName,
      baselineValue: this.baselineValue,
      currentValue: this.currentValue,
      baselineSamples: this.baselineSamples,
      currentSamples: this.currentSamples,
      shiftMagnitude: this.shiftMagnitude,
      pValue: this.pValue,
      isSignificant: this.isSignificant
    };
  }
}
