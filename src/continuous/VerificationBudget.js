/**
 * VerificationBudget.js
 * Tracks and limits resource consumption across CPU, memory, time, solver calls, schedules, tests, and workers.
 */

export class VerificationBudget {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.maxCpuMs=10000]
   * @param {number} [options.maxMemoryMb=512]
   * @param {number} [options.maxSolverCalls=500]
   * @param {number} [options.maxSchedules=100]
   * @param {number} [options.maxTests=1000]
   * @param {number} [options.maxWorkers=4]
   */
  constructor({
    maxCpuMs = 10000,
    maxMemoryMb = 512,
    maxSolverCalls = 500,
    maxSchedules = 100,
    maxTests = 1000,
    maxWorkers = 4
  } = {}) {
    this.maxCpuMs = maxCpuMs;
    this.maxMemoryMb = maxMemoryMb;
    this.maxSolverCalls = maxSolverCalls;
    this.maxSchedules = maxSchedules;
    this.maxTests = maxTests;
    this.maxWorkers = maxWorkers;

    this.usedCpuMs = 0;
    this.usedSolverCalls = 0;
    this.usedSchedules = 0;
    this.usedTests = 0;
  }

  recordUsage({ cpuMs = 0, solverCalls = 0, schedules = 0, tests = 0 } = {}) {
    this.usedCpuMs += cpuMs;
    this.usedSolverCalls += solverCalls;
    this.usedSchedules += schedules;
    this.usedTests += tests;
  }

  isExhausted() {
    return this.usedCpuMs >= this.maxCpuMs ||
           this.usedSolverCalls >= this.maxSolverCalls ||
           this.usedSchedules >= this.maxSchedules ||
           this.usedTests >= this.maxTests;
  }

  remainingBudget() {
    return {
      remainingCpuMs: Math.max(0, this.maxCpuMs - this.usedCpuMs),
      remainingSolverCalls: Math.max(0, this.maxSolverCalls - this.usedSolverCalls),
      remainingSchedules: Math.max(0, this.maxSchedules - this.usedSchedules),
      remainingTests: Math.max(0, this.maxTests - this.usedTests)
    };
  }

  toJSON() {
    return {
      limits: {
        maxCpuMs: this.maxCpuMs,
        maxMemoryMb: this.maxMemoryMb,
        maxSolverCalls: this.maxSolverCalls,
        maxSchedules: this.maxSchedules,
        maxTests: this.maxTests,
        maxWorkers: this.maxWorkers
      },
      used: {
        usedCpuMs: this.usedCpuMs,
        usedSolverCalls: this.usedSolverCalls,
        usedSchedules: this.usedSchedules,
        usedTests: this.usedTests
      },
      isExhausted: this.isExhausted()
    };
  }
}
