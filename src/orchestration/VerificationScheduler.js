import { VerificationTaskStatus } from './VerificationTaskStatus.js';
import { ResourceAllocator } from './ResourceAllocator.js';
import { ConcurrencyController } from './ConcurrencyController.js';

export const SchedulingPolicy = Object.freeze({
  PRIORITY: 'PRIORITY',
  FIFO: 'FIFO',
  COST_AWARE: 'COST_AWARE',
  DEADLINE_FIRST: 'DEADLINE_FIRST',
  CRITICAL_PATH: 'CRITICAL_PATH',
  RISK_FIRST: 'RISK_FIRST',
  INFORMATION_GAIN: 'INFORMATION_GAIN',
  RESOURCE_AWARE: 'RESOURCE_AWARE',
  BALANCED: 'BALANCED'
});

export class VerificationScheduler {
  constructor({
    policy = SchedulingPolicy.BALANCED,
    resourceAllocator = new ResourceAllocator(),
    concurrencyController = new ConcurrencyController()
  } = {}) {
    this.policy = policy;
    this.resourceAllocator = resourceAllocator;
    this.concurrencyController = concurrencyController;
    this.queue = [];
    this.running = new Map(); // taskId -> VerificationTask
    this.completed = new Map(); // taskId -> VerificationTask
    this.failed = new Map(); // taskId -> VerificationTask
    this.cancelled = new Map(); // taskId -> VerificationTask
  }

  enqueue(task) {
    const t = task.withStatus ? task.withStatus(VerificationTaskStatus.QUEUED) : task;
    this.queue.push(t);
    return t;
  }

  prioritize() {
    this.queue.sort((a, b) => {
      switch (this.policy) {
        case SchedulingPolicy.PRIORITY:
        case SchedulingPolicy.CRITICAL_PATH:
          return (b.priority || 5) - (a.priority || 5) || String(a.taskId).localeCompare(String(b.taskId));
        case SchedulingPolicy.FIFO:
          return 0;
        case SchedulingPolicy.COST_AWARE:
          const costA = a.budget?.maxTimeMs || 50;
          const costB = b.budget?.maxTimeMs || 50;
          return costA - costB || (b.priority || 5) - (a.priority || 5);
        case SchedulingPolicy.RISK_FIRST:
          const riskA = a.metadata?.riskScore || 0.5;
          const riskB = b.metadata?.riskScore || 0.5;
          return riskB - riskA || (b.priority || 5) - (a.priority || 5);
        case SchedulingPolicy.BALANCED:
        default:
          const pDiff = (b.priority || 5) - (a.priority || 5);
          if (pDiff !== 0) return pDiff;
          return String(a.taskId).localeCompare(String(b.taskId));
      }
    });
  }

  dispatch(taskGraph = null) {
    this.prioritize();
    const readyToDispatch = [];
    const remainingQueue = [];

    const completedIds = new Set(this.completed.keys());

    for (const task of this.queue) {
      // If taskGraph is provided, ensure prerequisites are met
      if (taskGraph) {
        const prereqs = taskGraph.getPrerequisites(task.taskId);
        const allDone = prereqs.every(p => completedIds.has(p.taskId));
        if (!allDone) {
          remainingQueue.push(task);
          continue;
        }
      }

      // Check resource and concurrency admission
      if (this.concurrencyController.canAdmit(task) && this.resourceAllocator.canAllocate(task)) {
        this.concurrencyController.admit(task);
        this.resourceAllocator.allocate(task);

        const runningTask = task.withStatus ? task.withStatus(VerificationTaskStatus.RUNNING) : task;
        this.running.set(runningTask.taskId, runningTask);
        readyToDispatch.push(runningTask);
      } else {
        remainingQueue.push(task);
      }
    }

    this.queue = remainingQueue;
    return readyToDispatch;
  }

  complete(task, result = null) {
    const id = String(task.taskId || task.id);
    this.running.delete(id);
    this.concurrencyController.release(id);
    this.resourceAllocator.release(id);

    const completedTask = task.withStatus ? task.withStatus(VerificationTaskStatus.COMPLETED) : task;
    this.completed.set(id, completedTask);
    return completedTask;
  }

  fail(task, error = null) {
    const id = String(task.taskId || task.id);
    this.running.delete(id);
    this.concurrencyController.release(id);
    this.resourceAllocator.release(id);

    const failedTask = task.withStatus ? task.withStatus(VerificationTaskStatus.FAILED) : task;
    this.failed.set(id, failedTask);
    return failedTask;
  }

  cancel(taskOrId, reason = 'CANCELLED') {
    const id = typeof taskOrId === 'string' ? taskOrId : String(taskOrId.taskId || taskOrId.id);
    this.queue = this.queue.filter(t => t.taskId !== id);
    if (this.running.has(id)) {
      const task = this.running.get(id);
      this.running.delete(id);
      this.concurrencyController.release(id);
      this.resourceAllocator.release(id);
      const cancelledTask = task.withStatus ? task.withStatus(VerificationTaskStatus.CANCELLED) : task;
      this.cancelled.set(id, cancelledTask);
      return cancelledTask;
    }
    return null;
  }

  getQueueLength() {
    return this.queue.length;
  }

  getRunningCount() {
    return this.running.size;
  }

  getCompletedCount() {
    return this.completed.size;
  }

  toJSON() {
    return {
      policy: this.policy,
      queueLength: this.queue.length,
      runningCount: this.running.size,
      completedCount: this.completed.size,
      failedCount: this.failed.size,
      cancelledCount: this.cancelled.size
    };
  }
}
