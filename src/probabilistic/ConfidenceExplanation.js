export class ConfidenceExplanation {
  constructor({
    subject,
    confidenceLevel,
    score = 0.0,
    supportingSummary = '',
    refutingSummary = '',
    uncertaintySummary = '',
    reasons = []
  }) {
    this.subject = subject;
    this.confidenceLevel = confidenceLevel;
    this.score = score;
    this.supportingSummary = supportingSummary;
    this.refutingSummary = refutingSummary;
    this.uncertaintySummary = uncertaintySummary;
    this.reasons = Object.freeze([...reasons]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      subject: this.subject,
      confidenceLevel: this.confidenceLevel,
      score: this.score,
      supportingSummary: this.supportingSummary,
      refutingSummary: this.refutingSummary,
      uncertaintySummary: this.uncertaintySummary,
      reasons: this.reasons
    };
  }
}
