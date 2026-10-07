import { ProbabilityInterval } from './ProbabilityInterval.js';
import { ProbabilityDistribution } from './ProbabilityDistribution.js';

export class GaussianModel extends ProbabilityDistribution {
  constructor(mean = 0.0, variance = 1.0, sampleCount = 0) {
    super('gaussian');
    this.mu = mean;
    this.var = Math.max(1e-10, variance);
    this.sampleCount = sampleCount;
  }

  get mean() {
    return this.mu;
  }

  get variance() {
    return this.var;
  }

  get standardDeviation() {
    return Math.sqrt(this.var);
  }

  pdf(x) {
    const sd = this.standardDeviation;
    const diff = x - this.mu;
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * (diff * diff) / this.var);
  }

  cdf(x) {
    // Error function approximation
    const z = (x - this.mu) / (this.standardDeviation * Math.SQRT2);
    return 0.5 * (1 + this._erf(z));
  }

  _erf(x) {
    // Abramowitz and Stegun formula 7.1.26
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
  }

  update(samples = []) {
    if (samples.length === 0) return this;
    const nNew = samples.length;
    const sumNew = samples.reduce((a, b) => a + b, 0);
    const meanNew = sumNew / nNew;

    if (this.sampleCount === 0) {
      if (nNew === 1) return new GaussianModel(meanNew, 1.0, 1);
      const varNew = samples.reduce((acc, v) => acc + (v - meanNew) * (v - meanNew), 0) / (nNew - 1);
      return new GaussianModel(meanNew, varNew, nNew);
    }

    const totalN = this.sampleCount + nNew;
    const combinedMean = (this.mu * this.sampleCount + sumNew) / totalN;
    const sumSqOld = this.var * (this.sampleCount - 1) + this.sampleCount * (this.mu * this.mu);
    const sumSqNew = samples.reduce((acc, v) => acc + v * v, 0);
    const combinedVar = (sumSqOld + sumSqNew - totalN * combinedMean * combinedMean) / (totalN - 1);

    return new GaussianModel(combinedMean, combinedVar, totalN);
  }

  credibleInterval(level = 0.95) {
    const z = level === 0.99 ? 2.576 : level === 0.90 ? 1.645 : 1.96;
    const sd = this.standardDeviation;
    return new ProbabilityInterval(this.mu - z * sd, this.mu + z * sd, this.mu);
  }

  sample(randomFn = Math.random) {
    const u1 = Math.max(1e-10, randomFn());
    const u2 = randomFn();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return this.mu + z0 * this.standardDeviation;
  }

  toJSON() {
    return {
      type: 'gaussian',
      mean: this.mu,
      variance: this.var,
      std: this.standardDeviation,
      sampleCount: this.sampleCount
    };
  }
}
