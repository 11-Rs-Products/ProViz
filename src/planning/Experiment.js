import { ExperimentKind } from './ExperimentKind.js';
import { ExperimentBudget } from './ExperimentBudget.js';

export class Experiment {
  constructor({
    id,
    kind = ExperimentKind.STATIC_VERIFY,
    target,
    preconditions = [],
    inputs = [],
    budget = new ExperimentBudget(),
    expectedInformationGain = 0.5,
    estimatedCost = 10,
    risk = 0.5,
    dependencies = [],
    parameters = {},
    metadata = {}
  }) {
    this.id = id || `exp_${kind}_${String(target)}_${Date.now()}`;
    this.kind = kind;
    this.target = String(target);
    this.preconditions = Object.freeze([...preconditions]);
    this.inputs = Object.freeze([...inputs]);
    this.budget = budget instanceof ExperimentBudget ? budget : new ExperimentBudget(budget);
    this.expectedInformationGain = Number(expectedInformationGain);
    this.estimatedCost = Number(estimatedCost);
    this.risk = Number(risk);
    this.dependencies = Object.freeze([...dependencies]);
    this.parameters = Object.freeze({ ...parameters });
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      target: this.target,
      preconditions: this.preconditions,
      inputs: this.inputs,
      budget: this.budget.toJSON(),
      expectedInformationGain: this.expectedInformationGain,
      estimatedCost: this.estimatedCost,
      risk: this.risk,
      dependencies: this.dependencies,
      parameters: this.parameters,
      metadata: this.metadata
    };
  }
}
