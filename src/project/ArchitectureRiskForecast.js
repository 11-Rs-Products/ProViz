/**
 * ArchitectureRiskForecast.js
 * Forecasts architectural decay, cycle emergence, and boundary erosion over future iterations.
 */

import { ForecastTier } from './DependencyForecast.js';

export class ArchitectureRiskForecast {
  /**
   * @param {Object} options
   * @param {number} options.predictedDriftSeverityScore
   * @param {number} options.predictedNewViolationsCount
   * @param {number} [options.confidence=0.75]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   * @param {string[]} [options.emergingBottlenecks=[]]
   */
  constructor({
    predictedDriftSeverityScore,
    predictedNewViolationsCount,
    confidence = 0.75,
    tier = ForecastTier.PROBABILISTIC,
    emergingBottlenecks = []
  }) {
    this.predictedDriftSeverityScore = Number(predictedDriftSeverityScore.toFixed(4));
    this.predictedNewViolationsCount = predictedNewViolationsCount;
    this.confidence = confidence;
    this.tier = tier;
    this.emergingBottlenecks = Object.freeze([...emergingBottlenecks]);
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      predictedDriftSeverityScore: this.predictedDriftSeverityScore,
      predictedNewViolationsCount: this.predictedNewViolationsCount,
      confidence: this.confidence,
      tier: this.tier,
      emergingBottlenecks: [...this.emergingBottlenecks],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ArchitectureRiskForecast(json);
  }
}
