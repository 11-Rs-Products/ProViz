export const TaskFailureKind = Object.freeze({
  TRANSIENT: 'TRANSIENT',
  RESOURCE: 'RESOURCE',
  ENVIRONMENT: 'ENVIRONMENT',
  SOLVER: 'SOLVER',
  TIMEOUT: 'TIMEOUT',
  INVALID_INPUT: 'INVALID_INPUT',
  INTERNAL: 'INTERNAL',
  DETERMINISTIC_FAILURE: 'DETERMINISTIC_FAILURE'
});

export class TaskFailure {
  constructor({
    taskId,
    kind = TaskFailureKind.TRANSIENT,
    message = '',
    retryable = true,
    timestamp = Date.now()
  } = {}) {
    this.taskId = String(taskId);
    this.kind = kind;
    this.message = String(message);
    this.retryable = Boolean(retryable);
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      taskId: this.taskId,
      kind: this.kind,
      message: this.message,
      retryable: this.retryable,
      timestamp: this.timestamp
    };
  }
}
