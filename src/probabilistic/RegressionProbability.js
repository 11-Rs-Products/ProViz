import { ProbabilityInterval } from './ProbabilityInterval.js';

export class RegressionProbability {
  constructor({
    probability = 0.0,
    interval = new ProbabilityInterval(0, 1, 0.0),
    severity = 'LOW' // LOW, MEDIUM, HIGH, CRITICAL
  }) {
    this.probability = probability;
    this.interval = interval;
    this.severity = severity;
    Object.freeze(this);
  }

  toJSON() {
    return {
      probability: this.probability,
      interval: this.interval.toJSON(),
      severity: this.severity
    };
  }
}
