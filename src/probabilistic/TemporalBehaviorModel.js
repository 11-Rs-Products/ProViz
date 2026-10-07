import { SequenceProbability } from './SequenceProbability.js';
import { TemporalDistribution } from './TemporalDistribution.js';
import { ProbabilityInterval } from './ProbabilityInterval.js';

export class TemporalBehaviorModel {
  constructor(subject = 'system') {
    this.subject = subject;
    this.pairCounts = new Map(); // "A->B" -> count
    this.prefixCounts = new Map(); // "A" -> count
    this.totalSequences = 0;
    this.timingDistributions = new Map(); // event -> TemporalDistribution
  }

  recordSequence(events = []) {
    if (!events || events.length < 2) return this;
    this.totalSequences++;

    for (let i = 0; i < events.length - 1; i++) {
      const a = events[i];
      const b = events[i + 1];
      const key = `${a}->${b}`;
      this.pairCounts.set(key, (this.pairCounts.get(key) || 0) + 1);
      this.prefixCounts.set(a, (this.prefixCounts.get(a) || 0) + 1);
    }
    return this;
  }

  recordTiming(event, durationMs) {
    let td = this.timingDistributions.get(event);
    if (!td) {
      td = new TemporalDistribution(event);
    }
    this.timingDistributions.set(event, td.recordTime(durationMs));
    return this;
  }

  getConditionalProbability(a, b) {
    const key = `${a}->${b}`;
    const pairCount = this.pairCounts.get(key) || 0;
    const prefCount = this.prefixCounts.get(a) || 0;

    if (prefCount === 0) {
      return new SequenceProbability({
        sequence: [a, b],
        count: 0,
        probability: 0.0,
        prefixCount: 0,
        conditionalProbability: 0.0
      });
    }

    const condProb = pairCount / prefCount;
    const sd = Math.sqrt((condProb * (1 - condProb)) / prefCount);
    const interval = new ProbabilityInterval(
      Math.max(0, condProb - 1.96 * sd),
      Math.min(1, condProb + 1.96 * sd),
      condProb
    );

    return new SequenceProbability({
      sequence: [a, b],
      count: pairCount,
      probability: this.totalSequences > 0 ? pairCount / this.totalSequences : 0,
      prefixCount: prefCount,
      conditionalProbability: condProb,
      interval
    });
  }

  getTimingDistribution(event) {
    return this.timingDistributions.get(event) || new TemporalDistribution(event);
  }

  toJSON() {
    const pairs = {};
    for (const [k, v] of this.pairCounts.entries()) pairs[k] = v;
    const timings = {};
    for (const [k, v] of this.timingDistributions.entries()) timings[k] = v.toJSON();
    return {
      subject: this.subject,
      totalSequences: this.totalSequences,
      pairTransitions: pairs,
      timings
    };
  }
}
