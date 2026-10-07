export const FlakinessClassification = Object.freeze({
  STABLE: 'STABLE',
  POSSIBLY_FLAKY: 'POSSIBLY_FLAKY',
  LIKELY_FLAKY: 'LIKELY_FLAKY',
  CONFIRMED_FLAKY: 'CONFIRMED_FLAKY',
  UNKNOWN: 'UNKNOWN'
});

export class FlakinessScore {
  constructor({
    score = 0.0, // 0.0 (perfectly stable) to 1.0 (highly flaky)
    classification = FlakinessClassification.UNKNOWN,
    passRate = 1.0,
    failRate = 0.0,
    switchCount = 0,
    totalRuns = 0
  }) {
    this.score = score;
    this.classification = classification;
    this.passRate = passRate;
    this.failRate = failRate;
    this.switchCount = switchCount;
    this.totalRuns = totalRuns;
    Object.freeze(this);
  }

  toJSON() {
    return {
      score: this.score,
      classification: this.classification,
      passRate: this.passRate,
      failRate: this.failRate,
      switchCount: this.switchCount,
      totalRuns: this.totalRuns
    };
  }
}
