import { FlakinessScore, FlakinessClassification } from './FlakinessScore.js';

export class FlakyTest {
  constructor({
    testId,
    testName = '',
    flakinessScore,
    evidence = null,
    explanation = ''
  }) {
    this.testId = testId;
    this.testName = testName || testId;
    this.flakinessScore = flakinessScore;
    this.evidence = evidence;
    this.explanation = explanation;
    Object.freeze(this);
  }

  isFlaky() {
    return (
      this.flakinessScore.classification === FlakinessClassification.CONFIRMED_FLAKY ||
      this.flakinessScore.classification === FlakinessClassification.LIKELY_FLAKY ||
      this.flakinessScore.classification === FlakinessClassification.POSSIBLY_FLAKY
    );
  }

  toJSON() {
    return {
      testId: this.testId,
      testName: this.testName,
      flakinessScore: this.flakinessScore.toJSON(),
      evidence: this.evidence ? this.evidence.toJSON() : null,
      explanation: this.explanation
    };
  }
}
