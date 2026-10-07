/**
 * DependencyForecast.js
 * Produces probabilistic forecasts of future dependency growth and coupling drift.
 * Invariant: Forecasts are NOT formal proofs.
 */

export const ForecastTier = Object.freeze({
  OBSERVED: 'OBSERVED',
  INFERRED: 'INFERRED',
  FORECAST: 'FORECAST',
  PROBABILISTIC: 'PROBABILISTIC',
  FORMALLY_PROVEN: 'FORMALLY_PROVEN'
});

export class DependencyForecast {
  /**
   * @param {Object} options
   * @param {string} options.targetEntityId
   * @param {number} options.predictedFanOut
   * @param {number} options.predictedBlastRadius
   * @param {number} [options.confidence=0.8]
   * @param {string} [options.tier=ForecastTier.PROBABILISTIC]
   * @param {string[]} [options.contributingFactors=[]]
   * @param {number} [options.horizonRevisions=5]
   */
  constructor({
    targetEntityId,
    predictedFanOut,
    predictedBlastRadius,
    confidence = 0.8,
    tier = ForecastTier.PROBABILISTIC,
    contributingFactors = [],
    horizonRevisions = 5
  }) {
    if (!targetEntityId) throw new Error('DependencyForecast requires targetEntityId');
    this.targetEntityId = targetEntityId;
    this.predictedFanOut = predictedFanOut;
    this.predictedBlastRadius = predictedBlastRadius;
    this.confidence = confidence;
    this.tier = tier;
    this.contributingFactors = Object.freeze([...contributingFactors]);
    this.horizonRevisions = horizonRevisions;
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      targetEntityId: this.targetEntityId,
      predictedFanOut: this.predictedFanOut,
      predictedBlastRadius: this.predictedBlastRadius,
      confidence: this.confidence,
      tier: this.tier,
      contributingFactors: [...this.contributingFactors],
      horizonRevisions: this.horizonRevisions,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new DependencyForecast(json);
  }
}
