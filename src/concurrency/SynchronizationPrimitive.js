/**
 * SynchronizationPrimitive.js
 * Canonical synchronization mechanisms.
 */

export const PrimitiveKind = Object.freeze({
  MUTEX: 'MUTEX',
  RW_LOCK: 'RW_LOCK',
  SEMAPHORE: 'SEMAPHORE',
  MONITOR: 'MONITOR',
  BARRIER: 'BARRIER',
  LATCH: 'LATCH',
  CONDITION_VARIABLE: 'CONDITION_VARIABLE',
  ATOMIC: 'ATOMIC',
  CHANNEL: 'CHANNEL',
  QUEUE: 'QUEUE',
  TRANSACTION: 'TRANSACTION'
});

export class SynchronizationPrimitive {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.kind=PrimitiveKind.MUTEX]
   * @param {number} [options.capacity=1]
   * @param {Object} [options.attributes={}]
   */
  constructor({
    id,
    name = '',
    kind = PrimitiveKind.MUTEX,
    capacity = 1,
    attributes = {}
  }) {
    if (!id) throw new Error('SynchronizationPrimitive requires id');
    this.id = id;
    this.name = name || id;
    this.kind = kind;
    this.capacity = capacity;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      capacity: this.capacity,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new SynchronizationPrimitive(json);
  }
}
