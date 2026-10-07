/**
 * EngineeringForecast.js
 * Synthesizes multidimensional engineering forecasts (failure, regression, architecture risk, verification cost).
 * Invariant: Forecasts are PROBABILISTIC estimates, NOT proofs.
 */

import { ForecastTier } from './DependencyForecast.js';

export class EngineeringForecast {
  /**
   * @param {Object} options
   * @param {number} options.predictedOverallFailureRisk
   * @param {number} options.predictedRegressionProbability
   * @param {number} options.estimatedVerificationCostHours
   * @param {number} [options.confidence=0.75]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   * @param {Object} [options.forecastBreakdown={}]
   * @param {number} [options.timeHorizonDays=30]
   */
  constructor({
    predictedOverallFailureRisk,
    predictedRegressionProbability,
    estimatedVerificationCostHours,
    confidence = 0.75,
    tier = ForecastTier.PROBABILISTIC,
    forecastBreakdown = {},
    timeHorizonDays = 30
  }) {
    this.predictedOverallFailureRisk = Number(predictedOverallFailureRisk.toFixed(4));
    this.predictedRegressionProbability = Number(predictedRegressionProbability.toFixed(4));
    this.estimatedVerificationCostHours = Number(estimatedVerificationCostHours.toFixed(2));
    this.confidence = confidence;
    this.tier = tier;
    this.forecastBreakdown = Object.freeze({ ...forecastBreakdown });
    this.timeHorizonDays = timeHorizonDays;
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      predictedOverallFailureRisk: this.predictedOverallFailureRisk,
      predictedRegressionProbability: this.predictedRegressionProbability,
      estimatedVerificationCostHours: this.estimatedVerificationCostHours,
      confidence: this.confidence,
      tier: this.tier,
      forecastBreakdown: this.forecastBreakdown,
      timeHorizonDays: this.timeHorizonDays,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new EngineeringForecast(json);
  }
}
