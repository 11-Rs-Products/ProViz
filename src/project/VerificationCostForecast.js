/**
 * VerificationCostForecast.js
 * Forecasts computational and time verification budget required to reverify project state under planned changes.
 */

import { ForecastTier } from './DependencyForecast.js';

export class VerificationCostForecast {
  /**
   * @param {Object} options
   * @param {number} options.estimatedVerificationTimeMs
   * @param {number} options.estimatedObligationsToVerify
   * @param {number} options.estimatedCpuHours
   * @param {number} [options.confidence=0.85]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   * @param {Object<string, number>} [options.engineCostBreakdown={}]
   */
  constructor({
    estimatedVerificationTimeMs,
    estimatedObligationsToVerify,
    estimatedCpuHours,
    confidence = 0.85,
    tier = ForecastTier.PROBABILISTIC,
    engineCostBreakdown = {}
  }) {
    this.estimatedVerificationTimeMs = estimatedVerificationTimeMs;
    this.estimatedObligationsToVerify = estimatedObligationsToVerify;
    this.estimatedCpuHours = Number(estimatedCpuHours.toFixed(4));
    this.confidence = confidence;
    this.tier = tier;
    this.engineCostBreakdown = Object.freeze({ ...engineCostBreakdown });
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      estimatedVerificationTimeMs: this.estimatedVerificationTimeMs,
      estimatedObligationsToVerify: this.estimatedObligationsToVerify,
      estimatedCpuHours: this.estimatedCpuHours,
      confidence: this.confidence,
      tier: this.tier,
      engineCostBreakdown: this.engineCostBreakdown,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new VerificationCostForecast(json);
  }
}
