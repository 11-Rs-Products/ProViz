import { EarlyStoppingPolicy } from './EarlyStoppingPolicy.js';

export class SequentialEvidenceAnalyzer {
  constructor(policy = new EarlyStoppingPolicy()) {
    this.policy = policy;
  }

  evaluate(state) {
    return this.policy.shouldStop(state);
  }
}
