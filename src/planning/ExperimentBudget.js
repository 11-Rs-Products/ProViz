export class ExperimentBudget {
  constructor({
    maxTimeMs = 5000,
    maxExecutions = 100,
    maxPaths = 50,
    maxTests = 20,
    maxMutants = 50,
    maxMemoryMb = 512,
    maxDepth = 20
  } = {}) {
    this.maxTimeMs = Number(maxTimeMs);
    this.maxExecutions = Number(maxExecutions);
    this.maxPaths = Number(maxPaths);
    this.maxTests = Number(maxTests);
    this.maxMutants = Number(maxMutants);
    this.maxMemoryMb = Number(maxMemoryMb);
    this.maxDepth = Number(maxDepth);
    Object.freeze(this);
  }

  isExhausted(usage = {}) {
    if (usage.timeMs !== undefined && usage.timeMs >= this.maxTimeMs) return true;
    if (usage.executions !== undefined && usage.executions >= this.maxExecutions) return true;
    if (usage.paths !== undefined && usage.paths >= this.maxPaths) return true;
    if (usage.tests !== undefined && usage.tests >= this.maxTests) return true;
    if (usage.mutants !== undefined && usage.mutants >= this.maxMutants) return true;
    return false;
  }

  toJSON() {
    return {
      maxTimeMs: this.maxTimeMs,
      maxExecutions: this.maxExecutions,
      maxPaths: this.maxPaths,
      maxTests: this.maxTests,
      maxMutants: this.maxMutants,
      maxMemoryMb: this.maxMemoryMb,
      maxDepth: this.maxDepth
    };
  }
}
