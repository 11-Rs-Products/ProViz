import { ConfidenceInterval } from './ConfidenceInterval.js';

export class ProportionEstimator {
  /**
   * Wilson score interval for binomial proportions.
   */
  static estimateWilson(successes, total, level = 0.95) {
    if (total <= 0) {
      return new ConfidenceInterval(0.0, 1.0, level, 0.0);
    }
    const p = successes / total;
    const z = level === 0.99 ? 2.576 : level === 0.90 ? 1.645 : 1.96;
    const z2 = z * z;

    const denominator = 1 + z2 / total;
    const centerAdjusted = p + z2 / (2 * total);
    const rad = Math.sqrt((p * (1 - p) / total) + (z2 / (4 * total * total)));

    const lower = Math.max(0.0, (centerAdjusted - z * rad) / denominator);
    const upper = Math.min(1.0, (centerAdjusted + z * rad) / denominator);

    return new ConfidenceInterval(lower, upper, level, p);
  }
}
