/**
 * RiskHotspot.js
 * Represents a localized hotspot with high risk concentration.
 */

export class RiskHotspot {
  /**
   * @param {Object} options
   * @param {string} options.entityId
   * @param {number} options.changeFrequency
   * @param {number} options.blastRadius
   * @param {number} options.failureProbability
   * @param {number} options.impact
   * @param {number} options.hotspotRisk
   * @param {string} [options.severity='MEDIUM']
   * @param {string[]} [options.contributingFactors=[]]
   */
  constructor({
    entityId,
    changeFrequency,
    blastRadius,
    failureProbability,
    impact,
    hotspotRisk,
    severity = 'MEDIUM',
    contributingFactors = []
  }) {
    this.entityId = entityId;
    this.changeFrequency = changeFrequency;
    this.blastRadius = blastRadius;
    this.failureProbability = failureProbability;
    this.impact = impact;
    this.hotspotRisk = Number(hotspotRisk.toFixed(4));
    this.severity = severity;
    this.contributingFactors = Object.freeze([...contributingFactors]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      entityId: this.entityId,
      changeFrequency: this.changeFrequency,
      blastRadius: this.blastRadius,
      failureProbability: this.failureProbability,
      impact: this.impact,
      hotspotRisk: this.hotspotRisk,
      severity: this.severity,
      contributingFactors: [...this.contributingFactors]
    };
  }

  static fromJSON(json) {
    return new RiskHotspot(json);
  }
}
