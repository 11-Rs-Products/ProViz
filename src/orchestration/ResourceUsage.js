export class ResourceUsage {
  constructor({
    cpu = 0,
    memoryMb = 0,
    timeMs = 0,
    processes = 0,
    solverCalls = 0,
    testExecutions = 0,
    paths = 0,
    mutants = 0
  } = {}) {
    this.cpu = Number(cpu);
    this.memoryMb = Number(memoryMb);
    this.timeMs = Number(timeMs);
    this.processes = Number(processes);
    this.solverCalls = Number(solverCalls);
    this.testExecutions = Number(testExecutions);
    this.paths = Number(paths);
    this.mutants = Number(mutants);
    Object.freeze(this);
  }

  add(other = {}) {
    return new ResourceUsage({
      cpu: this.cpu + Number(other.cpu || 0),
      memoryMb: this.memoryMb + Number(other.memoryMb || 0),
      timeMs: this.timeMs + Number(other.timeMs || 0),
      processes: this.processes + Number(other.processes || 0),
      solverCalls: this.solverCalls + Number(other.solverCalls || 0),
      testExecutions: this.testExecutions + Number(other.testExecutions || 0),
      paths: this.paths + Number(other.paths || 0),
      mutants: this.mutants + Number(other.mutants || 0)
    });
  }

  subtract(other = {}) {
    return new ResourceUsage({
      cpu: Math.max(0, this.cpu - Number(other.cpu || 0)),
      memoryMb: Math.max(0, this.memoryMb - Number(other.memoryMb || 0)),
      timeMs: Math.max(0, this.timeMs - Number(other.timeMs || 0)),
      processes: Math.max(0, this.processes - Number(other.processes || 0)),
      solverCalls: Math.max(0, this.solverCalls - Number(other.solverCalls || 0)),
      testExecutions: Math.max(0, this.testExecutions - Number(other.testExecutions || 0)),
      paths: Math.max(0, this.paths - Number(other.paths || 0)),
      mutants: Math.max(0, this.mutants - Number(other.mutants || 0))
    });
  }

  toJSON() {
    return {
      cpu: this.cpu,
      memoryMb: this.memoryMb,
      timeMs: this.timeMs,
      processes: this.processes,
      solverCalls: this.solverCalls,
      testExecutions: this.testExecutions,
      paths: this.paths,
      mutants: this.mutants
    };
  }
}
