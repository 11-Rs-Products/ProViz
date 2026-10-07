import { VerificationTaskKind } from './VerificationTaskKind.js';
import { VerificationTaskStatus } from './VerificationTaskStatus.js';

export class VerificationTask {
  constructor({
    taskId,
    id,
    goalId = null,
    experimentId = null,
    kind = VerificationTaskKind.STATIC_VERIFICATION,
    subject = 'general',
    dependencies = [],
    priority = 5,
    resourceRequirements = { cpu: 1, memoryMb: 128, processes: 1, solverCalls: 0 },
    budget = { maxTimeMs: 5000 },
    inputs = {},
    expectedOutputs = [],
    evidenceRequirements = [],
    environmentRequirements = {},
    deterministicKey = null,
    status = VerificationTaskStatus.QUEUED,
    isSpeculative = false,
    cancellationTrigger = 'GOAL_SATISFIED',
    retryCount = 0,
    metadata = {}
  } = {}) {
    this.taskId = String(taskId || id || `task_${kind}_${String(subject)}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`);
    this.id = this.taskId;
    this.goalId = goalId ? String(goalId) : null;
    this.experimentId = experimentId ? String(experimentId) : null;
    this.kind = kind;
    this.subject = String(subject);
    this.dependencies = Object.freeze([...dependencies]);
    this.priority = Number(priority);
    this.resourceRequirements = Object.freeze({ ...resourceRequirements });
    this.budget = Object.freeze({ ...budget });
    this.inputs = Object.freeze({ ...inputs });
    this.expectedOutputs = Object.freeze([...expectedOutputs]);
    this.evidenceRequirements = Object.freeze([...evidenceRequirements]);
    this.environmentRequirements = Object.freeze({ ...environmentRequirements });
    this.deterministicKey = deterministicKey || `${this.kind}::${this.subject}::${JSON.stringify(this.inputs)}`;
    this.status = status;
    this.isSpeculative = Boolean(isSpeculative);
    this.cancellationTrigger = cancellationTrigger;
    this.retryCount = Number(retryCount);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  withStatus(newStatus) {
    return new VerificationTask({
      ...this,
      status: newStatus
    });
  }

  withRetryCount(newRetryCount) {
    return new VerificationTask({
      ...this,
      retryCount: newRetryCount
    });
  }

  toJSON() {
    return {
      taskId: this.taskId,
      goalId: this.goalId,
      experimentId: this.experimentId,
      kind: this.kind,
      subject: this.subject,
      dependencies: this.dependencies,
      priority: this.priority,
      resourceRequirements: this.resourceRequirements,
      budget: this.budget,
      inputs: this.inputs,
      expectedOutputs: this.expectedOutputs,
      evidenceRequirements: this.evidenceRequirements,
      environmentRequirements: this.environmentRequirements,
      deterministicKey: this.deterministicKey,
      status: this.status,
      isSpeculative: this.isSpeculative,
      retryCount: this.retryCount,
      metadata: this.metadata
    };
  }
}
