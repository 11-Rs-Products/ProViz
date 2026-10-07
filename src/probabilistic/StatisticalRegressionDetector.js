import { StatisticalRegression } from './StatisticalRegression.js';
import { RegressionDistributionEvidence } from './RegressionDistributionEvidence.js';
import { RegressionProbability } from './RegressionProbability.js';
import { HypothesisTest } from './HypothesisTest.js';
import { ProbabilityInterval } from './ProbabilityInterval.js';

export class StatisticalRegressionDetector {
  /**
   * Detects exception rate increase regression between baseline and current runs.
   * e.g. baseline 0.2% (2/1000) vs current 4.7% (47/1000)
   */
  static detectExceptionRateRegression(subject, baselineExceptions, baselineTotal, currentExceptions, currentTotal, alpha = 0.05) {
    const testResult = HypothesisTest.twoProportionZTest(
      currentExceptions,
      currentTotal,
      baselineExceptions,
      baselineTotal,
      alpha
    );

    const pBase = baselineTotal > 0 ? baselineExceptions / baselineTotal : 0;
    const pCurr = currentTotal > 0 ? currentExceptions / currentTotal : 0;
    const isIncreased = pCurr > pBase && testResult.isSignificant;

    const evidence = new RegressionDistributionEvidence({
      metricName: 'exception_rate',
      baselineValue: pBase,
      currentValue: pCurr,
      baselineSamples: baselineTotal,
      currentSamples: currentTotal,
      shiftMagnitude: pCurr - pBase,
      pValue: testResult.pValue,
      isSignificant: testResult.isSignificant
    });

    const probScore = isIncreased ? Math.min(1.0, 1.0 - testResult.pValue) : 0.0;
    const severity = pCurr > 0.1 ? 'CRITICAL' : pCurr > 0.03 ? 'HIGH' : 'MEDIUM';

    const probability = new RegressionProbability({
      probability: probScore,
      interval: new ProbabilityInterval(Math.max(0, probScore - 0.05), Math.min(1, probScore + 0.05), probScore),
      severity
    });

    if (isIncreased) {
      return new StatisticalRegression({
        subject,
        type: 'EXCEPTION_RATE_INCREASE',
        evidence,
        probability,
        explanation: `Statistically significant exception rate regression detected: ${(pBase * 100).toFixed(2)}% -> ${(pCurr * 100).toFixed(2)}% (p=${testResult.pValue.toExponential(2)})`
      });
    }

    return null;
  }
}
