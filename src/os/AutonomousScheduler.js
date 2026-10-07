/**
 * AutonomousScheduler.js
 * Master scheduler orchestrating verification tasks with priority arbitration, dependency resolution, preemption, and resource quotas.
 */

import { PriorityArbiter } from './PriorityArbiter.js';
import { ResourceBudgetManager, GlobalResourceBudget } from './GlobalResourceBudget.js';
import { TaskAdmissionController } from './TaskAdmissionController.js';

export class TaskDependencyResolver {
  /**
   * Sort tasks by dependency order
   * @param {Object[]} tasks
   */
  resolveOrder(tasks) {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set();
    const ordered = [];

    const visit = (task) => {
      if (visited.has(task.id)) return;
      visited.add(task.id);
      for (const depId of task.dependencies || []) {
        const depTask = taskMap.get(depId);
        if (depTask) visit(depTask);
      }
      ordered.push(task);
    };

    for (const task of tasks) {
      visit(task);
    }
    return ordered;
  }
}

export class TaskPreemptionManager {
  /**
   * Determine if running task should be preempted by higher-priority incoming task
   * @param {Object} runningTask
   * @param {Object} incomingTask
   */
  shouldPreempt(runningTask, incomingTask) {
    if (!runningTask || !incomingTask) return false;
    // Preempt if incoming priority is significantly higher (e.g. 2x)
    return (incomingTask.priority || 0) > (runningTask.priority || 0) * 2;
  }
}

export class AutonomousScheduler {
  /**
   * @param {Object} [options]
   * @param {ResourceBudgetManager} [options.budgetManager]
   */
  constructor(options = {}) {
    this.budgetManager = options.budgetManager || new ResourceBudgetManager(new GlobalResourceBudget());
    this.arbiter = new PriorityArbiter();
    this.admissionController = new TaskAdmissionController(this.budgetManager);
    this.depResolver = new TaskDependencyResolver();
    this.preemptionManager = new TaskPreemptionManager();
    /** @type {Object[]} */
    this._queue = [];
    /** @type {Object|null} */
    this._activeTask = null;
  }

  enqueueTask(task) {
    if (!this.admissionController.canAdmit(task)) {
      return { admitted: false, reason: 'RESOURCE_QUOTA_EXHAUSTED' };
    }

    this._queue.push(task);
    this._queue = this.arbiter.rankTasks(this._queue);
    return { admitted: true, queuePosition: this._queue.findIndex(t => t.id === task.id) + 1 };
  }

  getNextTask() {
    if (this._queue.length === 0) return null;
    return this._queue.shift();
  }

  getQueue() {
    return [...this._queue];
  }

  get queueSize() {
    return this._queue.length;
  }

  clearQueue() {
    this._queue = [];
  }
}
