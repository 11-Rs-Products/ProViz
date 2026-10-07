export class EvidenceDecayPolicy {
  constructor({
    agingHalfLifeMs = 3600000, // 1 hour
    staleThresholdMs = 86400000, // 24 hours
    invalidateOnCodeChange = true,
    invalidateOnEnvChange = true
  } = {}) {
    this.agingHalfLifeMs = agingHalfLifeMs;
    this.staleThresholdMs = staleThresholdMs;
    this.invalidateOnCodeChange = invalidateOnCodeChange;
    this.invalidateOnEnvChange = invalidateOnEnvChange;
    Object.freeze(this);
  }

  toJSON() {
    return {
      agingHalfLifeMs: this.agingHalfLifeMs,
      staleThresholdMs: this.staleThresholdMs,
      invalidateOnCodeChange: this.invalidateOnCodeChange,
      invalidateOnEnvChange: this.invalidateOnEnvChange
    };
  }
}
