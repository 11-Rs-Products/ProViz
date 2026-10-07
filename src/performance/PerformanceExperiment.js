/**
 * PerformanceExperiment.js
 * Represents a multi-variant controlled benchmark experiment with warmup, replications, and measurement windows.
 */

export class PerformanceExperiment {
  /**
   * @param {Object} options
   * @param {string} options.experimentId
   * @param {string} [options.name='']
   * @param {string} options.baselineId
   * @param {string} options.variantId
   * @param {string} options.workloadId
   * @param {number} [options.replications=3]
   * @param {number} [options.warmupIterations=1]
   * @param {number} [options.measurementWindowMs=5000]
   * @param {Object} [options.environment={}]
   */
  constructor({
    experimentId,
    name = '',
    baselineId,
    variantId,
    workloadId,
    replications = 3,
    warmupIterations = 1,
    measurementWindowMs = 5000,
    environment = {}
  }) {
    if (!experimentId || !baselineId || !variantId || !workloadId) {
      throw new Error('PerformanceExperiment requires experimentId, baselineId, variantId, and workloadId');
    }
    this.experimentId = experimentId;
    this.name = name || experimentId;
    this.baselineId = baselineId;
    this.variantId = variantId;
    this.workloadId = workloadId;
    this.replications = Math.max(1, Number(replications) || 3);
    this.warmupIterations = Math.max(0, Number(warmupIterations) || 1);
    this.measurementWindowMs = Math.max(100, Number(measurementWindowMs) || 5000);
    this.environment = Object.freeze({ ...environment });
    Object.freeze(this);
  }

  toJSON() {
    return {
      experimentId: this.experimentId,
      name: this.name,
      baselineId: this.baselineId,
      variantId: this.variantId,
      workloadId: this.workloadId,
      replications: this.replications,
      warmupIterations: this.warmupIterations,
      measurementWindowMs: this.measurementWindowMs,
      environment: { ...this.environment }
    };
  }

  static fromJSON(json) {
    return new PerformanceExperiment(json);
  }
}
