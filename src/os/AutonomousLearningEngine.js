/**
 * AutonomousLearningEngine.js
 * Statistical adaptation and strategy optimization for autonomous verification workflows.
 * Invariant: Learning must NOT mutate formal correctness semantics or override explicit safety constraints.
 */

export class AutonomousLearningEngine {
  constructor() {
    /** @type {Map<string, { successCount: number, failureCount: number, totalDurationMs: number }>} */
    this._strategyStats = new Map();
  }

  recordStrategyOutcome(strategyName, isSuccess, durationMs = 0) {
    let stat = this._strategyStats.get(strategyName);
    if (!stat) {
      stat = { successCount: 0, failureCount: 0, totalDurationMs: 0 };
      this._strategyStats.set(strategyName, stat);
    }
    if (isSuccess) stat.successCount++;
    else stat.failureCount++;
    stat.totalDurationMs += durationMs;
  }

  getRankedStrategies() {
    const list = [];
    for (const [strategy, stat] of this._strategyStats.entries()) {
      const total = stat.successCount + stat.failureCount;
      const rate = total === 0 ? 0 : stat.successCount / total;
      const avgDuration = total === 0 ? 0 : stat.totalDurationMs / total;

      list.push({
        strategy,
        successRate: Number(rate.toFixed(4)),
        totalExecutions: total,
        avgDurationMs: Number(avgDuration.toFixed(2))
      });
    }

    list.sort((a, b) => b.successRate - a.successRate);
    return list;
  }
}
