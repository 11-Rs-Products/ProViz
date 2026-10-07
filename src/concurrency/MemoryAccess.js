/**
 * MemoryAccess.js
 * Represents an individual memory access by an execution context.
 */

export const AccessKind = Object.freeze({
  READ: 'READ',
  WRITE: 'WRITE',
  ATOMIC_READ: 'ATOMIC_READ',
  ATOMIC_WRITE: 'ATOMIC_WRITE',
  READ_MODIFY_WRITE: 'READ_MODIFY_WRITE'
});

export class MemoryAccess {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.contextId
   * @param {string} options.resourceId
   * @param {string} [options.field='*']
   * @param {string} [options.kind=AccessKind.READ]
   * @param {*} [options.value=undefined]
   * @param {number} [options.timestamp=0]
   * @param {Object} [options.location={}]
   */
  constructor({
    id,
    contextId,
    resourceId,
    field = '*',
    kind = AccessKind.READ,
    value = undefined,
    timestamp = 0,
    location = {}
  }) {
    if (!id || !contextId || !resourceId) {
      throw new Error('MemoryAccess requires id, contextId, and resourceId');
    }
    this.id = id;
    this.contextId = contextId;
    this.resourceId = resourceId;
    this.field = field;
    this.kind = kind;
    this.value = value;
    this.timestamp = timestamp;
    this.location = Object.freeze({ ...location });
    Object.freeze(this);
  }

  isWrite() {
    return this.kind === AccessKind.WRITE ||
           this.kind === AccessKind.ATOMIC_WRITE ||
           this.kind === AccessKind.READ_MODIFY_WRITE;
  }

  isRead() {
    return this.kind === AccessKind.READ ||
           this.kind === AccessKind.ATOMIC_READ ||
           this.kind === AccessKind.READ_MODIFY_WRITE;
  }

  isAtomic() {
    return this.kind === AccessKind.ATOMIC_READ ||
           this.kind === AccessKind.ATOMIC_WRITE ||
           this.kind === AccessKind.READ_MODIFY_WRITE;
  }

  toJSON() {
    return {
      id: this.id,
      contextId: this.contextId,
      resourceId: this.resourceId,
      field: this.field,
      kind: this.kind,
      value: this.value,
      timestamp: this.timestamp,
      location: { ...this.location }
    };
  }

  static fromJSON(json) {
    return new MemoryAccess(json);
  }
}
