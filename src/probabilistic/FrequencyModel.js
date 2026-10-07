export class FrequencyModel {
  constructor(counts = {}) {
    this.counts = { ...counts };
  }

  observe(item, count = 1) {
    const key = String(item);
    const next = { ...this.counts, [key]: (this.counts[key] || 0) + count };
    return new FrequencyModel(next);
  }

  observeMany(items = []) {
    const next = { ...this.counts };
    for (const item of items) {
      const key = String(item);
      next[key] = (next[key] || 0) + 1;
    }
    return new FrequencyModel(next);
  }

  get total() {
    return Object.values(this.counts).reduce((a, b) => a + b, 0);
  }

  frequency(item) {
    return this.counts[String(item)] || 0;
  }

  relativeFrequency(item) {
    const tot = this.total;
    if (tot === 0) return 0;
    return (this.counts[String(item)] || 0) / tot;
  }

  topK(k = 5) {
    return Object.entries(this.counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([item, count]) => ({ item, count, relativeFrequency: this.relativeFrequency(item) }));
  }

  keys() {
    return Object.keys(this.counts);
  }

  toJSON() {
    return {
      type: 'FrequencyModel',
      counts: { ...this.counts },
      total: this.total
    };
  }
}
