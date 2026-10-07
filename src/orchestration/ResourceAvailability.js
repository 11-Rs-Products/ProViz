import { ResourceUsage } from './ResourceUsage.js';
import { ResourceBudget } from './ResourceBudget.js';

export class ResourceAvailability {
  constructor({
    budget = new ResourceBudget(),
    currentUsage = new ResourceUsage()
  } = {}) {
    this.budget = budget instanceof ResourceBudget ? budget : new ResourceBudget(budget);
    this.currentUsage = currentUsage instanceof ResourceUsage ? currentUsage : new ResourceUsage(currentUsage);
    Object.freeze(this);
  }

  get availableCpu() {
    return Math.max(0, this.budget.maxCpu - this.currentUsage.cpu);
  }

  get availableMemoryMb() {
    return Math.max(0, this.budget.maxMemoryMb - this.currentUsage.memoryMb);
  }

  get availableProcesses() {
    return Math.max(0, this.budget.maxProcesses - this.currentUsage.processes);
  }

  get availableSolverCalls() {
    return Math.max(0, this.budget.maxSolverCalls - this.currentUsage.solverCalls);
  }

  canAdmit(requirements = {}) {
    const reqCpu = Number(requirements.cpu || 1);
    const reqMem = Number(requirements.memoryMb || 128);
    const reqProc = Number(requirements.processes || 1);
    const reqSolver = Number(requirements.solverCalls || 0);

    return (
      this.availableCpu >= reqCpu &&
      this.availableMemoryMb >= reqMem &&
      this.availableProcesses >= reqProc &&
      this.availableSolverCalls >= reqSolver
    );
  }

  toJSON() {
    return {
      availableCpu: this.availableCpu,
      availableMemoryMb: this.availableMemoryMb,
      availableProcesses: this.availableProcesses,
      availableSolverCalls: this.availableSolverCalls
    };
  }
}
