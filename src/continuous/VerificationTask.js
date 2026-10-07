/**
 * VerificationTask.js
 * Executable verification task unit.
 */

import { VerificationTaskStatus } from './VerificationTaskStatus.js';
export { VerificationTaskStatus };

export class VerificationTask {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {import('./VerificationObligation.js').VerificationObligation} options.obligation
   * @param {string} [options.status=VerificationTaskStatus.QUEUED]
   * @param {number} [options.priority=1.0]
   * @param {number|null} [options.deadline=null]
   * @param {Object} [options.budget={ cpuMs: 1000, memoryMb: 256 }]
   * @param {Object|null} [options.result=null]
   */
  constructor({
    id,
    obligation,
    status = VerificationTaskStatus.QUEUED,
    priority = 1.0,
    deadline = null,
    budget = { cpuMs: 1000, memoryMb: 256 },
    result = null
  }) {
    if (!id || !obligation) throw new Error('VerificationTask requires id and obligation');
    this.id = id;
    this.obligation = obligation;
    this.status = status;
    this.priority = priority;
    this.deadline = deadline;
    this.budget = Object.freeze({ ...budget });
    this.result = result;
    Object.freeze(this);
  }

  withStatus(status, result = this.result) {
    return new VerificationTask({
      id: this.id,
      obligation: this.obligation,
      status,
      priority: this.priority,
      deadline: this.deadline,
      budget: this.budget,
      result
    });
  }

  toJSON() {
    return {
      id: this.id,
      obligation: this.obligation.toJSON ? this.obligation.toJSON() : this.obligation,
      status: this.status,
      priority: this.priority,
      deadline: this.deadline,
      budget: { ...this.budget },
      result: this.result
    };
  }

  static fromJSON(json) {
    return new VerificationTask(json);
  }
}
