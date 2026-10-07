import { TransitionProbability } from './TransitionProbability.js';
import { ProbabilityInterval } from './ProbabilityInterval.js';

export class ProbabilisticTransitionModel {
  constructor(subject = 'system', rareThreshold = 0.05) {
    this.subject = subject;
    this.rareThreshold = rareThreshold;
    this.transitions = new Map(); // "from->to" -> count
    this.outgoingTotals = new Map(); // from -> totalCount
  }

  recordTransition(fromState, toState, count = 1) {
    const key = `${fromState}->${toState}`;
    this.transitions.set(key, (this.transitions.get(key) || 0) + count);
    this.outgoingTotals.set(fromState, (this.outgoingTotals.get(fromState) || 0) + count);
    return this;
  }

  getTransitionProbability(fromState, toState) {
    const key = `${fromState}->${toState}`;
    const count = this.transitions.get(key) || 0;
    const totalOut = this.outgoingTotals.get(fromState) || 0;
    if (totalOut === 0) {
      return new TransitionProbability({
        fromState,
        toState,
        observedCount: 0,
        probability: 0.0
      });
    }

    const prob = count / totalOut;
    const sd = Math.sqrt((prob * (1 - prob)) / totalOut);
    const interval = new ProbabilityInterval(
      Math.max(0, prob - 1.96 * sd),
      Math.min(1, prob + 1.96 * sd),
      prob
    );
    const isRare = prob < this.rareThreshold;

    return new TransitionProbability({
      fromState,
      toState,
      observedCount: count,
      probability: prob,
      interval,
      isRare
    });
  }

  getAllTransitions() {
    const res = [];
    for (const key of this.transitions.keys()) {
      const [fromState, toState] = key.split('->');
      res.push(this.getTransitionProbability(fromState, toState));
    }
    return res;
  }

  getRareTransitions() {
    return this.getAllTransitions().filter(tp => tp.isRare && tp.observedCount > 0);
  }

  toJSON() {
    return {
      subject: this.subject,
      transitions: this.getAllTransitions().map(t => t.toJSON())
    };
  }
}
