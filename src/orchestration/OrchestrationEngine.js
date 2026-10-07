import { VerificationTask } from './VerificationTask.js';
import { VerificationTaskKind } from './VerificationTaskKind.js';
import { VerificationTaskStatus } from './VerificationTaskStatus.js';
import { TaskDependencyGraph } from './TaskDependencyGraph.js';
import { TaskDependency } from './TaskDependency.js';
import { VerificationScheduler, SchedulingPolicy } from './VerificationScheduler.js';
import { ResourceAllocator } from './ResourceAllocator.js';
import { ResourceBudget } from './ResourceBudget.js';
import { ConcurrencyController } from './ConcurrencyController.js';
import { ConcurrencyPolicy } from './ConcurrencyPolicy.js';
import { EvidenceMerger } from './EvidenceMerger.js';
import { DuplicateTaskDetector } from './DuplicateTaskDetector.js';
import { SpeculativeExecutor } from './SpeculativeExecutor.js';
import { TaskRecoveryManager } from './TaskRecoveryManager.js';
import { TaskFailure, TaskFailureKind } from './TaskFailure.js';
import { CheckpointManager } from './CheckpointManager.js';
import { ExecutionTrace } from './ExecutionTrace.js';
import { ReplayEngine } from './ReplayEngine.js';
import { VerificationEvent, VerificationEventType } from './VerificationEvent.js';
import { VerificationEventLog } from './VerificationEventLog.js';
import { VerificationEventProcessor } from './VerificationEventProcessor.js';

// Worker adapters
import { StaticVerificationWorker } from './StaticVerificationWorker.js';
import { SymbolicWorker } from './SymbolicWorker.js';
import { TestingWorker } from './TestingWorker.js';
import { ConcolicWorker } from './ConcolicWorker.js';
import { MutationWorker } from './MutationWorker.js';
import { RepairWorker } from './RepairWorker.js';
import { ProbabilisticWorker } from './ProbabilisticWorker.js';
import { RegressionWorker } from './RegressionWorker.js';
import { OracleWorker } from './OracleWorker.js';

export class OrchestrationEngine {
  constructor({
    budget = new ResourceBudget(),
    concurrencyPolicy = new ConcurrencyPolicy(),
    schedulingPolicy = SchedulingPolicy.BALANCED,
    workers = null
  } = {}) {
    this.budget = budget instanceof ResourceBudget ? budget : new ResourceBudget(budget);
    this.concurrencyPolicy = concurrencyPolicy instanceof ConcurrencyPolicy ? concurrencyPolicy : new ConcurrencyPolicy(concurrencyPolicy);
    this.resourceAllocator = new ResourceAllocator({ budget: this.budget });
    this.concurrencyController = new ConcurrencyController({ policy: this.concurrencyPolicy });
    this.scheduler = new VerificationScheduler({
      policy: schedulingPolicy,
      resourceAllocator: this.resourceAllocator,
      concurrencyController: this.concurrencyController
    });

    this.taskGraph = new TaskDependencyGraph();
    this.evidenceMerger = new EvidenceMerger();
    this.duplicateDetector = new DuplicateTaskDetector();
    this.speculativeExecutor = new SpeculativeExecutor({ scheduler: this.scheduler });
    this.recoveryManager = new TaskRecoveryManager();
    this.checkpointManager = new CheckpointManager();
    this.trace = new ExecutionTrace();
    this.eventLog = new VerificationEventLog();
    this.eventProcessor = new VerificationEventProcessor({ eventLog: this.eventLog });

    // Initialize worker pool
    this.workers = workers || [
      new StaticVerificationWorker(),
      new SymbolicWorker(),
      new TestingWorker(),
      new ConcolicWorker(),
      new MutationWorker(),
      new RepairWorker(),
      new ProbabilisticWorker(),
      new RegressionWorker(),
      new OracleWorker()
    ];

    this.isPaused = false;
    this.completedEvidence = [];
    this.executionResults = new Map(); // taskId -> worker result
  }

  addTask(taskOptions) {
    const task = taskOptions instanceof VerificationTask ? taskOptions : new VerificationTask(taskOptions);
    this.taskGraph.addTask(task);
    this.scheduler.enqueue(task);

    this.trace.record('TASK_CREATED', { taskId: task.taskId, kind: task.kind, subject: task.subject });
    this.eventProcessor.process(new VerificationEvent({
      type: VerificationEventType.TASK_CREATED,
      payload: { taskId: task.taskId, kind: task.kind }
    }));

    if (task.isSpeculative && task.goalId) {
      this.speculativeExecutor.registerSpeculativeTask(task.goalId, task);
    }

    return task;
  }

  addDependency(sourceTaskId, targetTaskId, relation = 'REQUIRED') {
    const dep = new TaskDependency({ sourceTaskId, targetTaskId, relation });
    this.taskGraph.addDependency(dep);
    return dep;
  }

  decomposePlan(planningCandidates = [], goals = []) {
    const createdTasks = [];

    for (const cand of planningCandidates) {
      const exp = cand.experiment || cand;
      let taskKind = VerificationTaskKind.STATIC_VERIFICATION;

      switch (exp.kind) {
        case 'STATIC_VERIFY':
        case 'CONTRACT_CHECK':
        case 'INVARIANT_CHECK':
          taskKind = VerificationTaskKind.STATIC_VERIFICATION;
          break;
        case 'SYMBOLIC_PROVE':
        case 'SYMBOLIC_DISPROVE':
          taskKind = VerificationTaskKind.SYMBOLIC_ANALYSIS;
          break;
        case 'GENERATE_TEST':
          taskKind = VerificationTaskKind.TEST_GENERATION;
          break;
        case 'EXECUTE_TEST':
          taskKind = VerificationTaskKind.TEST_EXECUTION;
          break;
        case 'CONCOLIC_EXPLORE':
          taskKind = VerificationTaskKind.CONCOLIC_EXECUTION;
          break;
        case 'MUTATION_CAMPAIGN':
          taskKind = VerificationTaskKind.MUTATION_ANALYSIS;
          break;
        case 'KILL_MUTANT':
          taskKind = VerificationTaskKind.MUTANT_KILLING;
          break;
        case 'VALIDATE_REPAIR':
          taskKind = VerificationTaskKind.REPAIR_VALIDATION;
          break;
        case 'REGRESSION_RUN':
          taskKind = VerificationTaskKind.REGRESSION_ANALYSIS;
          break;
        case 'ORACLE_VALIDATION':
          taskKind = VerificationTaskKind.ORACLE_VALIDATION;
          break;
        case 'ANOMALY_REPRODUCTION':
          taskKind = VerificationTaskKind.ANOMALY_REPRODUCTION;
          break;
        default:
          taskKind = VerificationTaskKind.STATIC_VERIFICATION;
          break;
      }

      const task = this.addTask({
        experimentId: exp.id,
        kind: taskKind,
        subject: exp.target || 'target',
        priority: Math.round((cand.expectedValue?.informationGain || 0.5) * 10),
        resourceRequirements: {
          cpu: cand.estimatedCost?.cpuCost || 1,
          memoryMb: cand.estimatedCost?.memoryCostMb || 128,
          processes: 1,
          solverCalls: taskKind === VerificationTaskKind.SYMBOLIC_ANALYSIS ? 1 : 0
        },
        budget: { maxTimeMs: cand.estimatedCost?.wallClockEstimateMs || 50 }
      });

      createdTasks.push(task);
    }

    return createdTasks;
  }

  getWorkerForTask(task) {
    for (const worker of this.workers) {
      if (worker.canExecute(task)) {
        return worker;
      }
    }
    return null;
  }

  async stepExecution(context = {}) {
    if (this.isPaused) return [];

    const readyTasks = this.scheduler.dispatch(this.taskGraph);
    if (readyTasks.length === 0) return [];

    const executionPromises = readyTasks.map(async (task) => {
      // Deduplication check
      const duplicate = this.duplicateDetector.findDuplicate(task);
      if (duplicate) {
        this.scheduler.complete(task, duplicate.result);
        this.trace.record('TASK_DUPLICATE_REUSED', { taskId: task.taskId });
        return duplicate.result;
      }

      const worker = this.getWorkerForTask(task);
      if (!worker) {
        this.scheduler.fail(task, 'No suitable worker available');
        return { taskId: task.taskId, success: false, error: 'No worker available' };
      }

      this.trace.record('TASK_STARTED', { taskId: task.taskId, workerId: worker.workerId });
      this.eventProcessor.process(new VerificationEvent({
        type: VerificationEventType.TASK_STARTED,
        payload: { taskId: task.taskId, workerId: worker.workerId }
      }));

      const result = await worker.execute(task, context);
      this.executionResults.set(task.taskId, result);

      if (result.success) {
        this.scheduler.complete(task, result);
        this.duplicateDetector.registerCompletedTask(task, result);

        // Merge evidence
        const mergeRecord = this.evidenceMerger.merge(this.completedEvidence, [result]);
        this.completedEvidence = mergeRecord.mergedEvidence;

        this.trace.record('TASK_COMPLETED', { taskId: task.taskId, outcome: result.outcome });
        this.eventProcessor.process(new VerificationEvent({
          type: VerificationEventType.TASK_COMPLETED,
          payload: { taskId: task.taskId, outcome: result.outcome }
        }));

        // If goal satisfied, cancel speculative tasks
        if (result.outcome === 'FORMAL_PROOF_OBTAINED' && task.goalId) {
          this.speculativeExecutor.cancelSpeculativeTasksForGoal(task.goalId);
        }
      } else {
        const failure = new TaskFailure({
          taskId: task.taskId,
          kind: result.isTransient ? TaskFailureKind.TRANSIENT : TaskFailureKind.DETERMINISTIC_FAILURE,
          message: result.error,
          retryable: Boolean(result.isTransient)
        });

        const recovery = this.recoveryManager.handleFailure(task, failure);
        if (recovery.shouldRetry) {
          this.scheduler.enqueue(recovery.task);
          this.trace.record('TASK_RETRIED', { taskId: task.taskId, retryCount: recovery.task.retryCount });
          this.eventProcessor.process(new VerificationEvent({
            type: VerificationEventType.TASK_RETRIED,
            payload: { taskId: task.taskId, retryCount: recovery.task.retryCount }
          }));
        } else {
          this.scheduler.fail(task, result.error);
          this.trace.record('TASK_FAILED', { taskId: task.taskId, error: result.error });
          this.eventProcessor.process(new VerificationEvent({
            type: VerificationEventType.TASK_FAILED,
            payload: { taskId: task.taskId, error: result.error }
          }));
        }
      }

      return result;
    });

    return Promise.all(executionPromises);
  }

  async startExecution(context = {}) {
    this.isPaused = false;
    let iterations = 0;
    const maxIterations = 100;

    while (!this.isPaused && iterations < maxIterations) {
      iterations++;
      const stepped = await this.stepExecution(context);
      if (stepped.length === 0 && this.scheduler.getRunningCount() === 0 && this.scheduler.getQueueLength() === 0) {
        break;
      }
    }

    return {
      completedCount: this.scheduler.getCompletedCount(),
      failedCount: this.scheduler.failed.size,
      cancelledCount: this.scheduler.cancelled.size,
      evidence: this.completedEvidence
    };
  }

  pauseExecution() {
    this.isPaused = true;
  }

  resumeExecution() {
    this.isPaused = false;
  }

  cancelTask(taskId, reason = 'USER_REQUEST') {
    const cancelled = this.scheduler.cancel(taskId, reason);
    if (cancelled) {
      this.trace.record('TASK_CANCELLED', { taskId, reason });
      this.eventProcessor.process(new VerificationEvent({
        type: VerificationEventType.TASK_CANCELLED,
        payload: { taskId, reason }
      }));
    }
    return cancelled;
  }

  cancelExecution() {
    const allTasks = this.taskGraph.getAllTasks();
    for (const t of allTasks) {
      this.cancelTask(t.taskId, 'EXECUTION_CANCELLED');
    }
  }

  getTask(taskId) {
    return this.taskGraph.getTask(taskId);
  }

  getTasks() {
    return this.taskGraph.getAllTasks();
  }

  getReadyTasks() {
    return this.scheduler.queue;
  }

  getRunningTasks() {
    return Array.from(this.scheduler.running.values());
  }

  getCompletedTasks() {
    return Array.from(this.scheduler.completed.values());
  }

  getResourceBudget() {
    return this.budget;
  }

  getResourceUsage() {
    return this.resourceAllocator.currentUsage;
  }

  getExecutionTrace() {
    return this.trace;
  }

  checkpoint() {
    const cp = this.checkpointManager.saveCheckpoint({
      taskGraph: this.taskGraph,
      runningTaskIds: Array.from(this.scheduler.running.keys()),
      completedTaskIds: Array.from(this.scheduler.completed.keys()),
      resourceUsage: this.getResourceUsage().toJSON(),
      evidence: this.completedEvidence,
      schedulerState: this.scheduler.toJSON()
    });

    this.trace.record('CHECKPOINT_CREATED', { checkpointId: cp.checkpointId });
    this.eventProcessor.process(new VerificationEvent({
      type: VerificationEventType.CHECKPOINT_CREATED,
      payload: { checkpointId: cp.checkpointId }
    }));

    return cp;
  }

  restore(checkpointOrId) {
    const cp = typeof checkpointOrId === 'string' ? this.checkpointManager.getCheckpoint(checkpointOrId) : checkpointOrId;
    if (!cp) return false;

    this.completedEvidence = [...cp.evidence];
    for (const id of cp.completedTaskIds) {
      const task = this.taskGraph.getTask(id);
      if (task) {
        this.scheduler.completed.set(id, task.withStatus ? task.withStatus(VerificationTaskStatus.COMPLETED) : task);
      }
    }
    return true;
  }

  replay(onEventCallback = null) {
    return ReplayEngine.replay(this.trace, onEventCallback);
  }
}
