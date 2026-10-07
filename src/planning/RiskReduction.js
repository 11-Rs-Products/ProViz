export class RiskReduction {
  constructor({
    subject,
    priorRisk = 1.0,
    posteriorRisk = 0.5,
    reduction = 0.5,
    mitigatedFactors = []
  }) {
    this.subject = String(subject);
    this.priorRisk = Number(priorRisk);
    this.posteriorRisk = Number(posteriorRisk);
    this.reduction = Number(reduction);
    this.mitigatedFactors = Object.freeze([...mitigatedFactors]);
    Object.freeze(this);
  }

  static calculateReduction(priorRisk, posteriorRisk, subject = 'subject') {
    const pRisk = Number(priorRisk);
    const postRisk = Number(posteriorRisk);
    const reduction = Math.max(0, pRisk - postRisk);
    return {
      subject,
      initialRisk: pRisk,
      finalRisk: postRisk,
      priorRisk: pRisk,
      posteriorRisk: postRisk,
      reductionDelta: reduction,
      reduction
    };
  }

  toJSON() {
    return {
      subject: this.subject,
      priorRisk: this.priorRisk,
      posteriorRisk: this.posteriorRisk,
      reduction: this.reduction,
      mitigatedFactors: this.mitigatedFactors
    };
  }
}
