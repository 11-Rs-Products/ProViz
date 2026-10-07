export class StatisticalRegression {
  constructor({
    id,
    subject,
    type = 'EXCEPTION_RATE_INCREASE', // EXCEPTION_RATE_INCREASE, LATENCY_REGRESSION, CLUSTER_DEGRADATION
    evidence,
    probability,
    explanation = '',
    relatedStage21Regression = null
  }) {
    this.id = id || `stat-regr:${subject}:${type}`;
    this.subject = subject;
    this.type = type;
    this.evidence = evidence;
    this.probability = probability;
    this.explanation = explanation;
    this.relatedStage21Regression = relatedStage21Regression;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      type: this.type,
      evidence: this.evidence ? this.evidence.toJSON() : null,
      probability: this.probability ? this.probability.toJSON() : null,
      explanation: this.explanation,
      relatedStage21Regression: this.relatedStage21Regression
    };
  }
}
