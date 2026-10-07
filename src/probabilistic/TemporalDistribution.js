import { ProbabilityDistribution } from './ProbabilityDistribution.js';
import { EmpiricalDistribution } from './EmpiricalDistribution.js';

export class TemporalDistribution extends ProbabilityDistribution {
  constructor(event = 'default', empirical = null) {
    super('temporal');
    this.event = event;
    this.empirical = empirical || new EmpiricalDistribution();
  }

  recordTime(durationMs) {
    return new TemporalDistribution(this.event, this.empirical.addSample(durationMs));
  }

  recordTimes(durations = []) {
    return new TemporalDistribution(this.event, this.empirical.addSamples(durations));
  }

  get count() {
    return this.empirical.count;
  }

  mean() {
    return this.empirical.mean();
  }

  median() {
    return this.empirical.median();
  }

  variance() {
    return this.empirical.variance();
  }

  percentile(p) {
    return this.empirical.percentile(p);
  }

  toJSON() {
    return {
      type: 'temporal',
      event: this.event,
      empirical: this.empirical.toJSON()
    };
  }
}
