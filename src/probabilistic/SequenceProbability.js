import { ProbabilityInterval } from './ProbabilityInterval.js';

export class SequenceProbability {
  constructor({
    sequence = [],
    count = 0,
    probability = 0.0,
    prefixCount = 0,
    conditionalProbability = 0.0,
    interval = null
  }) {
    this.sequence = Object.freeze([...sequence]);
    this.count = count;
    this.probability = probability;
    this.prefixCount = prefixCount;
    this.conditionalProbability = conditionalProbability;
    this.interval = interval || new ProbabilityInterval(0, 1, probability);
    Object.freeze(this);
  }

  toJSON() {
    return {
      sequence: this.sequence,
      count: this.count,
      probability: this.probability,
      prefixCount: this.prefixCount,
      conditionalProbability: this.conditionalProbability,
      interval: this.interval.toJSON()
    };
  }
}
