import { ProbabilityInterval } from './ProbabilityInterval.js';

export class StateProbability {
  constructor({
    stateId,
    observedVisits = 0,
    visitationProbability = 0.0,
    interval = null,
    isRare = false
  }) {
    this.stateId = stateId;
    this.observedVisits = observedVisits;
    this.visitationProbability = visitationProbability;
    this.interval = interval || new ProbabilityInterval(0, 1, visitationProbability);
    this.isRare = isRare;
    Object.freeze(this);
  }

  toJSON() {
    return {
      stateId: this.stateId,
      observedVisits: this.observedVisits,
      visitationProbability: this.visitationProbability,
      interval: this.interval.toJSON(),
      isRare: this.isRare
    };
  }
}
