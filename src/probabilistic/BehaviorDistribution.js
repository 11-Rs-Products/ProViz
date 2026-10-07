import { BehaviorProbability } from './BehaviorProbability.js';
import { DirichletPosterior } from './DirichletPosterior.js';
import { ConfidenceScale } from './ConfidenceScale.js';

export class BehaviorDistribution {
  constructor({
    subject,
    inputRegion = 'default',
    outcomes = new Map(), // outcomeId -> BehaviorProbability
    totalObservations = 0,
    dirichlet = null
  }) {
    this.subject = subject;
    this.inputRegion = inputRegion;
    this.outcomes = new Map(outcomes);
    this.totalObservations = totalObservations;
    this.dirichlet = dirichlet || new DirichletPosterior();
    Object.freeze(this);
  }

  getOutcome(outcomeId) {
    return this.outcomes.get(outcomeId) || null;
  }

  getAllOutcomes() {
    return Array.from(this.outcomes.values());
  }

  probabilityOf(outcomeId) {
    const p = this.outcomes.get(outcomeId);
    return p ? p.estimatedProbability : 0.0;
  }

  topOutcomes(k = 3) {
    return this.getAllOutcomes()
      .sort((a, b) => b.estimatedProbability - a.estimatedProbability)
      .slice(0, k);
  }

  isDominatedBy(outcomeId, threshold = 0.95) {
    const p = this.probabilityOf(outcomeId);
    return p >= threshold;
  }

  toJSON() {
    const outcomesObj = {};
    for (const [k, v] of this.outcomes.entries()) {
      outcomesObj[k] = v.toJSON();
    }
    return {
      subject: this.subject,
      inputRegion: this.inputRegion,
      totalObservations: this.totalObservations,
      outcomes: outcomesObj,
      dirichlet: this.dirichlet.toJSON()
    };
  }
}
