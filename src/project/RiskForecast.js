/**
 * RiskForecast.js
 * Forecasts project-level and component-level failure probabilities.
 * Invariant: Predictions are PROBABILISTIC estimates, never formal proofs.
 */

import { ForecastTier } from './DependencyForecast.js';

export class RiskForecast {
  /**
   * @param {Object} options
   * @param {string} options.targetScope
   * @param {number} options.predictedFailureProbability
   * @param {number} options.predictedBlastRadius
   * @param {number} [options.confidence=0.75]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   * @param {string[]} [options.riskFactors=[]]
   * @param {number} [options.timeHorizonDays=30]
   */
  constructor({
    targetScope,
    predictedFailureProbability,
    predictedBlastRadius,
    confidence = 0.75,
    tier = ForecastTier.PROBABILISTIC,
    riskFactors = [],
    timeHorizonDays = 30
  }) {
    if (!targetScope) throw new Error('RiskForecast requires targetScope');
    this.targetScope = targetScope;
    this.predictedFailureProbability = Number(predictedFailureProbability.toFixed(4));
    this.predictedBlastRadius = predictedBlastRadius;
    this.confidence = confidence;
    this.tier = tier;
    this.riskFactors = Object.freeze([...riskFactors]);
    this.timeHorizonDays = timeHorizonDays;
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      targetScope: this.targetScope,
      predictedFailureProbability: this.predictedFailureProbability,
      predictedBlastRadius: this.predictedBlastRadius,
      confidence: this.confidence,
      tier: this.tier,
      riskFactors: [...this.riskFactors],
      timeHorizonDays: this.timeHorizonDays,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new RiskForecast(json);
  }
}
