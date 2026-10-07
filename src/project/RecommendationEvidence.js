/**
 * RecommendationEvidence.js
 * Encapsulates the quantitative or structural evidence backing a recommendation.
 */

export class RecommendationEvidence {
  /**
   * @param {Object} options
   * @param {string} options.sourceMetric - e.g. 'CYCLIC_DEPENDENCY', 'HIGH_COUPLING', 'MISSING_CONTRACT'
   * @param {number|string} options.observedValue
   * @param {number|string} options.thresholdValue
   * @param {Object} [options.supportingData={}]
   */
  constructor({
    sourceMetric,
    observedValue,
    thresholdValue,
    supportingData = {}
  }) {
    this.sourceMetric = sourceMetric;
    this.observedValue = observedValue;
    this.thresholdValue = thresholdValue;
    this.supportingData = Object.freeze({ ...supportingData });
    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceMetric: this.sourceMetric,
      observedValue: this.observedValue,
      thresholdValue: this.thresholdValue,
      supportingData: { ...this.supportingData }
    };
  }

  static fromJSON(json) {
    return new RecommendationEvidence(json);
  }
}
