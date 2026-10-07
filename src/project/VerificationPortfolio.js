/**
 * VerificationPortfolio.js
 * Represents the comprehensive portfolio of all verification artifacts, obligations, engines, and status across the project.
 */

export class VerificationPortfolio {
  /**
   * @param {Object} options
   * @param {number} options.totalObligations
   * @param {number} options.verifiedObligations
   * @param {number} options.failedObligations
   * @param {number} options.unverifiedObligations
   * @param {number} options.staleObligations
   * @param {Object<string, number>} [options.engineBreakdown={}]
   * @param {Object<string, Object>} [options.obligationDetails={}]
   */
  constructor({
    totalObligations,
    verifiedObligations,
    failedObligations,
    unverifiedObligations,
    staleObligations = 0,
    engineBreakdown = {},
    obligationDetails = {}
  }) {
    this.totalObligations = totalObligations;
    this.verifiedObligations = verifiedObligations;
    this.failedObligations = failedObligations;
    this.unverifiedObligations = unverifiedObligations;
    this.staleObligations = staleObligations;
    this.engineBreakdown = Object.freeze({ ...engineBreakdown });
    this.obligationDetails = Object.freeze({ ...obligationDetails });

    const total = Math.max(1, totalObligations);
    this.verificationRate = Number((verifiedObligations / total).toFixed(4));
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  get isFullyVerified() {
    return this.verifiedObligations === this.totalObligations && this.failedObligations === 0 && this.staleObligations === 0;
  }

  toJSON() {
    return {
      totalObligations: this.totalObligations,
      verifiedObligations: this.verifiedObligations,
      failedObligations: this.failedObligations,
      unverifiedObligations: this.unverifiedObligations,
      staleObligations: this.staleObligations,
      verificationRate: this.verificationRate,
      isFullyVerified: this.isFullyVerified,
      engineBreakdown: this.engineBreakdown,
      obligationDetails: this.obligationDetails,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new VerificationPortfolio(json);
  }
}
