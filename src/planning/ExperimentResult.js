export class ExperimentResult {
  constructor({
    experimentId,
    success = true,
    outcome = 'SUCCESS', // SUCCESS, FAILED, TIMEOUT, INCONCLUSIVE, COUNTEREXAMPLE_FOUND, PROOF_FOUND
    evidenceGenerated = [],
    confidenceDelta = 0.0,
    uncertaintyReduction = 0.0,
    discoveries = [],
    failures = [],
    executionCostMs = 0,
    metadata = {}
  }) {
    this.experimentId = String(experimentId);
    this.success = Boolean(success);
    this.outcome = outcome;
    this.evidenceGenerated = Object.freeze([...evidenceGenerated]);
    this.confidenceDelta = Number(confidenceDelta);
    this.uncertaintyReduction = Number(uncertaintyReduction);
    this.discoveries = Object.freeze([...discoveries]);
    this.failures = Object.freeze([...failures]);
    this.executionCostMs = Number(executionCostMs);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      experimentId: this.experimentId,
      success: this.success,
      outcome: this.outcome,
      evidenceGenerated: this.evidenceGenerated.map(e => (e.toJSON ? e.toJSON() : e)),
      confidenceDelta: this.confidenceDelta,
      uncertaintyReduction: this.uncertaintyReduction,
      discoveries: this.discoveries,
      failures: this.failures,
      executionCostMs: this.executionCostMs,
      metadata: this.metadata
    };
  }
}
