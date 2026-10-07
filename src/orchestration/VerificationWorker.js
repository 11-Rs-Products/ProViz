export class VerificationWorker {
  constructor({
    workerId,
    name = 'GenericVerificationWorker',
    supportedKinds = [],
    concurrency = 1
  } = {}) {
    this.workerId = workerId || `worker_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.name = name;
    this.supportedKinds = Object.freeze([...supportedKinds]);
    this.concurrency = Number(concurrency);
    this.runningTasks = new Map(); // taskId -> VerificationTask
    this.isHealthy = true;
  }

  canExecute(task) {
    if (!this.isHealthy) return false;
    return this.supportedKinds.includes(task.kind);
  }

  estimateCost(task) {
    return {
      wallClockEstimateMs: task.budget?.maxTimeMs || 50,
      cpuCost: task.resourceRequirements?.cpu || 1.0,
      memoryCostMb: task.resourceRequirements?.memoryMb || 128
    };
  }

  async execute(task, context = {}) {
    this.runningTasks.set(task.taskId, task);
    try {
      const outcome = await this.performExecution(task, context);
      this.runningTasks.delete(task.taskId);
      return {
        taskId: task.taskId,
        workerId: this.workerId,
        success: true,
        outcome: outcome?.outcome || 'COMPLETED',
        evidenceGenerated: outcome?.evidenceGenerated || [],
        confidenceDelta: outcome?.confidenceDelta || 0.1,
        uncertaintyReduction: outcome?.uncertaintyReduction || 0.1,
        executionCostMs: outcome?.executionCostMs || 10,
        outputData: outcome?.outputData || {}
      };
    } catch (err) {
      this.runningTasks.delete(task.taskId);
      return {
        taskId: task.taskId,
        workerId: this.workerId,
        success: false,
        error: err.message,
        outcome: 'FAILED',
        isTransient: Boolean(err.isTransient)
      };
    }
  }

  async performExecution(task, context = {}) {
    return {
      outcome: 'COMPLETED',
      evidenceGenerated: [{ kind: 'TASK_EVIDENCE', subject: task.subject, polarity: 'TRUE' }],
      confidenceDelta: 0.1,
      uncertaintyReduction: 0.1,
      executionCostMs: 10
    };
  }

  cancel(taskId) {
    if (this.runningTasks.has(String(taskId))) {
      this.runningTasks.delete(String(taskId));
      return true;
    }
    return false;
  }

  recover() {
    this.runningTasks.clear();
    this.isHealthy = true;
  }

  toJSON() {
    return {
      workerId: this.workerId,
      name: this.name,
      supportedKinds: this.supportedKinds,
      runningCount: this.runningTasks.size,
      isHealthy: this.isHealthy
    };
  }
}
