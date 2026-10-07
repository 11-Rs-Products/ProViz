export class BehaviorAnomaly {
  constructor({
    id,
    subject,
    type = 'RARE_BEHAVIOR', // RARE_BEHAVIOR, UNEXPECTED_EXCEPTION, UNEXPECTED_STATE, UNUSUAL_TRANSITION, DISTRIBUTION_OUTLIER, NEW_BEHAVIOR_CLUSTER
    anomalyScore,
    explanation,
    outcome = null,
    input = null,
    environment = null
  }) {
    this.id = id || `anomaly:${subject}:${type}:${outcome?.id || Date.now()}`;
    this.subject = subject;
    this.type = type;
    this.anomalyScore = anomalyScore;
    this.explanation = explanation;
    this.outcome = outcome;
    this.input = input;
    this.environment = environment;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      type: this.type,
      anomalyScore: this.anomalyScore.toJSON(),
      explanation: this.explanation ? this.explanation.toJSON() : null,
      outcome: this.outcome ? (this.outcome.toJSON ? this.outcome.toJSON() : this.outcome) : null,
      input: this.input,
      environment: this.environment
    };
  }
}
