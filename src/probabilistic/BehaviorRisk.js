export class BehaviorRisk {
  constructor({
    subject,
    compositeScore = 0.0,
    level = 'LOW', // LOW, MEDIUM, HIGH, CRITICAL
    factors = [],
    explanation = null
  }) {
    this.subject = subject;
    this.compositeScore = compositeScore;
    this.level = level;
    this.factors = Object.freeze([...factors]);
    this.explanation = explanation;
    Object.freeze(this);
  }

  toJSON() {
    return {
      subject: this.subject,
      compositeScore: this.compositeScore,
      level: this.level,
      factors: this.factors.map(f => f.toJSON()),
      explanation: this.explanation ? this.explanation.toJSON() : null
    };
  }
}
