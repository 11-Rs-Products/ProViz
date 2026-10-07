export class PosteriorExplanation {
  constructor({
    priorSummary = '',
    observationsSummary = '',
    posteriorSummary = '',
    explanation = ''
  }) {
    this.priorSummary = priorSummary;
    this.observationsSummary = observationsSummary;
    this.posteriorSummary = posteriorSummary;
    this.explanation = explanation;
    Object.freeze(this);
  }

  toJSON() {
    return {
      priorSummary: this.priorSummary,
      observationsSummary: this.observationsSummary,
      posteriorSummary: this.posteriorSummary,
      explanation: this.explanation
    };
  }
}
