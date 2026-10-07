import { FederatedTaskGraph } from './FederatedTaskGraph.js';

/**
 * Multi-agent verification plan spanning across cooperating verification engines
 */
export class FederatedPlan {
  constructor({
    planId,
    goalId,
    taskGraph = new FederatedTaskGraph(),
    agentAssignments = {},
    metadata = {}
  } = {}) {
    this.planId = planId || `fed-plan-${Math.random().toString(36).slice(2, 9)}`;
    this.goalId = goalId || 'default-goal';
    this.taskGraph = taskGraph instanceof FederatedTaskGraph ? taskGraph : FederatedTaskGraph.fromJSON(taskGraph);
    this.agentAssignments = Object.freeze({ ...agentAssignments });
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  get tasks() {
    return this.taskGraph.getAllTasks();
  }

  get executionOrder() {
    return this.taskGraph.getExecutionOrder();
  }

  toJSON() {
    return {
      planId: this.planId,
      goalId: this.goalId,
      taskGraph: this.taskGraph.toJSON(),
      agentAssignments: { ...this.agentAssignments },
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new FederatedPlan({
      ...json,
      taskGraph: FederatedTaskGraph.fromJSON(json.taskGraph)
    });
  }
}
