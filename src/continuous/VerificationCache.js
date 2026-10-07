/**
 * VerificationCache.js
 * Caches verification evidence keyed by revision, semantic identity, property, assumptions, and scope.
 */

export class VerificationCache {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.maxSize=1000]
   */
  constructor({ maxSize = 1000 } = {}) {
    this.maxSize = maxSize;
    /** @type {Map<string, Object>} cacheKey -> { evidence, timestamp, hitCount, assumptions } */
    this.entries = new Map();
  }

  static buildKey({ targetEntity, property, revision = 'latest', environment = 'default' }) {
    return `${targetEntity}:${property}:${revision}:${environment}`;
  }

  get(key) {
    const entry = this.entries.get(key);
    if (entry) {
      entry.hitCount++;
      entry.lastAccessed = Date.now();
      return entry.evidence;
    }
    return null;
  }

  put(key, evidence, { assumptions = [], revision = 'latest' } = {}) {
    if (this.entries.size >= this.maxSize && !this.entries.has(key)) {
      this._evictLRU();
    }
    this.entries.set(key, {
      key,
      evidence,
      assumptions: [...assumptions],
      revision,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      hitCount: 0
    });
  }

  has(key) {
    return this.entries.has(key);
  }

  invalidate(keyPattern) {
    let count = 0;
    for (const key of this.entries.keys()) {
      if (key.includes(keyPattern)) {
        this.entries.delete(key);
        count++;
      }
    }
    return count;
  }

  clear() {
    this.entries.clear();
  }

  size() {
    return this.entries.size;
  }

  _evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [k, v] of this.entries.entries()) {
      if (v.lastAccessed < oldestTime) {
        oldestTime = v.lastAccessed;
        oldestKey = k;
      }
    }
    if (oldestKey) this.entries.delete(oldestKey);
  }

  toJSON() {
    return {
      size: this.entries.size,
      maxSize: this.maxSize,
      keys: Array.from(this.entries.keys())
    };
  }
}
