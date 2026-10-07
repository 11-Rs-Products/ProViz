import { ResourceAllocator } from './ResourceAllocator.js';
import { ResourceValueModel } from './ResourceValueModel.js';

export class AdaptiveResourceAllocator extends ResourceAllocator {
  constructor(options = {}) {
    super(options);
    this.history = new Map(); // taskKind -> Array<{ returnScore: number, cost: number }>
  }

  recordReturn(taskKind, confidenceGain, uncertaintyReduction, riskReduction, cost) {
    const returnScore = ResourceValueModel.computeReturn(confidenceGain, uncertaintyReduction, riskReduction, cost);
    if (!this.history.has(taskKind)) {
      this.history.set(taskKind, []);
    }
    this.history.get(taskKind).push({ returnScore, cost, timestamp: Date.now() });
  }

  getAverageReturn(taskKind) {
    const entries = this.history.get(taskKind) || [];
    if (entries.length === 0) return 1.0;
    const sum = entries.reduce((acc, e) => acc + e.returnScore, 0);
    return sum / entries.length;
  }

  adjustTaskBudget(task) {
    const avgReturn = this.getAverageReturn(task.kind);
    // If high return, allow more time; if low return, clamp budget
    const factor = Math.min(2.0, Math.max(0.5, avgReturn));
    const currentMaxTime = task.budget?.maxTimeMs || 5000;
    return {
      ...task.budget,
      maxTimeMs: Math.round(currentMaxTime * factor)
    };
  }
}
