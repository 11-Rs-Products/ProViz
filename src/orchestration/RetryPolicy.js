export const RetryStrategy = Object.freeze({
  NO_RETRY: 'NO_RETRY',
  IMMEDIATE_RETRY: 'IMMEDIATE_RETRY',
  BACKOFF: 'BACKOFF',
  ALTERNATE_CONFIGURATION: 'ALTERNATE_CONFIGURATION',
  ALTERNATE_WORKER: 'ALTERNATE_WORKER'
});

export class RetryPolicy {
  constructor({
    strategy = RetryStrategy.BACKOFF,
    maxRetries = 3,
    initialBackoffMs = 100,
    backoffMultiplier = 2
  } = {}) {
    this.strategy = strategy;
    this.maxRetries = Number(maxRetries);
    this.initialBackoffMs = Number(initialBackoffMs);
    this.backoffMultiplier = Number(backoffMultiplier);
    Object.freeze(this);
  }

  canRetry(task, failure) {
    if (this.strategy === RetryStrategy.NO_RETRY) return false;
    if (failure && !failure.retryable) return false;
    return (task.retryCount || 0) < this.maxRetries;
  }

  computeDelayMs(task) {
    if (this.strategy === RetryStrategy.IMMEDIATE_RETRY) return 0;
    const retryCount = task.retryCount || 0;
    return this.initialBackoffMs * Math.pow(this.backoffMultiplier, retryCount);
  }
}
