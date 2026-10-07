/**
 * MetricDistribution.js
 * Statistical distribution representing tail metrics, percentiles, variance, and bounds.
 */

export class MetricDistribution {
  /**
   * Calculates a full distribution from an array of numeric samples.
   * @param {Array<number>} samples
   * @param {string} [unit='ms']
   */
  constructor(samples = [], unit = 'ms') {
    this.unit = unit;
    this.sampleCount = samples.length;

    if (samples.length === 0) {
      this.mean = 0;
      this.median = 0;
      this.variance = 0;
      this.stdDev = 0;
      this.min = 0;
      this.max = 0;
      this.p50 = 0;
      this.p90 = 0;
      this.p95 = 0;
      this.p99 = 0;
      this.p99_9 = 0;
      Object.freeze(this);
      return;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    this.mean = sum / sorted.length;

    const varianceSum = sorted.reduce((acc, v) => acc + Math.pow(v - this.mean, 2), 0);
    this.variance = varianceSum / sorted.length;
    this.stdDev = Math.sqrt(this.variance);

    this.min = sorted[0];
    this.max = sorted[sorted.length - 1];

    const getPercentile = (p) => {
      const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
      return sorted[idx];
    };

    this.median = getPercentile(50);
    this.p50 = this.median;
    this.p90 = getPercentile(90);
    this.p95 = getPercentile(95);
    this.p99 = getPercentile(99);
    this.p99_9 = getPercentile(99.9);

    Object.freeze(this);
  }

  toJSON() {
    return {
      sampleCount: this.sampleCount,
      unit: this.unit,
      mean: this.mean,
      median: this.median,
      variance: this.variance,
      stdDev: this.stdDev,
      min: this.min,
      max: this.max,
      p50: this.p50,
      p90: this.p90,
      p95: this.p95,
      p99: this.p99,
      p99_9: this.p99_9
    };
  }

  static fromJSON(json) {
    const dist = Object.create(MetricDistribution.prototype);
    Object.assign(dist, json);
    return Object.freeze(dist);
  }
}
