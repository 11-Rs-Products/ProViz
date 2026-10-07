/**
 * FailureForecast.js
 * Forecasts probability of runtime faults or operational degradation.
 */

import { ForecastTier } from './DependencyForecast.js';

export class FailureForecast {
  /**
   * @param {Object} options
   * @param {string} options.targetEntityId
   * @param {number} options.failureProbability
   * @param {number} [options.confidence=0.75]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   * @param {string[]} [options.contributingSignals=[]]
   */
  constructor({
    targetEntityId,
    failureProbability,
    confidence = 0.75,
    tier = ForecastTier.PROBABILISTIC,
    contributingSignals = []
  }) {
    if (!targetEntityId) throw new Error('FailureForecast requires targetEntityId');
    this.targetEntityId = targetEntityId;
    this.failureProbability = Number(failureProbability.toFixed(4));
    this.confidence = confidence;
    this.tier = tier;
    this.contributingSignals = Object.freeze([...contributingSignals]);
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      targetEntityId: this.targetEntityId,
      failureProbability: this.failureProbability,
      confidence: this.confidence,
      tier: this.tier,
      contributingSignals: [...this.contributingSignals],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new FailureForecast(json);
  }
}
