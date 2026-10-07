export class ConcurrencyPolicy {
  constructor({
    maxWorkers = 8,
    maxConcurrentTasks = 8,
    maxConcurrentSolvers = 2,
    maxConcurrentTests = 5,
    maxConcurrentMutants = 3,
    maxMemoryMb = 4096
  } = {}) {
    this.maxWorkers = Number(maxWorkers);
    this.maxConcurrentTasks = Number(maxConcurrentTasks);
    this.maxConcurrentSolvers = Number(maxConcurrentSolvers);
    this.maxConcurrentTests = Number(maxConcurrentTests);
    this.maxConcurrentMutants = Number(maxConcurrentMutants);
    this.maxMemoryMb = Number(maxMemoryMb);
    Object.freeze(this);
  }

  toJSON() {
    return {
      maxWorkers: this.maxWorkers,
      maxConcurrentTasks: this.maxConcurrentTasks,
      maxConcurrentSolvers: this.maxConcurrentSolvers,
      maxConcurrentTests: this.maxConcurrentTests,
      maxConcurrentMutants: this.maxConcurrentMutants,
      maxMemoryMb: this.maxMemoryMb
    };
  }
}
