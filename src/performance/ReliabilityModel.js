/**
 * ReliabilityModel.js
 * Represents statistical reliability indicators: FAILURE_RATE, ERROR_RATE, RECOVERY_RATE, MTBF, MTTR, AVAILABILITY, RETRY_RATE, FAULT_FREQUENCY.
 */

export class ReliabilityModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {number} [options.failureRate=0.001]
   * @param {number} [options.errorRate=0.001]
   * @param {number} [options.availability=0.999] - 99.9%
   * @param {number} [options.mtbfHours=1000] - Mean Time Between Failures
   * @param {number} [options.mttrSeconds=5] - Mean Time To Recovery
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    failureRate = 0.001,
    errorRate = 0.001,
    availability = 0.999,
    mtbfHours = 1000,
    mttrSeconds = 5,
    metadata = {}
  }) {
    if (!id) throw new Error('ReliabilityModel requires id');
    this.id = id;
    this.failureRate = failureRate;
    this.errorRate = errorRate;
    this.availability = availability;
    this.mtbfHours = mtbfHours;
    this.mttrSeconds = mttrSeconds;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      failureRate: this.failureRate,
      errorRate: this.errorRate,
      availability: this.availability,
      mtbfHours: this.mtbfHours,
      mttrSeconds: this.mttrSeconds,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ReliabilityModel(json);
  }
}
