import { AgentTrustLevel, TRUST_LEVEL_ORDER } from './AgentTrustLevel.js';

/**
 * Tracks agent correctness history and reliability metrics
 */
export class AgentTrustProfile {
  constructor({
    trustLevel = AgentTrustLevel.STANDARD,
    correctnessHistory = 1.0,
    failureRate = 0.0,
    determinism = 1.0,
    evidenceQuality = 0.8,
    environmentStability = 1.0,
    versionStability = 1.0,
    totalExecutions = 0,
    successfulExecutions = 0,
    failedExecutions = 0,
    quarantineCount = 0
  } = {}) {
    this.trustLevel = trustLevel;
    this.correctnessHistory = Math.max(0, Math.min(1, correctnessHistory));
    this.failureRate = Math.max(0, Math.min(1, failureRate));
    this.determinism = Math.max(0, Math.min(1, determinism));
    this.evidenceQuality = Math.max(0, Math.min(1, evidenceQuality));
    this.environmentStability = Math.max(0, Math.min(1, environmentStability));
    this.versionStability = Math.max(0, Math.min(1, versionStability));
    this.totalExecutions = totalExecutions;
    this.successfulExecutions = successfulExecutions;
    this.failedExecutions = failedExecutions;
    this.quarantineCount = quarantineCount;
    Object.freeze(this);
  }

  get rank() {
    return TRUST_LEVEL_ORDER[this.trustLevel] ?? 0;
  }

  get reliabilityScore() {
    return (
      this.correctnessHistory * 0.35 +
      (1 - this.failureRate) * 0.25 +
      this.determinism * 0.2 +
      this.environmentStability * 0.1 +
      this.versionStability * 0.1
    );
  }

  recordExecution(success, evidenceScore = 1.0) {
    const total = this.totalExecutions + 1;
    const successes = this.successfulExecutions + (success ? 1 : 0);
    const failures = this.failedExecutions + (success ? 0 : 1);
    const newFailureRate = failures / total;
    const newCorrectness = successes / total;
    const newEvidenceQuality = (this.evidenceQuality * this.totalExecutions + evidenceScore) / total;

    return new AgentTrustProfile({
      trustLevel: this.trustLevel,
      correctnessHistory: newCorrectness,
      failureRate: newFailureRate,
      determinism: this.determinism,
      evidenceQuality: newEvidenceQuality,
      environmentStability: this.environmentStability,
      versionStability: this.versionStability,
      totalExecutions: total,
      successfulExecutions: successes,
      failedExecutions: failures,
      quarantineCount: this.quarantineCount
    });
  }

  withTrustLevel(level) {
    return new AgentTrustProfile({
      ...this.toJSON(),
      trustLevel: level
    });
  }

  withQuarantineIncrement() {
    return new AgentTrustProfile({
      ...this.toJSON(),
      quarantineCount: this.quarantineCount + 1
    });
  }

  toJSON() {
    return {
      trustLevel: this.trustLevel,
      correctnessHistory: this.correctnessHistory,
      failureRate: this.failureRate,
      determinism: this.determinism,
      evidenceQuality: this.evidenceQuality,
      environmentStability: this.environmentStability,
      versionStability: this.versionStability,
      totalExecutions: this.totalExecutions,
      successfulExecutions: this.successfulExecutions,
      failedExecutions: this.failedExecutions,
      quarantineCount: this.quarantineCount
    };
  }

  static fromJSON(json = {}) {
    return new AgentTrustProfile(json);
  }
}
