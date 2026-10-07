export class EffectSize {
  /**
   * Cohen's d for comparing two sample means.
   */
  static cohensD(mean1, var1, n1, mean2, var2, n2) {
    if (n1 < 2 || n2 < 2) return 0.0;
    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const pooledSd = Math.sqrt(Math.max(1e-10, pooledVar));
    return (mean1 - mean2) / pooledSd;
  }

  /**
   * Cohen's h for comparing two proportions.
   */
  static cohensH(p1, p2) {
    const phi1 = 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, p1))));
    const phi2 = 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, p2))));
    return Math.abs(phi1 - phi2);
  }
}
