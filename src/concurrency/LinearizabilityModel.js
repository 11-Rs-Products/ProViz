/**
 * LinearizabilityModel.js
 * Models concurrent operations with invocation, response, and linearization points.
 */

export class ConcurrentOperation {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.contextId
   * @param {string} options.name
   * @param {Array<*>} [options.args=[]]
   * @param {*} [options.result=undefined]
   * @param {number} options.invokeTime
   * @param {number} [options.responseTime=Infinity]
   * @param {number|null} [options.linearizationTime=null]
   */
  constructor({
    id,
    contextId,
    name,
    args = [],
    result = undefined,
    invokeTime,
    responseTime = Infinity,
    linearizationTime = null
  }) {
    if (!id || !contextId || !name || invokeTime === undefined) {
      throw new Error('ConcurrentOperation requires id, contextId, name, and invokeTime');
    }
    this.id = id;
    this.contextId = contextId;
    this.name = name;
    this.args = Object.freeze([...args]);
    this.result = result;
    this.invokeTime = invokeTime;
    this.responseTime = responseTime;
    this.linearizationTime = linearizationTime;
    Object.freeze(this);
  }

  isCompleted() {
    return Number.isFinite(this.responseTime);
  }

  overlaps(other) {
    const startA = this.invokeTime;
    const endA = this.responseTime;
    const startB = other.invokeTime;
    const endB = other.responseTime;
    return startA < endB && startB < endA;
  }

  precedes(other) {
    return this.responseTime < other.invokeTime;
  }

  toJSON() {
    return {
      id: this.id,
      contextId: this.contextId,
      name: this.name,
      args: [...this.args],
      result: this.result,
      invokeTime: this.invokeTime,
      responseTime: this.responseTime,
      linearizationTime: this.linearizationTime
    };
  }
}
