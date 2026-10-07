export class NumericOutlierDetector {
  /**
   * IQR (Interquartile Range) based outlier detection.
   */
  static detectIQR(samples = [], k = 1.5) {
    if (samples.length < 4) return { outliers: [], lowerBound: 0, upperBound: 0 };
    const sorted = [...samples].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - k * iqr;
    const upperBound = q3 + k * iqr;

    const outliers = samples.filter(v => v < lowerBound || v > upperBound);
    return { outliers, lowerBound, upperBound };
  }

  /**
   * Z-Score based outlier detection.
   */
  static detectZScore(samples = [], threshold = 3.0) {
    if (samples.length < 3) return { outliers: [] };
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / (samples.length - 1);
    const sd = Math.sqrt(variance);
    if (sd === 0) return { outliers: [] };

    const outliers = samples.filter(v => Math.abs((v - mean) / sd) >= threshold);
    return { outliers, mean, std: sd };
  }
}
