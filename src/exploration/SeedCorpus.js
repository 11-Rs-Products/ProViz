import { SeedEntry } from './SeedEntry.js';

export class SeedCorpus {
  constructor({ entries = [] } = {}) {
    this.entries = entries.map(e => e instanceof SeedEntry ? e : new SeedEntry(e));
  }

  addSeed(value, metadata = {}) {
    const entry = new SeedEntry({ value, metadata });
    this.entries.push(entry);
    return entry;
  }

  size() {
    return this.entries.length;
  }

  getAll() {
    return this.entries;
  }

  toJSON() {
    return {
      size: this.entries.length,
      entries: this.entries.map(e => e.toJSON())
    };
  }
}
