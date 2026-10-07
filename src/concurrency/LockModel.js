/**
 * LockModel.js
 * Tracks lock acquisition, release, ownership, nesting, ordering, and contention.
 */

export const LockState = Object.freeze({
  UNLOCKED: 'UNLOCKED',
  LOCKED: 'LOCKED',
  READ_LOCKED: 'READ_LOCKED',
  CONTENTION: 'CONTENTION'
});

export class LockModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.kind='MUTEX']
   * @param {string|null} [options.ownerContextId=null]
   * @param {Array<string>} [options.readerContextIds=[]]
   * @param {Array<string>} [options.waitingContextIds=[]]
   * @param {number} [options.nestingLevel=0]
   */
  constructor({
    id,
    name = '',
    kind = 'MUTEX',
    ownerContextId = null,
    readerContextIds = [],
    waitingContextIds = [],
    nestingLevel = 0
  }) {
    if (!id) throw new Error('LockModel requires id');
    this.id = id;
    this.name = name || id;
    this.kind = kind;
    this.ownerContextId = ownerContextId;
    this.readerContextIds = Object.freeze([...readerContextIds]);
    this.waitingContextIds = Object.freeze([...waitingContextIds]);
    this.nestingLevel = nestingLevel;
    Object.freeze(this);
  }

  isLocked() {
    return this.ownerContextId !== null || this.readerContextIds.length > 0;
  }

  acquire(contextId, isRead = false) {
    if (isRead) {
      return new LockModel({
        id: this.id,
        name: this.name,
        kind: this.kind,
        ownerContextId: null,
        readerContextIds: [...this.readerContextIds, contextId],
        waitingContextIds: this.waitingContextIds.filter(w => w !== contextId),
        nestingLevel: this.nestingLevel + 1
      });
    }

    return new LockModel({
      id: this.id,
      name: this.name,
      kind: this.kind,
      ownerContextId: contextId,
      readerContextIds: this.readerContextIds,
      waitingContextIds: this.waitingContextIds.filter(w => w !== contextId),
      nestingLevel: this.ownerContextId === contextId ? this.nestingLevel + 1 : 1
    });
  }

  release(contextId) {
    if (this.readerContextIds.includes(contextId)) {
      const remainingReaders = this.readerContextIds.filter(r => r !== contextId);
      return new LockModel({
        id: this.id,
        name: this.name,
        kind: this.kind,
        ownerContextId: this.ownerContextId,
        readerContextIds: remainingReaders,
        waitingContextIds: this.waitingContextIds,
        nestingLevel: Math.max(0, this.nestingLevel - 1)
      });
    }

    if (this.ownerContextId === contextId) {
      if (this.nestingLevel > 1) {
        return new LockModel({
          id: this.id,
          name: this.name,
          kind: this.kind,
          ownerContextId: this.ownerContextId,
          readerContextIds: this.readerContextIds,
          waitingContextIds: this.waitingContextIds,
          nestingLevel: this.nestingLevel - 1
        });
      }
      return new LockModel({
        id: this.id,
        name: this.name,
        kind: this.kind,
        ownerContextId: null,
        readerContextIds: this.readerContextIds,
        waitingContextIds: this.waitingContextIds,
        nestingLevel: 0
      });
    }

    return this;
  }

  addWaiter(contextId) {
    if (this.waitingContextIds.includes(contextId)) return this;
    return new LockModel({
      id: this.id,
      name: this.name,
      kind: this.kind,
      ownerContextId: this.ownerContextId,
      readerContextIds: this.readerContextIds,
      waitingContextIds: [...this.waitingContextIds, contextId],
      nestingLevel: this.nestingLevel
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      ownerContextId: this.ownerContextId,
      readerContextIds: [...this.readerContextIds],
      waitingContextIds: [...this.waitingContextIds],
      nestingLevel: this.nestingLevel
    };
  }
}
