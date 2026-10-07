export class VerificationImpact {
  constructor({
    subject,
    impactScore = 0.5,
    affectedSpecifications = [],
    affectedOracles = [],
    riskLevel = 'MEDIUM'
  }) {
    this.subject = subject;
    this.impactScore = impactScore;
    this.affectedSpecifications = Object.freeze([...affectedSpecifications]);
    this.affectedOracles = Object.freeze([...affectedOracles]);
    this.riskLevel = riskLevel;
    Object.freeze(this);
  }

  toJSON() {
    return {
      subject: this.subject,
      impactScore: this.impactScore,
      affectedSpecifications: this.affectedSpecifications,
      affectedOracles: this.affectedOracles,
      riskLevel: this.riskLevel
    };
  }
}
