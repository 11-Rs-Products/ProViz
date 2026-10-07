/**
 * ConcurrentTask.js
 * Represents a spawned async task, job, or coroutine with lifecycle and dependencies.
 */

export const TaskState = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
});

export class ConcurrentTask {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.parentTaskId=null]
   * @param {string} [options.spawnSite='']
   * @param {string} [options.state=TaskState.PENDING]
   * @param {Array<string>} [options.dependencies=[]]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    parentTaskId = null,
    spawnSite = '',
    state = TaskState.PENDING,
    dependencies = [],
    metadata = {}
  }) {
    if (!id) throw new Error('ConcurrentTask requires id');
    this.id = id;
    this.name = name || id;
    this.parentTaskId = parentTaskId;
    this.spawnSite = spawnSite;
    this.state = state;
    this.dependencies = Object.freeze([...dependencies]);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      parentTaskId: this.parentTaskId,
      spawnSite: this.spawnSite,
      state: this.state,
      dependencies: [...this.dependencies],
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ConcurrentTask(json);
  }
}
