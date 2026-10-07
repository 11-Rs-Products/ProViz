/**
 * ChangeRiskForecast.js
 * Forecasts risk of planned code change sets based on blast radius, coupling, and historical failure rate.
 */

import { ForecastTier } from './DependencyForecast.js';

export class ChangeRiskForecast {
  /**
   * @param {Object} options
   * @param {string[]} options.changedEntityIds
   * @param {number} options.predictedRiskScore
   * @param {number} options.estimatedBlastRadius
   * @param {number} [options.confidence=0.8]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   * @param {string[]} [options.riskFactors=[]]
   */
  constructor({
    changedEntityIds = [],
    predictedRiskScore,
    estimatedBlastRadius,
    confidence = 0.8,
    tier = ForecastTier.PROBABILISTIC,
    riskFactors = []
  }) {
    this.changedEntityIds = Object.freeze([...changedEntityIds]);
    this.predictedRiskScore = Number(predictedRiskScore.toFixed(4));
    this.estimatedBlastRadius = estimatedBlastRadius;
    this.confidence = confidence;
    this.tier = tier;
    this.riskFactors = Object.freeze([...riskFactors]);
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      changedEntityIds: [...this.changedEntityIds],
      predictedRiskScore: this.predictedRiskScore,
      estimatedBlastRadius: this.estimatedBlastRadius,
      confidence: this.confidence,
      tier: this.tier,
      riskFactors: [...this.riskFactors],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ChangeRiskForecast(json);
  }
}
