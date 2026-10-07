/**
 * BackgroundVerificationEngine.js
 * Runs verification asynchronously in the background without blocking development flow.
 */

import { VerificationTaskStatus } from './VerificationTaskStatus.js';

export class BackgroundVerificationEngine {
  /**
   * @param {Object} [options={}]
   * @param {import('./VerificationScheduler.js').VerificationScheduler} [options.scheduler]
   * @param {import('./VerificationBudget.js').VerificationBudget} [options.budget]
   */
  constructor({ scheduler = null, budget = null } = {}) {
    this.scheduler = scheduler;
    this.budget = budget;
    this.isRunning = false;
    this.processedTasks = [];
  }

  start() {
    this.isRunning = true;
  }

  pause() {
    this.isRunning = false;
  }

  processBatch(executor = () => ({ success: true })) {
    if (!this.isRunning || !this.scheduler) return [];
    if (this.budget && this.budget.isExhausted()) {
      return [];
    }

    const dispatched = this.scheduler.scheduleNext();
    const results = [];

    for (const task of dispatched) {
      if (this.budget && this.budget.isExhausted()) {
        // Requeue unexecuted task if budget ran out
        if (this.scheduler.queue) {
          this.scheduler.queue.enqueue(task);
        }
        break;
      }
      const res = executor(task);
      const completed = this.scheduler.completeTask(task.id, res);
      if (completed) {
        this.processedTasks.push(completed);
        results.push(completed);
      }
      if (this.budget) {
        this.budget.recordUsage({ cpuMs: 10, solverCalls: 1 });
      }
    }

    return results;
  }
}
