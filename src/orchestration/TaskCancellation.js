import { CancellationReason } from './CancellationReason.js';

export class TaskCancellation {
  constructor({
    taskId,
    reason = CancellationReason.USER_REQUEST,
    timestamp = Date.now(),
    details = ''
  } = {}) {
    this.taskId = String(taskId);
    this.reason = reason;
    this.timestamp = timestamp;
    this.details = String(details);
    Object.freeze(this);
  }

  toJSON() {
    return {
      taskId: this.taskId,
      reason: this.reason,
      timestamp: this.timestamp,
      details: this.details
    };
  }
}
