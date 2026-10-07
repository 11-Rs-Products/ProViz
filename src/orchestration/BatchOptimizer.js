import { VerificationBatch } from './VerificationBatch.js';

export class BatchOptimizer {
  static createBatches(tasks = [], maxBatchSize = 10) {
    const byKind = new Map(); // kind -> Array<VerificationTask>

    for (const task of tasks) {
      if (!byKind.has(task.kind)) byKind.set(task.kind, []);
      byKind.get(task.kind).push(task);
    }

    const batches = [];
    for (const [kind, kindTasks] of byKind.entries()) {
      for (let i = 0; i < kindTasks.length; i += maxBatchSize) {
        const slice = kindTasks.slice(i, i + maxBatchSize);
        const estCost = slice.reduce((acc, t) => acc + (t.budget?.maxTimeMs || 10), 0);
        batches.push(new VerificationBatch({
          kind,
          tasks: slice,
          estimatedTotalCostMs: estCost,
          sharedFixtures: { sharedAst: true, sharedCfg: true }
        }));
      }
    }

    return batches;
  }
}
