export const VerificationEventType = Object.freeze({
  TASK_CREATED: 'TASK_CREATED',
  TASK_READY: 'TASK_READY',
  TASK_STARTED: 'TASK_STARTED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  TASK_RETRIED: 'TASK_RETRIED',
  TASK_CANCELLED: 'TASK_CANCELLED',
  EVIDENCE_PRODUCED: 'EVIDENCE_PRODUCED',
  EVIDENCE_MERGED: 'EVIDENCE_MERGED',
  GOAL_UPDATED: 'GOAL_UPDATED',
  RESOURCE_ALLOCATED: 'RESOURCE_ALLOCATED',
  RESOURCE_RELEASED: 'RESOURCE_RELEASED',
  PLAN_REVISED: 'PLAN_REVISED',
  CHECKPOINT_CREATED: 'CHECKPOINT_CREATED'
});

export class VerificationEvent {
  constructor({
    type,
    payload = {},
    timestamp = Date.now(),
    source = 'orchestration'
  } = {}) {
    this.type = type;
    this.payload = Object.freeze({ ...payload });
    this.timestamp = timestamp;
    this.source = source;
    Object.freeze(this);
  }

  toJSON() {
    return {
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
      source: this.source
    };
  }
}
