/**
 * ChangeForecast.js
 * Forecasts future change churn, regression probability, and evidence invalidation volume.
 * Invariant: PROBABILISTIC estimate, not formal proof.
 */

import { ForecastTier } from './DependencyForecast.js';

export class ChangeForecast {
  /**
   * @param {Object} options
   * @param {string} options.targetEntityId
   * @param {number} options.predictedChurnRate
   * @param {number} options.predictedRegressionRisk
   * @param {number} [options.confidence=0.75]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   * @param {number} [options.horizonChanges=10]
   */
  constructor({
    targetEntityId,
    predictedChurnRate,
    predictedRegressionRisk,
    confidence = 0.75,
    tier = ForecastTier.PROBABILISTIC,
    horizonChanges = 10
  }) {
    this.targetEntityId = targetEntityId;
    this.predictedChurnRate = Number(predictedChurnRate.toFixed(4));
    this.predictedRegressionRisk = Number(predictedRegressionRisk.toFixed(4));
    this.confidence = confidence;
    this.tier = tier;
    this.horizonChanges = horizonChanges;
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      targetEntityId: this.targetEntityId,
      predictedChurnRate: this.predictedChurnRate,
      predictedRegressionRisk: this.predictedRegressionRisk,
      confidence: this.confidence,
      tier: this.tier,
      horizonChanges: this.horizonChanges,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ChangeForecast(json);
  }
}
