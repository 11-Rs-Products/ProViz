/**
 * CacheValidator.js
 * Validates whether cached evidence entries remain applicable under current assumptions.
 */

export class CacheValidator {
  /**
   * Validates a cached entry against current workspace revision and modified entities.
   * @param {Object} cacheEntry
   * @param {Array<string>} modifiedEntities
   * @param {string} currentRevision
   * @returns {boolean}
   */
  isValid(cacheEntry, modifiedEntities = [], currentRevision = '') {
    if (!cacheEntry) return false;
    // Check revision match if specified
    if (cacheEntry.revision && currentRevision && cacheEntry.revision !== currentRevision) {
      // Check if target entity or assumptions were modified
      for (const entity of modifiedEntities) {
        if (cacheEntry.key.includes(entity)) return false;
        if (cacheEntry.assumptions && cacheEntry.assumptions.includes(entity)) return false;
      }
    }
    return true;
  }
}
