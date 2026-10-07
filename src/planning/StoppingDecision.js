import { PlanningTermination, StoppingReasonKind } from './PlanningTermination.js';

export class StoppingDecision {
  constructor({
    shouldStop = false,
    reason = StoppingReasonKind.NO_ACTIONABLE_GAPS,
    termination = PlanningTermination.COMPLETE,
    explanation = '',
    satisfiedGoalsCount = 0,
    totalGoalsCount = 0
  }) {
    this.shouldStop = Boolean(shouldStop);
    this.reason = reason;
    this.termination = termination;
    this.explanation = String(explanation || '');
    this.satisfiedGoalsCount = Number(satisfiedGoalsCount);
    this.totalGoalsCount = Number(totalGoalsCount);
    Object.freeze(this);
  }

  toJSON() {
    return {
      shouldStop: this.shouldStop,
      reason: this.reason,
      termination: this.termination,
      explanation: this.explanation,
      satisfiedGoalsCount: this.satisfiedGoalsCount,
      totalGoalsCount: this.totalGoalsCount
    };
  }
}
