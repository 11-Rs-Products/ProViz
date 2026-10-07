/**
 * PerformanceThreshold.js
 * Explicit threshold policies and SLA boundaries governing acceptable performance and resource usage.
 */

export const ThresholdPolicy = Object.freeze({
  MAX_LATENCY: 'MAX_LATENCY',
  MAX_MEMORY: 'MAX_MEMORY',
  MAX_CPU: 'MAX_CPU',
  MIN_THROUGHPUT: 'MIN_THROUGHPUT',
  MAX_ERROR_RATE: 'MAX_ERROR_RATE',
  MAX_ALLOCATION_RATE: 'MAX_ALLOCATION_RATE',
  MAX_RESOURCE_GROWTH: 'MAX_RESOURCE_GROWTH'
});

export class PerformanceThreshold {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.policy - ThresholdPolicy
   * @param {number} options.limit
   * @param {string} [options.unit='']
   * @param {string} [options.scope='GLOBAL']
   * @param {string} [options.severity='HIGH']
   */
  constructor({
    id,
    policy = ThresholdPolicy.MAX_LATENCY,
    limit,
    unit = '',
    scope = 'GLOBAL',
    severity = 'HIGH'
  }) {
    if (!id || limit === undefined) throw new Error('PerformanceThreshold requires id and limit');
    this.id = id;
    this.policy = policy;
    this.limit = Number(limit);
    this.unit = unit;
    this.scope = scope;
    this.severity = severity;
    Object.freeze(this);
  }

  evaluates(value) {
    if (this.policy === ThresholdPolicy.MIN_THROUGHPUT) {
      return value >= this.limit;
    }
    return value <= this.limit;
  }

  toJSON() {
    return {
      id: this.id,
      policy: this.policy,
      limit: this.limit,
      unit: this.unit,
      scope: this.scope,
      severity: this.severity
    };
  }

  static fromJSON(json) {
    return new PerformanceThreshold(json);
  }
}
