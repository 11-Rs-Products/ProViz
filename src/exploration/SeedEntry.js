export class SeedEntry {
  constructor({
    id,
    value,
    energy = 1.0,
    coverageCount = 0,
    generation = 0,
    metadata = {}
  } = {}) {
    this.id = id || `seed_${Math.random().toString(36).substring(2, 9)}`;
    this.value = value;
    this.energy = energy;
    this.coverageCount = coverageCount;
    this.generation = generation;
    this.metadata = metadata;
  }

  boostEnergy(amount = 0.5) {
    this.energy += amount;
  }

  decayEnergy(factor = 0.9) {
    this.energy *= factor;
  }

  toJSON() {
    return {
      id: this.id,
      value: this.value,
      energy: this.energy,
      coverageCount: this.coverageCount,
      generation: this.generation,
      metadata: this.metadata
    };
  }
}
