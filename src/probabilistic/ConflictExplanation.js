export class ConflictExplanation {
  constructor({
    conflictId,
    classification,
    supportingSummary = '',
    contradictingSummary = '',
    resolutionStrategy = 'PRESERVE_BOTH_AND_REDUCE_CONFIDENCE',
    explanation = ''
  }) {
    this.conflictId = conflictId;
    this.classification = classification;
    this.supportingSummary = supportingSummary;
    this.contradictingSummary = contradictingSummary;
    this.resolutionStrategy = resolutionStrategy;
    this.explanation = explanation;
    Object.freeze(this);
  }

  toJSON() {
    return {
      conflictId: this.conflictId,
      classification: this.classification,
      supportingSummary: this.supportingSummary,
      contradictingSummary: this.contradictingSummary,
      resolutionStrategy: this.resolutionStrategy,
      explanation: this.explanation
    };
  }
}
