import { ExperimentPlanner } from './ExperimentPlanner.js';
import { EvidenceGapAnalyzer } from './EvidenceGapAnalyzer.js';
import { ExperimentSelector, SelectionPolicy } from './ExperimentSelector.js';
import { VerificationGoalStatus } from './VerificationGoalStatus.js';

export class AdaptiveExperimentPlanner {
  replanOnResult(lastResult, gaps = [], context = {}, policy = SelectionPolicy.BALANCED) {
    return AdaptiveExperimentPlanner.replan(lastResult, { ...context, gaps }, policy).candidates;
  }

  /**
   * Replans verification after an experiment execution result.
   */
  static replan(lastResult, currentContext = {}, policy = SelectionPolicy.BALANCED) {
    const updatedGoals = [...(currentContext.goals || [])];

    // If last result found a counterexample or proved a goal, update goal statuses
    if (lastResult?.outcome === 'COUNTEREXAMPLE_FOUND' || lastResult?.outcome === 'PROOF_FOUND' || lastResult?.success) {
      for (let i = 0; i < updatedGoals.length; i++) {
        const g = updatedGoals[i];
        if (g.target === lastResult.target || g.id === lastResult.goalId) {
          if (lastResult.outcome === 'PROOF_FOUND') {
            updatedGoals[i] = g.withStatus(VerificationGoalStatus.SATISFIED, 1.0);
          } else if (lastResult.outcome === 'COUNTEREXAMPLE_FOUND') {
            updatedGoals[i] = g.withStatus(VerificationGoalStatus.SATISFIED, 0.99);
          } else if (lastResult.confidenceDelta > 0) {
            const nextConf = Math.min(1.0, g.currentConfidence + lastResult.confidenceDelta);
            updatedGoals[i] = g.withStatus(nextConf >= g.desiredConfidence ? VerificationGoalStatus.SATISFIED : VerificationGoalStatus.IN_PROGRESS, nextConf);
          }
        }
      }
    }

    // Re-analyze evidence gaps
    const nextGaps = EvidenceGapAnalyzer.analyzeGaps(currentContext);

    // Filter out satisfied gaps/goals
    const activeGaps = nextGaps.filter(gap => {
      const relatedGoal = updatedGoals.find(g => g.target === gap.subject);
      return !relatedGoal || !relatedGoal.isSatisfied();
    });

    const candidates = ExperimentPlanner.planExperiments(activeGaps, updatedGoals, currentContext);
    const selected = ExperimentSelector.selectNext(candidates, policy);

    return {
      updatedGoals,
      activeGaps,
      candidates,
      selectedExperiment: selected
    };
  }
}
