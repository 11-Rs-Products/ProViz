/**
 * AtomicRegion.js
 * Represents an atomic region / critical section that must execute indivisibly.
 */

export class AtomicRegion {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.contextId
   * @param {string} options.startEventId
   * @param {string} options.endEventId
   * @param {Array<string>} [options.resourceIds=[]]
   * @param {string} [options.lockId=null]
   * @param {string} [options.name='']
   */
  constructor({
    id,
    contextId,
    startEventId,
    endEventId,
    resourceIds = [],
    lockId = null,
    name = ''
  }) {
    if (!id || !contextId || !startEventId || !endEventId) {
      throw new Error('AtomicRegion requires id, contextId, startEventId, and endEventId');
    }
    this.id = id;
    this.contextId = contextId;
    this.startEventId = startEventId;
    this.endEventId = endEventId;
    this.resourceIds = Object.freeze([...resourceIds]);
    this.lockId = lockId;
    this.name = name || id;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      contextId: this.contextId,
      startEventId: this.startEventId,
      endEventId: this.endEventId,
      resourceIds: [...this.resourceIds],
      lockId: this.lockId,
      name: this.name
    };
  }
}
