import { Experiment } from './Experiment.js';
import { ExperimentValue } from './ExperimentValue.js';
import { ExperimentCost } from './ExperimentCost.js';

export class ExperimentCandidate {
  constructor({
    experiment,
    expectedValue = new ExperimentValue(),
    estimatedCost = new ExperimentCost(),
    utility = 0.0,
    rationale = '',
    gapId = null,
    goalId = null
  }) {
    this.experiment = experiment instanceof Experiment ? experiment : new Experiment(experiment);
    this.expectedValue = expectedValue instanceof ExperimentValue ? expectedValue : new ExperimentValue(expectedValue);
    this.estimatedCost = estimatedCost instanceof ExperimentCost ? estimatedCost : new ExperimentCost(estimatedCost);
    this.utility = Number(utility);
    this.rationale = String(rationale || '');
    this.gapId = gapId ? String(gapId) : null;
    this.goalId = goalId ? String(goalId) : null;
    Object.freeze(this);
  }

  toJSON() {
    return {
      experiment: this.experiment.toJSON(),
      expectedValue: this.expectedValue.toJSON(),
      estimatedCost: this.estimatedCost.toJSON(),
      utility: this.utility,
      rationale: this.rationale,
      gapId: this.gapId,
      goalId: this.goalId
    };
  }
}
