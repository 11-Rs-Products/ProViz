/**
 * ExecutionContext.js
 * Represents an individual concurrent execution thread, async task, worker, process, or actor.
 */

export const ContextKind = Object.freeze({
  THREAD: 'THREAD',
  TASK: 'TASK',
  PROCESS: 'PROCESS',
  ACTOR: 'ACTOR',
  EVENT_LOOP: 'EVENT_LOOP',
  WORKER: 'WORKER'
});

export class ExecutionContext {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.kind=ContextKind.THREAD]
   * @param {string} [options.parentContextId=null]
   * @param {Object} [options.attributes={}]
   */
  constructor({
    id,
    name = '',
    kind = ContextKind.THREAD,
    parentContextId = null,
    attributes = {}
  }) {
    if (!id) throw new Error('ExecutionContext requires id');
    this.id = id;
    this.name = name || id;
    this.kind = kind;
    this.parentContextId = parentContextId;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      parentContextId: this.parentContextId,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new ExecutionContext(json);
  }
}
