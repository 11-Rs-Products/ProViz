/**
 * RegressionForecast.js
 * Forecasts probability of introducing regressions during modification of specific components.
 */

import { ForecastTier } from './DependencyForecast.js';

export class RegressionForecast {
  /**
   * @param {Object} options
   * @param {string} options.targetEntityId
   * @param {number} options.regressionProbability
   * @param {number} [options.confidence=0.75]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   * @param {string[]} [options.historicalIndicators=[]]
   */
  constructor({
    targetEntityId,
    regressionProbability,
    confidence = 0.75,
    tier = ForecastTier.PROBABILISTIC,
    historicalIndicators = []
  }) {
    if (!targetEntityId) throw new Error('RegressionForecast requires targetEntityId');
    this.targetEntityId = targetEntityId;
    this.regressionProbability = Number(regressionProbability.toFixed(4));
    this.confidence = confidence;
    this.tier = tier;
    this.historicalIndicators = Object.freeze([...historicalIndicators]);
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      targetEntityId: this.targetEntityId,
      regressionProbability: this.regressionProbability,
      confidence: this.confidence,
      tier: this.tier,
      historicalIndicators: [...this.historicalIndicators],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new RegressionForecast(json);
  }
}
