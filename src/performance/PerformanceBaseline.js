/**
 * PerformanceBaseline.js
 * Immutable historical performance baseline against which variants/changes are compared.
 */

export class PerformanceBaseline {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} options.workloadId
   * @param {string} options.environment
   * @param {Object} options.metrics - property -> MetricDistribution or numeric value
   * @param {Array<string>} [options.provenance=[]]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    name = '',
    workloadId,
    environment = 'default',
    metrics = {},
    provenance = [],
    timestamp = Date.now()
  }) {
    if (!id || !workloadId) throw new Error('PerformanceBaseline requires id and workloadId');
    this.id = id;
    this.name = name || id;
    this.workloadId = workloadId;
    this.environment = environment;
    this.metrics = Object.freeze({ ...metrics });
    this.provenance = Object.freeze([...provenance]);
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  getMetricValue(property) {
    const m = this.metrics[property];
    if (m && typeof m === 'object' && m.mean !== undefined) return m.mean;
    return typeof m === 'number' ? m : null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      workloadId: this.workloadId,
      environment: this.environment,
      metrics: { ...this.metrics },
      provenance: [...this.provenance],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new PerformanceBaseline(json);
  }
}
