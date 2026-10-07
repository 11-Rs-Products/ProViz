import { VerificationTaskStatus } from './VerificationTaskStatus.js';

export class SpeculativeExecutor {
  constructor({ scheduler, workerPool } = {}) {
    this.scheduler = scheduler;
    this.workerPool = workerPool;
    this.speculativeTasks = new Map(); // goalId -> Array<VerificationTask>
  }

  registerSpeculativeTask(goalId, task) {
    const gid = String(goalId);
    if (!this.speculativeTasks.has(gid)) {
      this.speculativeTasks.set(gid, []);
    }
    this.speculativeTasks.get(gid).push(task);
  }

  cancelSpeculativeTasksForGoal(goalId, reason = 'GOAL_SATISFIED') {
    const gid = String(goalId);
    const tasks = this.speculativeTasks.get(gid) || [];
    const cancelled = [];

    for (const task of tasks) {
      if (task.status === VerificationTaskStatus.QUEUED || task.status === VerificationTaskStatus.RUNNING) {
        if (this.scheduler) {
          this.scheduler.cancel(task.taskId, reason);
        }
        cancelled.push(task.withStatus ? task.withStatus(VerificationTaskStatus.CANCELLED) : task);
      }
    }

    this.speculativeTasks.delete(gid);
    return cancelled;
  }
}
