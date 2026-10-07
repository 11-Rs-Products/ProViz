/**
 * CapacityModel.js
 * Represents maximum sustainable operational capacity under explicit SLA and resource constraints.
 */

export class CapacityModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {number} options.maxSafeRps - Max safe requests per second
   * @param {number} options.maxConcurrency
   * @param {string} [options.bottleneckResource='CPU']
   * @param {number} [options.confidence=0.95]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    maxSafeRps,
    maxConcurrency,
    bottleneckResource = 'CPU',
    confidence = 0.95,
    metadata = {}
  }) {
    if (!id || maxSafeRps === undefined || maxConcurrency === undefined) {
      throw new Error('CapacityModel requires id, maxSafeRps, and maxConcurrency');
    }
    this.id = id;
    this.maxSafeRps = Number(maxSafeRps);
    this.maxConcurrency = Number(maxConcurrency);
    this.bottleneckResource = bottleneckResource;
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 0.95));
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      maxSafeRps: this.maxSafeRps,
      maxConcurrency: this.maxConcurrency,
      bottleneckResource: this.bottleneckResource,
      confidence: this.confidence,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new CapacityModel(json);
  }
}
