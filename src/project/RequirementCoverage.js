/**
 * RequirementCoverage.js
 * Represents requirement-to-specification and implementation coverage metrics.
 */

export class RequirementCoverage {
  /**
   * @param {Object} options
   * @param {number} options.totalRequirements
   * @param {number} options.specifiedRequirements
   * @param {number} options.implementedRequirements
   * @param {number} options.verifiedRequirements
   * @param {Object<string, Object>} [options.details={}]
   */
  constructor({
    totalRequirements,
    specifiedRequirements,
    implementedRequirements,
    verifiedRequirements,
    details = {}
  }) {
    this.totalRequirements = totalRequirements;
    this.specifiedRequirements = specifiedRequirements;
    this.implementedRequirements = implementedRequirements;
    this.verifiedRequirements = verifiedRequirements;
    this.details = Object.freeze({ ...details });

    const total = Math.max(1, totalRequirements);
    this.specificationCoverage = Number((specifiedRequirements / total).toFixed(4));
    this.implementationCoverage = Number((implementedRequirements / total).toFixed(4));
    this.verificationCoverage = Number((verifiedRequirements / total).toFixed(4));
    Object.freeze(this);
  }

  toJSON() {
    return {
      totalRequirements: this.totalRequirements,
      specifiedRequirements: this.specifiedRequirements,
      implementedRequirements: this.implementedRequirements,
      verifiedRequirements: this.verifiedRequirements,
      specificationCoverage: this.specificationCoverage,
      implementationCoverage: this.implementationCoverage,
      verificationCoverage: this.verificationCoverage,
      details: this.details
    };
  }

  static fromJSON(json) {
    return new RequirementCoverage(json);
  }
}
