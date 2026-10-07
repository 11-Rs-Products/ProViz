/**
 * DebtForecast.js
 * Forecasts the compound growth of technical and verification debt if unaddressed.
 * Invariant: PROBABILISTIC / FORECAST tier, not formal proof.
 */

import { ForecastTier } from './DependencyForecast.js';

export class DebtForecast {
  /**
   * @param {Object} options
   * @param {number} options.currentDebtScore
   * @param {number} options.projectedDebtScore
   * @param {number} [options.growthRate=1.15]
   * @param {number} [options.timeHorizonMonths=6]
   * @param {number} [options.confidence=0.8]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   */
  constructor({
    currentDebtScore,
    projectedDebtScore,
    growthRate = 1.15,
    timeHorizonMonths = 6,
    confidence = 0.8,
    tier = ForecastTier.PROBABILISTIC
  }) {
    this.currentDebtScore = currentDebtScore;
    this.projectedDebtScore = Number(projectedDebtScore.toFixed(4));
    this.growthRate = growthRate;
    this.timeHorizonMonths = timeHorizonMonths;
    this.confidence = confidence;
    this.tier = tier;
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      currentDebtScore: this.currentDebtScore,
      projectedDebtScore: this.projectedDebtScore,
      growthRate: this.growthRate,
      timeHorizonMonths: this.timeHorizonMonths,
      confidence: this.confidence,
      tier: this.tier,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new DebtForecast(json);
  }
}
