import { ProbabilityInterval } from './ProbabilityInterval.js';

export class DirichletPosterior {
  constructor(alphas = {}) {
    this.alphas = {};
    for (const [k, v] of Object.entries(alphas)) {
      this.alphas[k] = Math.max(0.0001, v);
    }
  }

  get categories() {
    return Object.keys(this.alphas);
  }

  alphaSum() {
    return Object.values(this.alphas).reduce((acc, v) => acc + v, 0);
  }

  update(counts = {}) {
    const next = { ...this.alphas };
    for (const [k, v] of Object.entries(counts)) {
      next[k] = (next[k] || 1.0) + v;
    }
    return new DirichletPosterior(next);
  }

  mean() {
    const sum = this.alphaSum();
    if (sum === 0) return {};
    const res = {};
    for (const [k, v] of Object.entries(this.alphas)) {
      res[k] = v / sum;
    }
    return res;
  }

  marginalBeta(category) {
    const a = this.alphas[category] || 1.0;
    const b = Math.max(0.0001, this.alphaSum() - a);
    const mean = a / (a + b);
    const variance = (a * b) / ((a + b) * (a + b) * (a + b + 1));
    const sd = Math.sqrt(variance);
    const lower = Math.max(0.0, mean - 1.96 * sd);
    const upper = Math.min(1.0, mean + 1.96 * sd);
    return {
      mean,
      variance,
      std: sd,
      interval: new ProbabilityInterval(lower, upper, mean)
    };
  }

  sample(randomFn = Math.random) {
    // Generate gamma variates approximation for each alpha
    const means = this.mean();
    const categories = this.categories;
    const weights = {};
    let total = 0;
    for (const cat of categories) {
      const alpha = this.alphas[cat];
      // Gamma approx
      const u = Math.max(1e-10, randomFn());
      const g = -Math.log(u) * alpha;
      weights[cat] = g;
      total += g;
    }
    if (total === 0) return means;
    const normalized = {};
    for (const cat of categories) {
      normalized[cat] = weights[cat] / total;
    }
    return normalized;
  }

  toJSON() {
    return {
      type: 'DirichletPosterior',
      alphas: { ...this.alphas },
      mean: this.mean(),
      alphaSum: this.alphaSum()
    };
  }
}
