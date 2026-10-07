import { ProbabilityDistribution } from './ProbabilityDistribution.js';
import { ProbabilityInterval } from './ProbabilityInterval.js';

export class EmpiricalDistribution extends ProbabilityDistribution {
  constructor(samples = []) {
    super('empirical');
    this.samples = [...samples];
    this._sorted = null;
  }

  addSample(val) {
    if (typeof val !== 'number' || isNaN(val)) return this;
    const nextSamples = [...this.samples, val];
    return new EmpiricalDistribution(nextSamples);
  }

  addSamples(vals) {
    const valid = vals.filter(v => typeof v === 'number' && !isNaN(v));
    return new EmpiricalDistribution([...this.samples, ...valid]);
  }

  get count() {
    return this.samples.length;
  }

  get sorted() {
    if (!this._sorted) {
      this._sorted = [...this.samples].sort((a, b) => a - b);
    }
    return this._sorted;
  }

  mean() {
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((acc, v) => acc + v, 0);
    return sum / this.samples.length;
  }

  variance() {
    if (this.samples.length < 2) return 0;
    const m = this.mean();
    const sumSq = this.samples.reduce((acc, v) => acc + (v - m) * (v - m), 0);
    return sumSq / (this.samples.length - 1);
  }

  standardDeviation() {
    return Math.sqrt(this.variance());
  }

  percentile(p) {
    if (this.samples.length === 0) return 0;
    if (p <= 0) return this.sorted[0];
    if (p >= 100) return this.sorted[this.sorted.length - 1];
    const rank = (p / 100) * (this.sorted.length - 1);
    const low = Math.floor(rank);
    const high = Math.ceil(rank);
    const weight = rank - low;
    if (low === high) return this.sorted[low];
    return this.sorted[low] * (1 - weight) + this.sorted[high] * weight;
  }

  median() {
    return this.percentile(50);
  }

  quantile(q) {
    return this.percentile(q * 100);
  }

  credibleInterval(level = 0.95) {
    if (this.samples.length === 0) return new ProbabilityInterval(0, 0, 0);
    const alpha = (1 - level) / 2;
    const low = this.quantile(alpha);
    const high = this.quantile(1 - alpha);
    return new ProbabilityInterval(low, high, this.median());
  }

  sample(randomFn = Math.random) {
    if (this.samples.length === 0) return 0;
    const idx = Math.floor(randomFn() * this.samples.length);
    return this.samples[idx];
  }

  toJSON() {
    return {
      type: 'empirical',
      count: this.count,
      mean: this.mean(),
      std: this.standardDeviation(),
      median: this.median(),
      p5: this.percentile(5),
      p95: this.percentile(95),
      samples: this.samples
    };
  }
}
