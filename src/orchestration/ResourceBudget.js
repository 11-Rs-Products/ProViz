export class ResourceBudget {
  constructor({
    maxCpu = 8,
    maxMemoryMb = 4096,
    maxTimeMs = 30000,
    maxProcesses = 8,
    maxSolverCalls = 100,
    maxTestExecutions = 200,
    maxPaths = 100,
    maxMutants = 100
  } = {}) {
    this.maxCpu = Number(maxCpu);
    this.maxMemoryMb = Number(maxMemoryMb);
    this.maxTimeMs = Number(maxTimeMs);
    this.maxProcesses = Number(maxProcesses);
    this.maxSolverCalls = Number(maxSolverCalls);
    this.maxTestExecutions = Number(maxTestExecutions);
    this.maxPaths = Number(maxPaths);
    this.maxMutants = Number(maxMutants);
    Object.freeze(this);
  }

  isExceededBy(usage = {}) {
    if (usage.cpu !== undefined && usage.cpu > this.maxCpu) return true;
    if (usage.memoryMb !== undefined && usage.memoryMb > this.maxMemoryMb) return true;
    if (usage.timeMs !== undefined && usage.timeMs > this.maxTimeMs) return true;
    if (usage.processes !== undefined && usage.processes > this.maxProcesses) return true;
    if (usage.solverCalls !== undefined && usage.solverCalls > this.maxSolverCalls) return true;
    if (usage.testExecutions !== undefined && usage.testExecutions > this.maxTestExecutions) return true;
    if (usage.paths !== undefined && usage.paths > this.maxPaths) return true;
    if (usage.mutants !== undefined && usage.mutants > this.maxMutants) return true;
    return false;
  }

  toJSON() {
    return {
      maxCpu: this.maxCpu,
      maxMemoryMb: this.maxMemoryMb,
      maxTimeMs: this.maxTimeMs,
      maxProcesses: this.maxProcesses,
      maxSolverCalls: this.maxSolverCalls,
      maxTestExecutions: this.maxTestExecutions,
      maxPaths: this.maxPaths,
      maxMutants: this.maxMutants
    };
  }
}
