import { ProbabilityDistribution } from './ProbabilityDistribution.js';

export class HistogramModel extends ProbabilityDistribution {
  constructor(bins = [], counts = [], min = 0, max = 1) {
    super('histogram');
    this.bins = [...bins];
    this.counts = [...counts];
    this.min = min;
    this.max = max;
  }

  static fromData(samples = [], numBins = 10) {
    if (samples.length === 0) {
      return new HistogramModel([0, 1], [0], 0, 1);
    }
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const range = max === min ? 1.0 : max - min;
    const binWidth = range / numBins;

    const bins = [];
    for (let i = 0; i <= numBins; i++) {
      bins.push(min + i * binWidth);
    }

    const counts = new Array(numBins).fill(0);
    for (const s of samples) {
      let idx = Math.floor((s - min) / binWidth);
      if (idx >= numBins) idx = numBins - 1;
      if (idx < 0) idx = 0;
      counts[idx]++;
    }

    return new HistogramModel(bins, counts, min, max);
  }

  get totalCount() {
    return this.counts.reduce((a, b) => a + b, 0);
  }

  probability(index) {
    const total = this.totalCount;
    if (total === 0 || index < 0 || index >= this.counts.length) return 0;
    return this.counts[index] / total;
  }

  density(x) {
    if (x < this.min || x > this.max) return 0;
    const numBins = this.counts.length;
    const binWidth = (this.max - this.min) / numBins;
    if (binWidth === 0) return 0;
    let idx = Math.floor((x - this.min) / binWidth);
    if (idx >= numBins) idx = numBins - 1;
    if (idx < 0) idx = 0;
    const prob = this.probability(idx);
    return prob / binWidth;
  }

  toJSON() {
    return {
      type: 'histogram',
      bins: this.bins,
      counts: this.counts,
      min: this.min,
      max: this.max,
      totalCount: this.totalCount
    };
  }
}
