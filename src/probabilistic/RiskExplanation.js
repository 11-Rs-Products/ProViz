export class RiskExplanation {
  constructor({
    subject,
    compositeRiskScore = 0.0,
    riskLevel = 'LOW',
    topFactors = [],
    summary = ''
  }) {
    this.subject = subject;
    this.compositeRiskScore = compositeRiskScore;
    this.riskLevel = riskLevel;
    this.topFactors = Object.freeze([...topFactors]);
    this.summary = summary;
    Object.freeze(this);
  }

  toJSON() {
    return {
      subject: this.subject,
      compositeRiskScore: this.compositeRiskScore,
      riskLevel: this.riskLevel,
      topFactors: this.topFactors.map(f => (f.toJSON ? f.toJSON() : f)),
      summary: this.summary
    };
  }
}
