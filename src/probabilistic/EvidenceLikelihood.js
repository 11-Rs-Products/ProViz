export class EvidenceLikelihood {
  constructor({
    evidenceId,
    likelihood = 1.0,
    logLikelihood = 0.0,
    hypothesis = ''
  }) {
    this.evidenceId = evidenceId;
    this.likelihood = likelihood;
    this.logLikelihood = logLikelihood;
    this.hypothesis = hypothesis;
    Object.freeze(this);
  }

  toJSON() {
    return {
      evidenceId: this.evidenceId,
      likelihood: this.likelihood,
      logLikelihood: this.logLikelihood,
      hypothesis: this.hypothesis
    };
  }
}
