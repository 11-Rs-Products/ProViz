/**
 * CapabilityHealth.js
 * Tracks the real-time operational status, error rate, and latency of a registered capability.
 */

export class CapabilityHealth {
  /**
   * @param {Object} [options]
   * @param {boolean} [options.isAvailable=true]
   * @param {number} [options.latencyMs=0]
   * @param {number} [options.errorRate=0]
   * @param {string|null} [options.lastError=null]
   */
  constructor({
    isAvailable = true,
    latencyMs = 0,
    errorRate = 0,
    lastError = null
  } = {}) {
    this.isAvailable = Boolean(isAvailable);
    this.latencyMs = latencyMs;
    this.errorRate = errorRate;
    this.lastError = lastError;
    this.lastCheckTime = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      isAvailable: this.isAvailable,
      latencyMs: this.latencyMs,
      errorRate: this.errorRate,
      lastError: this.lastError,
      lastCheckTime: this.lastCheckTime
    };
  }

  static fromJSON(json) {
    return new CapabilityHealth(json);
  }
}
