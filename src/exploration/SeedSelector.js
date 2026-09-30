export class SeedSelector {
  constructor({ strategy = 'ENERGY_WEIGHTED' } = {}) {
    this.strategy = strategy;
  }

  select(corpus, randomFunc = Math.random) {
    if (!corpus || corpus.size() === 0) return null;
    const entries = corpus.getAll();

    if (this.strategy === 'UNIFORM') {
      const idx = Math.floor(randomFunc() * entries.length);
      return entries[idx];
    }

    // Energy weighted selection
    const totalEnergy = entries.reduce((sum, e) => sum + Math.max(0.01, e.energy), 0);
    let threshold = randomFunc() * totalEnergy;
    for (const entry of entries) {
      threshold -= Math.max(0.01, entry.energy);
      if (threshold <= 0) return entry;
    }

    return entries[entries.length - 1];
  }
}
