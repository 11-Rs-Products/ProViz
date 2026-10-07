import { StateProbability } from './StateProbability.js';
import { ProbabilityInterval } from './ProbabilityInterval.js';

export class ProbabilisticStateModel {
  constructor(subject = 'system', rareThreshold = 0.01) {
    this.subject = subject;
    this.rareThreshold = rareThreshold;
    this.stateVisits = new Map(); // stateId -> count
    this.totalVisits = 0;
  }

  recordState(stateId, count = 1) {
    const curr = this.stateVisits.get(stateId) || 0;
    this.stateVisits.set(stateId, curr + count);
    this.totalVisits += count;
    return this;
  }

  getStateProbability(stateId) {
    const count = this.stateVisits.get(stateId) || 0;
    if (this.totalVisits === 0) {
      return new StateProbability({ stateId, observedVisits: 0, visitationProbability: 0 });
    }
    const prob = count / this.totalVisits;
    const sd = Math.sqrt((prob * (1 - prob)) / this.totalVisits);
    const interval = new ProbabilityInterval(
      Math.max(0, prob - 1.96 * sd),
      Math.min(1, prob + 1.96 * sd),
      prob
    );
    const isRare = prob < this.rareThreshold;
    return new StateProbability({
      stateId,
      observedVisits: count,
      visitationProbability: prob,
      interval,
      isRare
    });
  }

  getAllStateProbabilities() {
    return Array.from(this.stateVisits.keys()).map(s => this.getStateProbability(s));
  }

  getRareStates() {
    return this.getAllStateProbabilities().filter(sp => sp.isRare && sp.observedVisits > 0);
  }

  toJSON() {
    return {
      subject: this.subject,
      totalVisits: this.totalVisits,
      states: this.getAllStateProbabilities().map(sp => sp.toJSON())
    };
  }
}
