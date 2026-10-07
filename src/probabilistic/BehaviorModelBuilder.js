import { BehaviorOutcome } from './BehaviorOutcome.js';
import { BehaviorProbability } from './BehaviorProbability.js';
import { BehaviorDistribution } from './BehaviorDistribution.js';
import { DirichletPosterior } from './DirichletPosterior.js';
import { ConfidenceScale } from './ConfidenceScale.js';
import { EvidenceSet } from './EvidenceSet.js';

export class BehaviorModelBuilder {
  constructor(subject, inputRegion = 'default') {
    this.subject = subject;
    this.inputRegion = inputRegion;
    this.outcomeCounts = new Map(); // outcomeId -> { outcome, count, evidence: [] }
    this.total = 0;
  }

  addObservation(outcome, evidence = null) {
    const id = outcome.id;
    if (!this.outcomeCounts.has(id)) {
      this.outcomeCounts.set(id, { outcome, count: 0, evidence: [] });
    }
    const entry = this.outcomeCounts.get(id);
    entry.count++;
    if (evidence) {
      entry.evidence.push(evidence);
    }
    this.total++;
    return this;
  }

  addObservations(outcome, count, evidenceList = []) {
    const id = outcome.id;
    if (!this.outcomeCounts.has(id)) {
      this.outcomeCounts.set(id, { outcome, count: 0, evidence: [] });
    }
    const entry = this.outcomeCounts.get(id);
    entry.count += count;
    if (evidenceList.length > 0) {
      entry.evidence.push(...evidenceList);
    }
    this.total += count;
    return this;
  }

  build() {
    const alphas = {};
    const counts = {};
    for (const [id, entry] of this.outcomeCounts.entries()) {
      alphas[id] = 1.0;
      counts[id] = entry.count;
    }

    let dirichlet = new DirichletPosterior(alphas);
    if (Object.keys(counts).length > 0) {
      dirichlet = dirichlet.update(counts);
    }

    const probabilities = new Map();
    for (const [id, entry] of this.outcomeCounts.entries()) {
      const marginal = dirichlet.marginalBeta(id);
      const estProb = marginal.mean;
      const interval = marginal.interval;

      let conf = ConfidenceScale.LOW;
      if (entry.count > 500) conf = ConfidenceScale.HIGH;
      else if (entry.count > 50) conf = ConfidenceScale.MEDIUM;
      else if (entry.count > 5) conf = ConfidenceScale.LOW;
      else conf = ConfidenceScale.VERY_LOW;

      probabilities.set(
        id,
        new BehaviorProbability({
          outcome: entry.outcome,
          observedFrequency: entry.count,
          estimatedProbability: estProb,
          evidenceCount: entry.evidence.length || entry.count,
          confidenceInterval: interval,
          confidence: conf,
          supportingEvidence: entry.evidence,
          contradictingEvidence: []
        })
      );
    }

    return new BehaviorDistribution({
      subject: this.subject,
      inputRegion: this.inputRegion,
      outcomes: probabilities,
      totalObservations: this.total,
      dirichlet
    });
  }
}
