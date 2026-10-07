export class ExecutionCheckpoint {
  constructor({
    checkpointId,
    timestamp = Date.now(),
    taskGraph = null,
    runningTaskIds = [],
    completedTaskIds = [],
    resourceUsage = {},
    evidence = [],
    goals = [],
    schedulerState = {}
  } = {}) {
    this.checkpointId = checkpointId || `chk_${timestamp}_${Math.random().toString(16).slice(2, 8)}`;
    this.timestamp = timestamp;
    this.taskGraph = taskGraph;
    this.runningTaskIds = Object.freeze([...runningTaskIds]);
    this.completedTaskIds = Object.freeze([...completedTaskIds]);
    this.resourceUsage = Object.freeze({ ...resourceUsage });
    this.evidence = Object.freeze([...evidence]);
    this.goals = Object.freeze([...goals]);
    this.schedulerState = Object.freeze({ ...schedulerState });
    Object.freeze(this);
  }

  toJSON() {
    return {
      checkpointId: this.checkpointId,
      timestamp: this.timestamp,
      taskGraph: this.taskGraph?.toJSON ? this.taskGraph.toJSON() : this.taskGraph,
      runningTaskIds: this.runningTaskIds,
      completedTaskIds: this.completedTaskIds,
      resourceUsage: this.resourceUsage,
      evidence: this.evidence,
      evidenceCount: this.evidence.length,
      goals: this.goals,
      goalsCount: this.goals.length,
      schedulerState: this.schedulerState
    };
  }

  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new ExecutionCheckpoint(data);
  }
}
