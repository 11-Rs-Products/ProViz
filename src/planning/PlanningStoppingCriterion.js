import { StoppingDecision } from './StoppingDecision.js';
import { PlanningTermination, StoppingReasonKind } from './PlanningTermination.js';

export class PlanningStoppingCriterion {
  constructor({
    confidenceThreshold = 0.95,
    uncertaintyThreshold = 0.05,
    maxIterations = 50,
    maxTimeMs = 10000
  } = {}) {
    this.confidenceThreshold = Number(confidenceThreshold);
    this.uncertaintyThreshold = Number(uncertaintyThreshold);
    this.maxIterations = Number(maxIterations);
    this.maxTimeMs = Number(maxTimeMs);
    Object.freeze(this);
  }

  evaluate(state = {}) {
    const goals = state.goals || [];
    const satisfied = goals.filter(g => g.isSatisfied()).length;
    const total = goals.length;

    if (state.confidence !== undefined && state.confidence >= this.confidenceThreshold) {
      return new StoppingDecision({
        shouldStop: true,
        reason: StoppingReasonKind.CONFIDENCE_THRESHOLD,
        termination: PlanningTermination.COMPLETE,
        explanation: `Confidence threshold (${this.confidenceThreshold}) satisfied.`,
        satisfiedGoalsCount: satisfied,
        totalGoalsCount: total
      });
    }

    if (total > 0 && satisfied === total) {
      // If stopped due to high confidence on goals without explicit SATISFIED status
      const allExplicitlySatisfied = goals.every(g => g.status === 'SATISFIED');
      const reason = allExplicitlySatisfied ? StoppingReasonKind.ALL_GOALS_SATISFIED : StoppingReasonKind.CONFIDENCE_THRESHOLD;

      return new StoppingDecision({
        shouldStop: true,
        reason,
        termination: PlanningTermination.COMPLETE,
        explanation: `All ${total} verification goals satisfied.`,
        satisfiedGoalsCount: satisfied,
        totalGoalsCount: total
      });
    }

    if ((state.iterationCount || 0) >= this.maxIterations) {
      return new StoppingDecision({
        shouldStop: true,
        reason: StoppingReasonKind.MAX_ITERATIONS,
        termination: PlanningTermination.BUDGET_EXHAUSTED,
        explanation: `Max iterations (${this.maxIterations}) reached.`,
        satisfiedGoalsCount: satisfied,
        totalGoalsCount: total
      });
    }

    if ((state.elapsedTimeMs || 0) >= this.maxTimeMs) {
      return new StoppingDecision({
        shouldStop: true,
        reason: StoppingReasonKind.TIMEOUT,
        termination: PlanningTermination.TIMEOUT,
        explanation: `Time budget (${this.maxTimeMs} ms) exceeded.`,
        satisfiedGoalsCount: satisfied,
        totalGoalsCount: total
      });
    }

    if (state.activeGapsCount === 0) {
      return new StoppingDecision({
        shouldStop: true,
        reason: StoppingReasonKind.NO_ACTIONABLE_GAPS,
        termination: PlanningTermination.COMPLETE,
        explanation: 'No remaining actionable evidence gaps.',
        satisfiedGoalsCount: satisfied,
        totalGoalsCount: total
      });
    }

    return new StoppingDecision({
      shouldStop: false,
      reason: null,
      termination: null,
      explanation: 'Planning continues.',
      satisfiedGoalsCount: satisfied,
      totalGoalsCount: total
    });
  }
}
