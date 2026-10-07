export class VerificationBatch {
  constructor({
    batchId,
    kind,
    tasks = [],
    sharedFixtures = {},
    estimatedTotalCostMs = 0
  } = {}) {
    this.batchId = batchId || `batch_${kind}_${Date.now()}`;
    this.kind = kind;
    this.tasks = Object.freeze([...tasks]);
    this.sharedFixtures = Object.freeze({ ...sharedFixtures });
    this.estimatedTotalCostMs = Number(estimatedTotalCostMs);
    Object.freeze(this);
  }

  toJSON() {
    return {
      batchId: this.batchId,
      kind: this.kind,
      tasksCount: this.tasks.length,
      estimatedTotalCostMs: this.estimatedTotalCostMs
    };
  }
}
