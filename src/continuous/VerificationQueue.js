/**
 * VerificationQueue.js
 * Priority queue maintaining scheduled and ready verification tasks.
 */

import { VerificationTaskStatus } from './VerificationTaskStatus.js';

export class VerificationQueue {
  constructor() {
    /** @type {Array<import('./VerificationTask.js').VerificationTask>} */
    this.tasks = [];
  }

  enqueue(task) {
    this.tasks.push(task);
    this._sort();
  }

  enqueueAll(taskList) {
    for (const t of taskList) this.tasks.push(t);
    this._sort();
  }

  dequeue() {
    return this.tasks.shift() || null;
  }

  peek() {
    return this.tasks[0] || null;
  }

  size() {
    return this.tasks.length;
  }

  getTasksByStatus(status) {
    return this.tasks.filter(t => t.status === status);
  }

  getReadyTasks() {
    return this.tasks.filter(t => t.status === VerificationTaskStatus.READY || t.status === VerificationTaskStatus.QUEUED);
  }

  remove(taskId) {
    const idx = this.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      return this.tasks.splice(idx, 1)[0];
    }
    return null;
  }

  clear() {
    this.tasks = [];
  }

  _sort() {
    // Highest priority first
    this.tasks.sort((a, b) => b.priority - a.priority);
  }

  toJSON() {
    return {
      size: this.tasks.length,
      tasks: this.tasks.map(t => t.toJSON ? t.toJSON() : t)
    };
  }
}
