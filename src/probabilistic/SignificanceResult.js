export class SignificanceResult {
  constructor({
    testName = '',
    statistic = 0.0,
    pValue = 1.0,
    isSignificant = false,
    alpha = 0.05,
    effectSize = 0.0,
    explanation = ''
  }) {
    this.testName = testName;
    this.statistic = statistic;
    this.pValue = pValue;
    this.isSignificant = isSignificant;
    this.alpha = alpha;
    this.effectSize = effectSize;
    this.explanation = explanation;
    Object.freeze(this);
  }

  toJSON() {
    return {
      testName: this.testName,
      statistic: this.statistic,
      pValue: this.pValue,
      isSignificant: this.isSignificant,
      alpha: this.alpha,
      effectSize: this.effectSize,
      explanation: this.explanation
    };
  }
}
