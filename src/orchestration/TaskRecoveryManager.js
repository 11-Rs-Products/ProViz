import { RetryPolicy } from './RetryPolicy.js';
import { VerificationTaskStatus } from './VerificationTaskStatus.js';

export class TaskRecoveryManager {
  constructor({ retryPolicy = new RetryPolicy() } = {}) {
    this.retryPolicy = retryPolicy instanceof RetryPolicy ? retryPolicy : new RetryPolicy(retryPolicy);
    this.failureLog = new Map(); // taskId -> Array<TaskFailure>
  }

  handleFailure(task, failure) {
    const id = task.taskId;
    if (!this.failureLog.has(id)) {
      this.failureLog.set(id, []);
    }
    this.failureLog.get(id).push(failure);

    if (this.retryPolicy.canRetry(task, failure)) {
      const retryingTask = task.withStatus(VerificationTaskStatus.RETRYING).withRetryCount((task.retryCount || 0) + 1);
      return {
        shouldRetry: true,
        task: retryingTask,
        delayMs: this.retryPolicy.computeDelayMs(task)
      };
    }

    return {
      shouldRetry: false,
      task: task.withStatus(VerificationTaskStatus.FAILED),
      delayMs: 0
    };
  }

  getFailures(taskId) {
    return this.failureLog.get(String(taskId)) || [];
  }
}
