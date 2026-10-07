/**
 * SharedStateModel.js
 * Tracks shared memory variables, resources, and their access histories.
 */

export class SharedStateModel {
  constructor() {
    /** @type {Map<string, Array<import('./MemoryAccess.js').MemoryAccess>>} resourceId -> accesses */
    this.accessHistory = new Map();
    /** @type {Map<string, Object>} resourceId -> metadata */
    this.resourceMetadata = new Map();
  }

  registerResource(resourceId, metadata = {}) {
    if (!this.accessHistory.has(resourceId)) {
      this.accessHistory.set(resourceId, []);
      this.resourceMetadata.set(resourceId, { ...metadata });
    }
  }

  recordAccess(access) {
    this.registerResource(access.resourceId);
    this.accessHistory.get(access.resourceId).push(access);
  }

  getAccesses(resourceId) {
    return this.accessHistory.get(resourceId) || [];
  }

  getAllAccesses() {
    const list = [];
    for (const accesses of this.accessHistory.values()) {
      list.push(...accesses);
    }
    return list;
  }

  getAllResources() {
    return Array.from(this.accessHistory.keys());
  }

  getContextsAccessingResource(resourceId) {
    const accesses = this.getAccesses(resourceId);
    return Array.from(new Set(accesses.map(a => a.contextId)));
  }

  toJSON() {
    const serialized = {};
    for (const [resId, accesses] of this.accessHistory.entries()) {
      serialized[resId] = {
        metadata: this.resourceMetadata.get(resId) || {},
        accesses: accesses.map(a => a.toJSON ? a.toJSON() : a)
      };
    }
    return serialized;
  }
}
