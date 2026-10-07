/**
 * Records the exact deterministic decision and reasoning for agent delegation
 */
export class DelegationDecision {
  constructor({
    taskId,
    goalId,
    selectedAgent,
    candidates = [],
    reason = '',
    confidence = 1.0,
    timestamp = Date.now(),
    isFallback = false
  } = {}) {
    this.taskId = taskId;
    this.goalId = goalId;
    this.selectedAgent = selectedAgent;
    this.candidates = Object.freeze([...candidates]);
    this.reason = reason;
    this.confidence = confidence;
    this.timestamp = timestamp;
    this.isFallback = isFallback;
    Object.freeze(this);
  }

  get selectedAgentId() {
    return this.selectedAgent?.agentId || null;
  }

  toJSON() {
    return {
      taskId: this.taskId,
      goalId: this.goalId,
      selectedAgentId: this.selectedAgentId,
      candidates: this.candidates.map(c => (typeof c.toJSON === 'function' ? c.toJSON() : c)),
      reason: this.reason,
      confidence: this.confidence,
      timestamp: this.timestamp,
      isFallback: this.isFallback
    };
  }
}
