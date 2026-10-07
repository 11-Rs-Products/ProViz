/**
 * Represents an individual unit of verification work assigned to a specific agent in the federation
 */
export class FederatedTask {
  constructor({
    taskId,
    agentId,
    goalId,
    taskKind = 'STATIC_PROOF',
    inputPayload = {},
    status = 'PENDING',
    priority = 10,
    dependencies = [],
    executionState = {},
    result = null,
    metadata = {}
  } = {}) {
    if (!taskId) {
      throw new Error('FederatedTask requires a taskId');
    }

    this.taskId = taskId;
    this.agentId = agentId;
    this.goalId = goalId;
    this.taskKind = taskKind;
    this.inputPayload = Object.freeze({ ...inputPayload });
    this.status = status;
    this.priority = priority;
    this.dependencies = Object.freeze([...new Set(dependencies)]);
    this.executionState = Object.freeze({ ...executionState });
    this.result = result ? Object.freeze({ ...result }) : null;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  withStatus(newStatus, result = null) {
    return new FederatedTask({
      ...this.toJSON(),
      status: newStatus,
      result: result !== null ? result : this.result
    });
  }

  toJSON() {
    return {
      taskId: this.taskId,
      agentId: this.agentId,
      goalId: this.goalId,
      taskKind: this.taskKind,
      inputPayload: { ...this.inputPayload },
      status: this.status,
      priority: this.priority,
      dependencies: [...this.dependencies],
      executionState: { ...this.executionState },
      result: this.result ? { ...this.result } : null,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new FederatedTask(json);
  }
}
