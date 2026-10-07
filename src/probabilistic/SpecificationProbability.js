import { BetaPosterior } from './BetaPosterior.js';
import { ProbabilityInterval } from './ProbabilityInterval.js';

export class SpecificationProbability {
  constructor({
    specificationId,
    posterior = new BetaPosterior(1, 1),
    satisfactionProbability = 0.5,
    credibleInterval = new ProbabilityInterval(0, 1, 0.5)
  }) {
    this.specificationId = specificationId;
    this.posterior = posterior;
    this.satisfactionProbability = satisfactionProbability;
    this.credibleInterval = credibleInterval;
    Object.freeze(this);
  }

  toJSON() {
    return {
      specificationId: this.specificationId,
      satisfactionProbability: this.satisfactionProbability,
      credibleInterval: this.credibleInterval.toJSON(),
      posterior: this.posterior.toJSON()
    };
  }
}
