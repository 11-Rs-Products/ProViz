/**
 * HappensBeforeRelation.js
 * Canonical happens-before relation kinds and data structure.
 */

export const RelationKind = Object.freeze({
  PROGRAM_ORDER: 'PROGRAM_ORDER',
  FORK_JOIN: 'FORK_JOIN',
  LOCK_SYNCHRONIZATION: 'LOCK_SYNCHRONIZATION',
  MESSAGE_PASSING: 'MESSAGE_PASSING',
  VOLATILE_ACCESS: 'VOLATILE_ACCESS',
  BARRIER_SYNC: 'BARRIER_SYNC',
  ASYNC_AWAIT: 'ASYNC_AWAIT'
});

export class HappensBeforeRelation {
  /**
   * @param {Object} options
   * @param {string} options.fromEventId
   * @param {string} options.toEventId
   * @param {string} [options.kind=RelationKind.PROGRAM_ORDER]
   * @param {Object} [options.attributes={}]
   */
  constructor({
    fromEventId,
    toEventId,
    kind = RelationKind.PROGRAM_ORDER,
    attributes = {}
  }) {
    if (!fromEventId || !toEventId) throw new Error('HappensBeforeRelation requires fromEventId and toEventId');
    this.fromEventId = fromEventId;
    this.toEventId = toEventId;
    this.kind = kind;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      fromEventId: this.fromEventId,
      toEventId: this.toEventId,
      kind: this.kind,
      attributes: { ...this.attributes }
    };
  }
}
