/**
 * Candidate root cause with multi-factor scoring
 */
export class RootCauseCandidate {
  constructor({
    entityId,
    description = '',
    causalStrength = 1.0,
    evidenceSupport = 1.0,
    coverage = 1.0,
    temporalConsistency = 1.0,
    confoundingRisk = 0.0,
    causalPath = [],
    metadata = {}
  } = {}) {
    this.entityId = entityId;
    this.description = description;
    this.causalStrength = Math.max(0, Math.min(1, causalStrength));
    this.evidenceSupport = Math.max(0, Math.min(1, evidenceSupport));
    this.coverage = Math.max(0, Math.min(1, coverage));
    this.temporalConsistency = Math.max(0, Math.min(1, temporalConsistency));
    this.confoundingRisk = Math.max(0, Math.min(1, confoundingRisk));
    this.causalPath = Object.freeze([...causalPath]);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  get score() {
    const positive = this.causalStrength * this.evidenceSupport * this.coverage * this.temporalConsistency;
    return Math.max(0, positive - this.confoundingRisk);
  }

  toJSON() {
    return {
      entityId: this.entityId,
      description: this.description,
      causalStrength: this.causalStrength,
      evidenceSupport: this.evidenceSupport,
      coverage: this.coverage,
      temporalConsistency: this.temporalConsistency,
      confoundingRisk: this.confoundingRisk,
      score: this.score,
      causalPath: [...this.causalPath],
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new RootCauseCandidate(json);
  }
}
