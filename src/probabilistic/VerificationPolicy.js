export const VerificationTrigger = Object.freeze({
  SOURCE_CHANGED: 'SOURCE_CHANGED',
  DEPENDENCY_CHANGED: 'DEPENDENCY_CHANGED',
  ENVIRONMENT_CHANGED: 'ENVIRONMENT_CHANGED',
  SPECIFICATION_CHANGED: 'SPECIFICATION_CHANGED',
  ORACLE_CHANGED: 'ORACLE_CHANGED',
  MUTATION_SURVIVED: 'MUTATION_SURVIVED',
  REGRESSION_OCCURRED: 'REGRESSION_OCCURRED',
  CONFIDENCE_DEGRADED: 'CONFIDENCE_DEGRADED',
  EVIDENCE_STALE: 'EVIDENCE_STALE',
  NEW_BEHAVIOR_DETECTED: 'NEW_BEHAVIOR_DETECTED',
  MANUAL: 'MANUAL'
});

export const VerificationStatus = Object.freeze({
  CREATED: 'CREATED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  STOPPED: 'STOPPED',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  INCONCLUSIVE: 'INCONCLUSIVE',
  FAILED: 'FAILED'
});

export class VerificationPolicy {
  constructor({
    targetConfidence = 0.95,
    targetCoverage = 0.90,
    maxSamples = 1000,
    timeBudgetMs = 5000,
    incrementalOnly = true,
    reverifyOnConfidenceDrop = true
  } = {}) {
    this.targetConfidence = targetConfidence;
    this.targetCoverage = targetCoverage;
    this.maxSamples = maxSamples;
    this.timeBudgetMs = timeBudgetMs;
    this.incrementalOnly = incrementalOnly;
    this.reverifyOnConfidenceDrop = reverifyOnConfidenceDrop;
    Object.freeze(this);
  }

  toJSON() {
    return {
      targetConfidence: this.targetConfidence,
      targetCoverage: this.targetCoverage,
      maxSamples: this.maxSamples,
      timeBudgetMs: this.timeBudgetMs,
      incrementalOnly: this.incrementalOnly,
      reverifyOnConfidenceDrop: this.reverifyOnConfidenceDrop
    };
  }
}
