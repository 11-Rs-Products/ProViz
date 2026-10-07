export class UncertaintyTarget {
  constructor({
    id,
    targetType = 'LOW_CONFIDENCE_SPEC', // LOW_CONFIDENCE_SPEC, CONFLICTING_OBSERVATION, UNSTABLE_BEHAVIOR, RARE_CLUSTER, UNKNOWN_TRANSITION
    subject,
    uncertaintyScore = 1.0,
    confidenceScore = 0.0,
    rationale = ''
  }) {
    this.id = id || `target:${subject}:${targetType}`;
    this.targetType = targetType;
    this.subject = subject;
    this.uncertaintyScore = uncertaintyScore;
    this.confidenceScore = confidenceScore;
    this.rationale = rationale;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      targetType: this.targetType,
      subject: this.subject,
      uncertaintyScore: this.uncertaintyScore,
      confidenceScore: this.confidenceScore,
      rationale: this.rationale
    };
  }
}
