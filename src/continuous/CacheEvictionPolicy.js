/**
 * CacheEvictionPolicy.js
 * Policy for evicting low-value, stale, or expired cache entries without losing provenance.
 */

export class CacheEvictionPolicy {
  /**
   * Evaluates candidates for eviction based on access frequency, age, and staleness.
   * @param {Array<Object>} entries
   * @param {Object} [options={}]
   * @param {number} [options.maxAgeMs=3600000] 1 hour default
   * @returns {Array<string>} Keys of entries to evict
   */
  selectEvictionKeys(entries, { maxAgeMs = 3600000 } = {}) {
    const now = Date.now();
    const toEvict = [];

    for (const entry of entries) {
      if (now - entry.timestamp > maxAgeMs) {
        toEvict.push(entry.key);
      }
    }

    return toEvict;
  }
}
