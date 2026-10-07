export const FreshnessStatus = Object.freeze({
  FRESH: 'FRESH',
  AGING: 'AGING',
  STALE: 'STALE',
  INVALIDATED: 'INVALIDATED',
  UNKNOWN: 'UNKNOWN'
});

export class EvidenceFreshness {
  constructor({
    evidenceId,
    status = FreshnessStatus.FRESH,
    ageMs = 0,
    freshnessScore = 1.0, // 1.0 (fresh) to 0.0 (stale/invalidated)
    invalidationReason = ''
  }) {
    this.evidenceId = evidenceId;
    this.status = status;
    this.ageMs = ageMs;
    this.freshnessScore = freshnessScore;
    this.invalidationReason = invalidationReason;
    Object.freeze(this);
  }

  toJSON() {
    return {
      evidenceId: this.evidenceId,
      status: this.status,
      ageMs: this.ageMs,
      freshnessScore: this.freshnessScore,
      invalidationReason: this.invalidationReason
    };
  }
}
