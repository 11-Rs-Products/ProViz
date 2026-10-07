export class FlakinessEvidence {
  constructor({
    testId,
    testRunResults = [], // Array of boolean/string PASS/FAIL
    environmentFactors = [],
    timingVariance = 0.0,
    orderDependenceDetected = false,
    timestamp = Date.now()
  }) {
    this.testId = testId;
    this.testRunResults = Object.freeze([...testRunResults]);
    this.environmentFactors = Object.freeze([...environmentFactors]);
    this.timingVariance = timingVariance;
    this.orderDependenceDetected = orderDependenceDetected;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      testId: this.testId,
      runCount: this.testRunResults.length,
      environmentFactors: this.environmentFactors,
      timingVariance: this.timingVariance,
      orderDependenceDetected: this.orderDependenceDetected,
      timestamp: this.timestamp
    };
  }
}
