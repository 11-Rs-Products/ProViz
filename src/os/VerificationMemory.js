/**
 * VerificationMemory.js
 * Persistent, immutable memory bank of past findings, counterexamples, repairs, certificates, and historical decisions.
 */

export class VerificationMemoryEntry {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.category - 'FINDING' | 'REPAIR' | 'COUNTEREXAMPLE' | 'CERTIFICATE' | 'DECISION'
   * @param {string} options.scope
   * @param {Object} options.data
   * @param {Object} [options.provenance={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    id,
    category,
    scope,
    data,
    provenance = {},
    timestamp = Date.now()
  }) {
    if (!id || !category || !data) throw new Error('VerificationMemoryEntry requires id, category, and data');
    this.id = id;
    this.category = category;
    this.scope = scope || 'global';
    this.data = Object.freeze({ ...data });
    this.provenance = Object.freeze({ ...provenance });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      category: this.category,
      scope: this.scope,
      data: this.data,
      provenance: this.provenance,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new VerificationMemoryEntry(json);
  }
}

export class VerificationMemory {
  constructor() {
    /** @type {Map<string, VerificationMemoryEntry>} */
    this._entries = new Map();
    /** @type {Map<string, Set<string>>} */
    this._byCategory = new Map();
    /** @type {Map<string, Set<string>>} */
    this._byScope = new Map();
  }

  record(entryData) {
    const entry = entryData instanceof VerificationMemoryEntry ? entryData : new VerificationMemoryEntry(entryData);
    this._entries.set(entry.id, entry);

    if (!this._byCategory.has(entry.category)) {
      this._byCategory.set(entry.category, new Set());
    }
    this._byCategory.get(entry.category).add(entry.id);

    if (!this._byScope.has(entry.scope)) {
      this._byScope.set(entry.scope, new Set());
    }
    this._byScope.get(entry.scope).add(entry.id);

    return entry;
  }

  getEntry(id) {
    return this._entries.get(id) || null;
  }

  getByCategory(category) {
    const ids = this._byCategory.get(category);
    if (!ids) return [];
    return Array.from(ids).map(id => this._entries.get(id)).filter(Boolean);
  }

  getByScope(scope) {
    const ids = this._byScope.get(scope);
    if (!ids) return [];
    return Array.from(ids).map(id => this._entries.get(id)).filter(Boolean);
  }

  getAllEntries() {
    return Array.from(this._entries.values());
  }

  get size() {
    return this._entries.size;
  }

  toJSON() {
    return {
      entries: Array.from(this._entries.values()).map(e => e.toJSON())
    };
  }

  static fromJSON(json) {
    const memory = new VerificationMemory();
    if (json.entries) {
      for (const e of json.entries) memory.record(VerificationMemoryEntry.fromJSON(e));
    }
    return memory;
  }
}
