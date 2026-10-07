/**
 * GlobalResourceBudget.js
 * Quota and consumption containers for CPU, Memory, Time, Solvers, Workers, and Network across verification engines.
 */

export class CPUQuota {
  constructor({ maxCores = 8, currentUsage = 0 } = {}) {
    this.maxCores = maxCores;
    this.currentUsage = currentUsage;
  }
}

export class MemoryQuota {
  constructor({ maxMb = 4096, currentUsageMb = 0 } = {}) {
    this.maxMb = maxMb;
    this.currentUsageMb = currentUsageMb;
  }
}

export class TimeQuota {
  constructor({ maxDurationMs = 60000, elapsedMs = 0 } = {}) {
    this.maxDurationMs = maxDurationMs;
    this.elapsedMs = elapsedMs;
  }
}

export class SolverQuota {
  constructor({ maxCalls = 5000, callsUsed = 0 } = {}) {
    this.maxCalls = maxCalls;
    this.callsUsed = callsUsed;
  }
}

export class WorkerQuota {
  constructor({ maxWorkers = 8, activeWorkers = 0 } = {}) {
    this.maxWorkers = maxWorkers;
    this.activeWorkers = activeWorkers;
  }
}

export class NetworkQuota {
  constructor({ maxRequests = 1000, requestsUsed = 0 } = {}) {
    this.maxRequests = maxRequests;
    this.requestsUsed = requestsUsed;
  }
}

export class VerificationCostModel {
  /**
   * Estimate cost in milliseconds and CPU allocation for verification tasks
   * @param {number} obligationCount
   * @param {string} engineKind
   */
  estimateCost(obligationCount = 1, engineKind = 'default') {
    const costPerEngine = {
      contracts: 5,
      types: 2,
      symbolic: 50,
      concolic: 100,
      mutation: 80,
      security: 60,
      performance: 70,
      concurrency: 90
    };
    const factor = costPerEngine[engineKind] || 10;
    return {
      estimatedTimeMs: obligationCount * factor,
      estimatedMemoryMb: Math.min(512, obligationCount * 2),
      estimatedCpuHours: Number(((obligationCount * factor) / (1000 * 3600)).toFixed(6))
    };
  }
}

export class GlobalResourceBudget {
  constructor({
    cpu = new CPUQuota(),
    memory = new MemoryQuota(),
    time = new TimeQuota(),
    solver = new SolverQuota(),
    worker = new WorkerQuota(),
    network = new NetworkQuota()
  } = {}) {
    this.cpu = cpu;
    this.memory = memory;
    this.time = time;
    this.solver = solver;
    this.worker = worker;
    this.network = network;
  }

  isExhausted() {
    return (
      this.cpu.currentUsage >= this.cpu.maxCores ||
      this.memory.currentUsageMb >= this.memory.maxMb ||
      this.time.elapsedMs >= this.time.maxDurationMs ||
      this.solver.callsUsed >= this.solver.maxCalls ||
      this.worker.activeWorkers >= this.worker.maxWorkers ||
      this.network.requestsUsed >= this.network.maxRequests
    );
  }

  toJSON() {
    return {
      cpu: { ...this.cpu },
      memory: { ...this.memory },
      time: { ...this.time },
      solver: { ...this.solver },
      worker: { ...this.worker },
      network: { ...this.network },
      isExhausted: this.isExhausted()
    };
  }
}

export class ResourceBudgetManager {
  constructor(budget = new GlobalResourceBudget()) {
    this.budget = budget;
    this.costModel = new VerificationCostModel();
  }

  canAdmitTask(costEstimate) {
    if (this.budget.isExhausted()) return false;
    if (costEstimate.estimatedMemoryMb && this.budget.memory.currentUsageMb + costEstimate.estimatedMemoryMb > this.budget.memory.maxMb) {
      return false;
    }
    return true;
  }

  recordUsage(usage = {}) {
    if (usage.timeMs) this.budget.time.elapsedMs += usage.timeMs;
    if (usage.memoryMb) this.budget.memory.currentUsageMb = Math.max(this.budget.memory.currentUsageMb, usage.memoryMb);
    if (usage.solverCalls) this.budget.solver.callsUsed += usage.solverCalls;
  }
}
