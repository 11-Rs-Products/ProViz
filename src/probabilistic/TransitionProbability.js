import { ProbabilityInterval } from './ProbabilityInterval.js';

export class TransitionProbability {
  constructor({
    fromState,
    toState,
    action = 'transition',
    observedCount = 0,
    probability = 0.0,
    interval = null,
    isRare = false
  }) {
    this.fromState = fromState;
    this.toState = toState;
    this.action = action;
    this.observedCount = observedCount;
    this.probability = probability;
    this.interval = interval || new ProbabilityInterval(0, 1, probability);
    this.isRare = isRare;
    Object.freeze(this);
  }

  toJSON() {
    return {
      fromState: this.fromState,
      toState: this.toState,
      action: this.action,
      observedCount: this.observedCount,
      probability: this.probability,
      interval: this.interval.toJSON(),
      isRare: this.isRare
    };
  }
}
