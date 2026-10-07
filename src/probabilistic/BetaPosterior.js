import { ProbabilityInterval } from './ProbabilityInterval.js';
import { ProbabilityEstimate } from './ProbabilityEstimate.js';

export class BetaPosterior {
  constructor(alpha = 1.0, beta = 1.0) {
    this.alpha = Math.max(0.0001, alpha);
    this.beta = Math.max(0.0001, beta);
  }

  update(successes = 0, failures = 0) {
    return new BetaPosterior(this.alpha + successes, this.beta + failures);
  }

  mean() {
    return this.alpha / (this.alpha + this.beta);
  }

  mode() {
    if (this.alpha > 1 && this.beta > 1) {
      return (this.alpha - 1) / (this.alpha + this.beta - 2);
    }
    return this.mean();
  }

  variance() {
    const a = this.alpha;
    const b = this.beta;
    return (a * b) / ((a + b) * (a + b) * (a + b + 1));
  }

  standardDeviation() {
    return Math.sqrt(this.variance());
  }

  credibleInterval(level = 0.95) {
    const m = this.mean();
    const sd = this.standardDeviation();
    const z = level === 0.99 ? 2.576 : level === 0.90 ? 1.645 : 1.96;
    const lower = Math.max(0.0, m - z * sd);
    const upper = Math.min(1.0, m + z * sd);
    return new ProbabilityInterval(lower, upper, m);
  }

  estimate(level = 0.95) {
    const totalSamples = (this.alpha + this.beta) - 2.0;
    const successes = Math.max(0, this.alpha - 1.0);
    const failures = Math.max(0, this.beta - 1.0);
    return new ProbabilityEstimate(this.mean(), this.credibleInterval(level), {
      sampleCount: Math.round(totalSamples),
      successCount: Math.round(successes),
      failureCount: Math.round(failures),
      unknownCount: 0
    });
  }

  sample(randomFn = Math.random) {
    // Marsaglia and Tsang / approximation via normal if large or gamma sampling
    const u = randomFn();
    const m = this.mean();
    const sd = this.standardDeviation();
    // Box-Muller style / normal approximation
    const z = Math.sqrt(-2.0 * Math.log(Math.max(1e-10, u))) * Math.cos(2.0 * Math.PI * randomFn());
    const val = m + z * sd;
    return Math.max(0.0, Math.min(1.0, val));
  }

  toJSON() {
    return {
      type: 'BetaPosterior',
      alpha: this.alpha,
      beta: this.beta,
      mean: this.mean(),
      std: this.standardDeviation(),
      credibleInterval: this.credibleInterval().toJSON()
    };
  }
}
