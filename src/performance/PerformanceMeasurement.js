/**
 * PerformanceMeasurement.js
 * Represents a single controlled empirical measurement execution and its captured distributions.
 */

import { MetricDistribution } from './MetricDistribution.js';

export class PerformanceMeasurement {
  /**
   * @param {Object} options
   * @param {string} options.measurementId
   * @param {string} options.workloadId
   * @param {string} [options.environment='default']
   * @param {Object} [options.metrics={}] - property -> MetricDistribution or PerformanceMetric
   * @param {number} [options.durationMs=0]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    measurementId,
    workloadId,
    environment = 'default',
    metrics = {},
    durationMs = 0,
    timestamp = Date.now()
  }) {
    if (!measurementId || !workloadId) {
      throw new Error('PerformanceMeasurement requires measurementId and workloadId');
    }
    this.measurementId = measurementId;
    this.workloadId = workloadId;
    this.environment = environment;
    this.metrics = Object.freeze({ ...metrics });
    this.durationMs = durationMs;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  getDistribution(property) {
    const m = this.metrics[property];
    if (m instanceof MetricDistribution) return m;
    if (m && typeof m === 'object' && m.mean !== undefined) return MetricDistribution.fromJSON(m);
    if (typeof m === 'number') return new MetricDistribution([m]);
    return null;
  }

  toJSON() {
    return {
      measurementId: this.measurementId,
      workloadId: this.workloadId,
      environment: this.environment,
      metrics: { ...this.metrics },
      durationMs: this.durationMs,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new PerformanceMeasurement(json);
  }
}
