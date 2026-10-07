export class ProbabilisticTransition {
  constructor({
    fromState,
    toState,
    trigger = null,
    probability = 1.0,
    observationCount = 0
  }) {
    this.fromState = fromState;
    this.toState = toState;
    this.trigger = trigger;
    this.probability = probability;
    this.observationCount = observationCount;
    Object.freeze(this);
  }

  toJSON() {
    return {
      fromState: this.fromState,
      toState: this.toState,
      trigger: this.trigger,
      probability: this.probability,
      observationCount: this.observationCount
    };
  }
}
