import { SignificanceResult } from './SignificanceResult.js';
import { EffectSize } from './EffectSize.js';

export class HypothesisTest {
  /**
   * Two-proportion z-test to determine if p1 and p2 are significantly different.
   */
  static twoProportionZTest(s1, n1, s2, n2, alpha = 0.05) {
    if (n1 === 0 || n2 === 0) {
      return new SignificanceResult({
        testName: 'Two-Proportion Z-Test',
        statistic: 0,
        pValue: 1.0,
        isSignificant: false,
        alpha,
        effectSize: 0,
        explanation: 'Insufficient samples for test'
      });
    }

    const p1 = s1 / n1;
    const p2 = s2 / n2;
    const pPool = (s1 + s2) / (n1 + n2);
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

    if (se === 0) {
      return new SignificanceResult({
        testName: 'Two-Proportion Z-Test',
        statistic: 0,
        pValue: 1.0,
        isSignificant: false,
        alpha,
        effectSize: 0,
        explanation: 'Zero standard error (identical constant observations)'
      });
    }

    const z = (p1 - p2) / se;
    // Two-tailed p-value approximation via standard normal erf
    const absZ = Math.abs(z);
    const pValue = 2.0 * (1.0 - this._standardNormalCdf(absZ));
    const isSig = pValue < alpha;
    const h = EffectSize.cohensH(p1, p2);

    return new SignificanceResult({
      testName: 'Two-Proportion Z-Test',
      statistic: z,
      pValue: Math.max(0.0, Math.min(1.0, pValue)),
      isSignificant: isSig,
      alpha,
      effectSize: h,
      explanation: isSig
        ? `Statistically significant difference detected (z=${z.toFixed(2)}, p=${pValue.toExponential(2)}, effect=${h.toFixed(2)})`
        : `No statistically significant difference (z=${z.toFixed(2)}, p=${pValue.toFixed(4)})`
    });
  }

  static _standardNormalCdf(x) {
    // erf formula
    const t = 1.0 / (1.0 + 0.2316419 * x);
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return 1.0 - p;
  }
}
