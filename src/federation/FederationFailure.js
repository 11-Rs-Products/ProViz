/**
 * Federation failure classifications
 */
export const FederationFailureType = Object.freeze({
  AGENT_OFFLINE: 'AGENT_OFFLINE',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  RESOURCE_FAILURE: 'RESOURCE_FAILURE',
  ENVIRONMENT_FAILURE: 'ENVIRONMENT_FAILURE',
  PROTOCOL_FAILURE: 'PROTOCOL_FAILURE',
  INVALID_RESULT: 'INVALID_RESULT',
  INCONSISTENT_RESULT: 'INCONSISTENT_RESULT'
});

export class FederationFailure {
  constructor({
    failureType = FederationFailureType.AGENT_TIMEOUT,
    agentId,
    taskId,
    error = null,
    details = {},
    timestamp = Date.now()
  } = {}) {
    this.failureType = failureType;
    this.agentId = agentId;
    this.taskId = taskId;
    this.error = error ? (error.message || String(error)) : null;
    this.details = Object.freeze({ ...details });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      failureType: this.failureType,
      agentId: this.agentId,
      taskId: this.taskId,
      error: this.error,
      details: { ...this.details },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json = {}) {
    return new FederationFailure(json);
  }
}
