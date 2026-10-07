import { ProbabilityInterval } from './ProbabilityInterval.js';

export class PosteriorModel {
  constructor({
    type = 'Beta',
    prior,
    parameters = {},
    mean = 0.5,
    credibleInterval = new ProbabilityInterval(0, 1, 0.5),
    observations = {}
  }) {
    this.type = type;
    this.prior = prior;
    this.parameters = Object.freeze({ ...parameters });
    this.mean = mean;
    this.credibleInterval = credibleInterval;
    this.observations = Object.freeze({ ...observations });
    Object.freeze(this);
  }

  toJSON() {
    return {
      type: this.type,
      prior: this.prior ? (this.prior.toJSON ? this.prior.toJSON() : this.prior) : null,
      parameters: this.parameters,
      mean: this.mean,
      credibleInterval: this.credibleInterval.toJSON(),
      observations: this.observations
    };
  }
}
