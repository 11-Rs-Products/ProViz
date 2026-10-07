import { ConcurrencyPolicy } from './ConcurrencyPolicy.js';
import { VerificationTaskKind } from './VerificationTaskKind.js';

export class ConcurrencyController {
  constructor({ policy = new ConcurrencyPolicy() } = {}) {
    this.policy = policy instanceof ConcurrencyPolicy ? policy : new ConcurrencyPolicy(policy);
    this.runningTasks = new Map(); // taskId -> VerificationTask
  }

  canAdmit(task) {
    if (this.runningTasks.size >= this.policy.maxConcurrentTasks) {
      return false;
    }

    const running = Array.from(this.runningTasks.values());

    if (task.kind === VerificationTaskKind.SYMBOLIC_ANALYSIS) {
      const activeSolvers = running.filter(t => t.kind === VerificationTaskKind.SYMBOLIC_ANALYSIS).length;
      if (activeSolvers >= this.policy.maxConcurrentSolvers) {
        return false;
      }
    }

    if (task.kind === VerificationTaskKind.TEST_EXECUTION || task.kind === VerificationTaskKind.TEST_GENERATION) {
      const activeTests = running.filter(t => t.kind === VerificationTaskKind.TEST_EXECUTION || t.kind === VerificationTaskKind.TEST_GENERATION).length;
      if (activeTests >= this.policy.maxConcurrentTests) {
        return false;
      }
    }

    if (task.kind === VerificationTaskKind.MUTATION_ANALYSIS || task.kind === VerificationTaskKind.MUTANT_KILLING) {
      const activeMutants = running.filter(t => t.kind === VerificationTaskKind.MUTATION_ANALYSIS || t.kind === VerificationTaskKind.MUTANT_KILLING).length;
      if (activeMutants >= this.policy.maxConcurrentMutants) {
        return false;
      }
    }

    return true;
  }

  admit(task) {
    if (!this.canAdmit(task)) return false;
    this.runningTasks.set(String(task.taskId || task.id), task);
    return true;
  }

  release(taskOrId) {
    const id = typeof taskOrId === 'string' ? taskOrId : String(taskOrId.taskId || taskOrId.id);
    return this.runningTasks.delete(id);
  }

  getRunningCount() {
    return this.runningTasks.size;
  }

  reset() {
    this.runningTasks.clear();
  }
}
