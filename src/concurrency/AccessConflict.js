/**
 * AccessConflict.js
 * Represents a conflict between two memory accesses.
 */

export const ConflictType = Object.freeze({
  READ_WRITE: 'READ_WRITE',
  WRITE_READ: 'WRITE_READ',
  WRITE_WRITE: 'WRITE_WRITE'
});

export class AccessConflict {
  /**
   * @param {Object} options
   * @param {import('./MemoryAccess.js').MemoryAccess} options.accessA
   * @param {import('./MemoryAccess.js').MemoryAccess} options.accessB
   * @param {string} options.type
   * @param {string} options.resourceId
   * @param {string} [options.field='*']
   */
  constructor({
    accessA,
    accessB,
    type,
    resourceId,
    field = '*'
  }) {
    if (!accessA || !accessB || !type) {
      throw new Error('AccessConflict requires accessA, accessB, and type');
    }
    this.accessA = accessA;
    this.accessB = accessB;
    this.type = type;
    this.resourceId = resourceId || accessA.resourceId;
    this.field = field;
    Object.freeze(this);
  }

  static check(accessA, accessB) {
    if (accessA.contextId === accessB.contextId) return null;
    if (accessA.resourceId !== accessB.resourceId) return null;
    if (accessA.field !== accessB.field && accessA.field !== '*' && accessB.field !== '*') return null;

    const aWrite = accessA.isWrite();
    const bWrite = accessB.isWrite();

    if (!aWrite && !bWrite) return null; // Read-Read does not conflict

    // Atomic-Atomic operations do not produce unsynchronized raw data race conflicts
    if (accessA.isAtomic() && accessB.isAtomic()) return null;

    let type = ConflictType.WRITE_WRITE;
    if (!aWrite && bWrite) type = ConflictType.READ_WRITE;
    else if (aWrite && !bWrite) type = ConflictType.WRITE_READ;

    return new AccessConflict({
      accessA,
      accessB,
      type,
      resourceId: accessA.resourceId,
      field: accessA.field
    });
  }

  toJSON() {
    return {
      type: this.type,
      resourceId: this.resourceId,
      field: this.field,
      accessA: this.accessA.toJSON ? this.accessA.toJSON() : this.accessA,
      accessB: this.accessB.toJSON ? this.accessB.toJSON() : this.accessB
    };
  }
}
