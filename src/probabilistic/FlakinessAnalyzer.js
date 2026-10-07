import { FlakinessScore, FlakinessClassification } from './FlakinessScore.js';
import { FlakyTest } from './FlakyTest.js';
import { FlakinessEvidence } from './FlakinessEvidence.js';

export class FlakinessAnalyzer {
  /**
   * Analyzes a series of test run outcomes (e.g. ['PASS', 'PASS', 'FAIL', 'PASS']).
   */
  static analyze(testId, runOutcomes = [], environmentFactors = []) {
    if (!runOutcomes || runOutcomes.length === 0) {
      return new FlakyTest({
        testId,
        flakinessScore: new FlakinessScore({
          score: 0.0,
          classification: FlakinessClassification.UNKNOWN,
          totalRuns: 0
        }),
        explanation: 'No run outcomes recorded.'
      });
    }

    let passCount = 0;
    let failCount = 0;
    let switchCount = 0;

    for (let i = 0; i < runOutcomes.length; i++) {
      const outcome = String(runOutcomes[i]).toUpperCase();
      if (outcome === 'PASS' || outcome === 'TRUE' || outcome === 'SUCCESS') {
        passCount++;
      } else {
        failCount++;
      }

      if (i > 0) {
        const prev = String(runOutcomes[i - 1]).toUpperCase();
        const prevPass = prev === 'PASS' || prev === 'TRUE' || prev === 'SUCCESS';
        const currPass = outcome === 'PASS' || outcome === 'TRUE' || outcome === 'SUCCESS';
        if (prevPass !== currPass) {
          switchCount++;
        }
      }
    }

    const totalRuns = runOutcomes.length;
    const passRate = passCount / totalRuns;
    const failRate = failCount / totalRuns;

    // A test is flaky if it has both passes and fails across identical runs
    const isIntermittent = passCount > 0 && failCount > 0;
    let score = 0.0;
    let classification = FlakinessClassification.STABLE;

    if (isIntermittent) {
      // Flakiness score scales with flip rate and balance between pass/fail
      const balance = 1.0 - Math.abs(passRate - failRate);
      const flipRate = totalRuns > 1 ? switchCount / (totalRuns - 1) : 0;
      score = Math.min(1.0, 0.5 * balance + 0.5 * flipRate);

      if (totalRuns >= 5 && switchCount >= 2) {
        classification = FlakinessClassification.CONFIRMED_FLAKY;
      } else if (totalRuns >= 3) {
        classification = FlakinessClassification.LIKELY_FLAKY;
      } else {
        classification = FlakinessClassification.POSSIBLY_FLAKY;
      }
    } else {
      score = 0.0;
      classification = FlakinessClassification.STABLE;
    }

    const evidence = new FlakinessEvidence({
      testId,
      testRunResults: runOutcomes,
      environmentFactors
    });

    const flakinessScore = new FlakinessScore({
      score,
      classification,
      passRate,
      failRate,
      switchCount,
      totalRuns
    });

    return new FlakyTest({
      testId,
      flakinessScore,
      evidence,
      explanation: isIntermittent
        ? `Test exhibits intermittent outcomes (${passCount} pass, ${failCount} fail, ${switchCount} flips across ${totalRuns} runs)`
        : `Test is stable across ${totalRuns} runs (${passCount > 0 ? 'always passing' : 'always failing'})`
    });
  }
}
