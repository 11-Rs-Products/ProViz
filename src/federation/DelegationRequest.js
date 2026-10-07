/**
 * Request describing a task or goal to be delegated to an agent in the federation
 */
export class DelegationRequest {
  constructor({
    taskId,
    goalId,
    requiredCapabilities = {},
    preferredEvidence = null,
    budget = { maxTimeMs: 1000, maxCost: 10.0 },
    deadline = Date.now() + 5000,
    environment = {},
    constraints = {}
  } = {}) {
    this.taskId = taskId || `delegation-task-${Math.random().toString(36).slice(2, 9)}`;
    this.goalId = goalId || 'default-goal';
    this.requiredCapabilities = Object.freeze({ ...requiredCapabilities });
    this.preferredEvidence = preferredEvidence;
    this.budget = Object.freeze({
      maxTimeMs: budget.maxTimeMs ?? 1000,
      maxCost: budget.maxCost ?? 10.0
    });
    this.deadline = deadline;
    this.environment = Object.freeze({ ...environment });
    this.constraints = Object.freeze({ ...constraints });
    Object.freeze(this);
  }

  toJSON() {
    return {
      taskId: this.taskId,
      goalId: this.goalId,
      requiredCapabilities: { ...this.requiredCapabilities },
      preferredEvidence: this.preferredEvidence,
      budget: { ...this.budget },
      deadline: this.deadline,
      environment: { ...this.environment },
      constraints: { ...this.constraints }
    };
  }

  static fromJSON(json = {}) {
    return new DelegationRequest(json);
  }
}
