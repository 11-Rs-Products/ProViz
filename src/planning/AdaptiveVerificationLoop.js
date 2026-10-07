import { VerificationLoop } from './VerificationLoop.js';
import { AdaptiveExperimentPlanner } from './AdaptiveExperimentPlanner.js';
import { VerificationIteration } from './VerificationIteration.js';
import { ExperimentResult } from './ExperimentResult.js';

export class AdaptiveVerificationLoop extends VerificationLoop {
  runUntilSettled(context = {}) {
    return this.run(context);
  }

  run(context = {}) {
    this.currentContext = { ...context, goals: this.goals };
    let iterCount = 0;
    let lastResult = null;

    while (iterCount < this.maxIterations) {
      iterCount++;
      const replan = AdaptiveExperimentPlanner.replan(lastResult, this.currentContext, this.policy);
      this.goals = replan.updatedGoals;
      this.currentContext.goals = this.goals;

      if (replan.activeGaps.length === 0 || !replan.selectedExperiment) {
        break;
      }

      const selected = replan.selectedExperiment;
      let result = null;
      if (typeof this.executorFn === 'function') {
        result = this.executorFn(selected.experiment, this.currentContext);
      } else {
        result = new ExperimentResult({
          experimentId: selected.experiment.id,
          success: true,
          outcome: 'SUCCESS',
          confidenceDelta: selected.expectedValue.confidenceGain,
          uncertaintyReduction: selected.expectedValue.uncertaintyReduction
        });
      }

      lastResult = result;
      const iter = new VerificationIteration({
        iterationNumber: iterCount,
        gapsCount: replan.activeGaps.length,
        candidatesCount: replan.candidates.length,
        selectedExperiment: selected,
        result,
        confidenceDelta: result?.confidenceDelta || 0,
        uncertaintyDelta: result?.uncertaintyReduction || 0
      });
      this.iterations.push(iter);
    }

    return {
      iterations: this.iterations,
      completedIterations: iterCount,
      finalContext: this.currentContext,
      updatedGoals: this.goals
    };
  }
}
