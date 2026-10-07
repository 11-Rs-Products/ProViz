/**
 * ChangeRiskModel.js
 * Evaluates semantic change risk using: Risk(C) = P(semantic failure | C) * Impact(C)
 */

export class ChangeRiskModel {
  /**
   * @param {Object} options
   * @param {string} options.changeId
   * @param {number} options.failureProbability - P(failure | C) in [0.0, 1.0]
   * @param {number} options.impactScore - Impact(C) in [0.0, 1.0]
   * @param {number} options.riskScore - Risk score in [0.0, 1.0]
   * @param {Object} [options.riskFactors={}] - Breakdown of contributory risk components
   */
  constructor({
    changeId,
    failureProbability = 0.0,
    impactScore = 0.0,
    riskScore = 0.0,
    riskFactors = {}
  }) {
    this.changeId = changeId;
    this.failureProbability = Math.max(0.0, Math.min(1.0, failureProbability));
    this.impactScore = Math.max(0.0, Math.min(1.0, impactScore));
    this.riskScore = Math.max(0.0, Math.min(1.0, riskScore));
    this.riskFactors = Object.freeze({ ...riskFactors });

    Object.freeze(this);
  }

  toJSON() {
    return {
      changeId: this.changeId,
      failureProbability: this.failureProbability,
      impactScore: this.impactScore,
      riskScore: this.riskScore,
      riskFactors: this.riskFactors
    };
  }

  static fromJSON(json) {
    return new ChangeRiskModel(json);
  }
}
