/**
 * VerificationScheduler.js
 * Schedules and dispatches verification tasks from the queue to execution workers.
 */

import { VerificationTaskStatus } from './VerificationTaskStatus.js';

export class VerificationScheduler {
  /**
   * @param {Object} [options={}]
   * @param {import('./VerificationQueue.js').VerificationQueue} [options.queue]
   * @param {number} [options.maxConcurrentTasks=4]
   */
  constructor({ queue = null, maxConcurrentTasks = 4 } = {}) {
    this.queue = queue;
    this.maxConcurrentTasks = maxConcurrentTasks;
    this.runningTasks = new Map();
    this.completedTasks = [];
  }

  /**
   * Dispatches next available ready tasks up to concurrency limit.
   * @returns {Array<import('./VerificationTask.js').VerificationTask>} Dispatched tasks
   */
  scheduleNext() {
    if (!this.queue) return [];
    const dispatched = [];

    while (this.runningTasks.size < this.maxConcurrentTasks && this.queue.size() > 0) {
      const task = this.queue.dequeue();
      if (!task) break;

      const runningTask = task.withStatus(VerificationTaskStatus.RUNNING);
      this.runningTasks.set(runningTask.id, runningTask);
      dispatched.push(runningTask);
    }

    return dispatched;
  }

  completeTask(taskId, result = { success: true }) {
    const task = this.runningTasks.get(taskId);
    if (task) {
      this.runningTasks.delete(taskId);
      const status = result.success ? VerificationTaskStatus.SUCCEEDED : VerificationTaskStatus.FAILED;
      const completed = task.withStatus(status, result);
      this.completedTasks.push(completed);
      return completed;
    }
    return null;
  }
}
