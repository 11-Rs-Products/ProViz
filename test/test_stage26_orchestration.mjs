import test from 'node:test';
import assert from 'node:assert/strict';

import * as Orchestration from '../src/orchestration/index.js';
import * as Planning from '../src/planning/index.js';
import * as Probabilistic from '../src/probabilistic/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

test('Stage 26 — Universal Distributed Verification Orchestration & Parallel Evidence Execution Engine', async (t) => {

  // =========================================================================
  // 1. Verification Task Model
  // =========================================================================
  await t.test('VerificationTaskKind enum definitions', () => {
    const kinds = Object.values(Orchestration.VerificationTaskKind);
    assert.strictEqual(kinds.length, 15);
    assert.ok(kinds.includes('STATIC_VERIFICATION'));
    assert.ok(kinds.includes('SYMBOLIC_ANALYSIS'));
    assert.ok(kinds.includes('CONCOLIC_EXECUTION'));
    assert.ok(kinds.includes('MUTATION_ANALYSIS'));
    assert.ok(kinds.includes('REPAIR_VALIDATION'));
  });

  await t.test('VerificationTaskStatus enum lifecycle states', () => {
    const statuses = Object.values(Orchestration.VerificationTaskStatus);
    assert.strictEqual(statuses.length, 11);
    assert.ok(statuses.includes('QUEUED'));
    assert.ok(statuses.includes('RUNNING'));
    assert.ok(statuses.includes('COMPLETED'));
    assert.ok(statuses.includes('FAILED'));
    assert.ok(statuses.includes('CANCELLED'));
  });

  await t.test('VerificationTask creation and immutability', () => {
    const task = new Orchestration.VerificationTask({
      taskId: 'task_001',
      kind: Orchestration.VerificationTaskKind.STATIC_VERIFICATION,
      subject: 'math.divide',
      priority: 8
    });

    assert.strictEqual(task.taskId, 'task_001');
    assert.strictEqual(task.kind, 'STATIC_VERIFICATION');
    assert.strictEqual(task.priority, 8);
    assert.strictEqual(task.status, Orchestration.VerificationTaskStatus.QUEUED);

    const running = task.withStatus(Orchestration.VerificationTaskStatus.RUNNING);
    assert.strictEqual(running.status, Orchestration.VerificationTaskStatus.RUNNING);
    assert.strictEqual(task.status, Orchestration.VerificationTaskStatus.QUEUED); // Original immutable
  });

  await t.test('VerificationTask retry count updating', () => {
    const task = new Orchestration.VerificationTask({ taskId: 't_retry' });
    assert.strictEqual(task.retryCount, 0);
    const retried = task.withRetryCount(2);
    assert.strictEqual(retried.retryCount, 2);
    assert.strictEqual(task.retryCount, 0);
  });

  await t.test('VerificationTask deterministicKey generation', () => {
    const task1 = new Orchestration.VerificationTask({
      kind: Orchestration.VerificationTaskKind.STATIC_VERIFICATION,
      subject: 'auth.login',
      inputs: { user: 'admin' }
    });
    const task2 = new Orchestration.VerificationTask({
      kind: Orchestration.VerificationTaskKind.STATIC_VERIFICATION,
      subject: 'auth.login',
      inputs: { user: 'admin' }
    });
    assert.strictEqual(task1.deterministicKey, task2.deterministicKey);
  });

  await t.test('VerificationTask toJSON serialization', () => {
    const task = new Orchestration.VerificationTask({ taskId: 't_json', subject: 'parser.parse' });
    const json = task.toJSON();
    assert.strictEqual(json.taskId, 't_json');
    assert.strictEqual(json.subject, 'parser.parse');
  });

  // =========================================================================
  // 2. Task Dependency Graph
  // =========================================================================
  await t.test('TaskDependency model', () => {
    const dep = new Orchestration.TaskDependency({
      sourceTaskId: 't1',
      targetTaskId: 't2',
      relation: Orchestration.DependencyRelation.REQUIRED
    });
    assert.strictEqual(dep.sourceTaskId, 't1');
    assert.strictEqual(dep.targetTaskId, 't2');
    assert.strictEqual(dep.relation, 'REQUIRED');
  });

  await t.test('TaskDependencyGraph addTask and queries', () => {
    const graph = new Orchestration.TaskDependencyGraph();
    const t1 = new Orchestration.VerificationTask({ taskId: 'task_a' });
    const t2 = new Orchestration.VerificationTask({ taskId: 'task_b', dependencies: ['task_a'] });

    graph.addTask(t1);
    graph.addTask(t2);

    assert.strictEqual(graph.getAllTasks().length, 2);
    assert.strictEqual(graph.getTask('task_a').taskId, 'task_a');
    assert.strictEqual(graph.getPrerequisites('task_b').length, 1);
    assert.strictEqual(graph.getDependents('task_a').length, 1);
  });

  await t.test('TaskDependencyGraph getReadyTasks and getBlockedTasks', () => {
    const graph = new Orchestration.TaskDependencyGraph();
    const tA = new Orchestration.VerificationTask({ taskId: 'A' });
    const tB = new Orchestration.VerificationTask({ taskId: 'B', dependencies: ['A'] });
    graph.addTask(tA);
    graph.addTask(tB);

    const readyInit = graph.getReadyTasks();
    assert.strictEqual(readyInit.length, 1);
    assert.strictEqual(readyInit[0].taskId, 'A');

    const blockedInit = graph.getBlockedTasks();
    assert.strictEqual(blockedInit.length, 1);
    assert.strictEqual(blockedInit[0].taskId, 'B');

    // Once A is completed
    const readyAfterA = graph.getReadyTasks(new Set(['A']));
    assert.strictEqual(readyAfterA.length, 1);
    assert.strictEqual(readyAfterA[0].taskId, 'B');
  });

  await t.test('TaskDependencyGraph cycle detection', () => {
    const graph = new Orchestration.TaskDependencyGraph();
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'C1' }));
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'C2' }));
    graph.addDependency({ sourceTaskId: 'C1', targetTaskId: 'C2' });
    graph.addDependency({ sourceTaskId: 'C2', targetTaskId: 'C1' });

    assert.strictEqual(graph.detectCycles(), true);
  });

  await t.test('TaskDependencyGraph topologicalOrder sorting', () => {
    const graph = new Orchestration.TaskDependencyGraph();
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'X' }));
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'Y', dependencies: ['X'] }));
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'Z', dependencies: ['Y'] }));

    const topo = graph.topologicalOrder();
    assert.strictEqual(topo.length, 3);
    assert.strictEqual(topo[0].taskId, 'X');
    assert.strictEqual(topo[1].taskId, 'Y');
    assert.strictEqual(topo[2].taskId, 'Z');
  });

  await t.test('TaskGraphAnalyzer summary analysis', () => {
    const graph = new Orchestration.TaskDependencyGraph();
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'Node1' }));
    const analysis = Orchestration.TaskGraphAnalyzer.analyze(graph);
    assert.strictEqual(analysis.totalTasks, 1);
    assert.strictEqual(analysis.hasCycles, false);
    assert.strictEqual(analysis.isExecutable, true);
  });

  await t.test('TaskGraphAnalyzer critical path computation', () => {
    const graph = new Orchestration.TaskDependencyGraph();
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'CP1' }));
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'CP2', dependencies: ['CP1'] }));
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'CP3', dependencies: ['CP2'] }));

    const path = Orchestration.TaskGraphAnalyzer.computeCriticalPath(graph);
    assert.deepStrictEqual(path, ['CP1', 'CP2', 'CP3']);
  });

  // =========================================================================
  // 3. Execution Resource Model
  // =========================================================================
  await t.test('ResourceKind enum definitions', () => {
    const kinds = Object.values(Orchestration.ResourceKind);
    assert.ok(kinds.includes('CPU'));
    assert.ok(kinds.includes('MEMORY'));
    assert.ok(kinds.includes('SOLVER'));
    assert.ok(kinds.includes('MUTANT'));
  });

  await t.test('ResourceBudget bounds and exhaustion evaluation', () => {
    const budget = new Orchestration.ResourceBudget({ maxCpu: 4, maxMemoryMb: 2048 });
    assert.strictEqual(budget.maxCpu, 4);
    assert.strictEqual(budget.maxMemoryMb, 2048);
    assert.strictEqual(budget.isExceededBy({ cpu: 3, memoryMb: 1024 }), false);
    assert.strictEqual(budget.isExceededBy({ cpu: 5 }), true);
  });

  await t.test('ResourceUsage arithmetic add and subtract', () => {
    const u1 = new Orchestration.ResourceUsage({ cpu: 2, memoryMb: 512 });
    const u2 = new Orchestration.ResourceUsage({ cpu: 1, memoryMb: 256 });
    const sum = u1.add(u2);
    assert.strictEqual(sum.cpu, 3);
    assert.strictEqual(sum.memoryMb, 768);

    const diff = sum.subtract(u2);
    assert.strictEqual(diff.cpu, 2);
    assert.strictEqual(diff.memoryMb, 512);
  });

  await t.test('ResourceAvailability admission checks', () => {
    const avail = new Orchestration.ResourceAvailability({
      budget: new Orchestration.ResourceBudget({ maxCpu: 4, maxMemoryMb: 1024 }),
      currentUsage: new Orchestration.ResourceUsage({ cpu: 3, memoryMb: 512 })
    });
    assert.strictEqual(avail.availableCpu, 1);
    assert.strictEqual(avail.availableMemoryMb, 512);
    assert.strictEqual(avail.canAdmit({ cpu: 1, memoryMb: 256 }), true);
    assert.strictEqual(avail.canAdmit({ cpu: 2 }), false);
  });

  await t.test('ResourceAllocator allocation and release cycle', () => {
    const allocator = new Orchestration.ResourceAllocator({
      budget: new Orchestration.ResourceBudget({ maxCpu: 2, maxMemoryMb: 1024 })
    });
    const task = new Orchestration.VerificationTask({
      taskId: 't_res',
      resourceRequirements: { cpu: 1, memoryMb: 512, processes: 1 }
    });

    const allocated = allocator.allocate(task);
    assert.ok(allocated);
    assert.strictEqual(allocator.currentUsage.cpu, 1);

    const released = allocator.release(task);
    assert.strictEqual(released, true);
    assert.strictEqual(allocator.currentUsage.cpu, 0);
  });

  // =========================================================================
  // 4. Verification Workers
  // =========================================================================
  await t.test('VerificationWorker base class execution and cancellation', async () => {
    const worker = new Orchestration.VerificationWorker({ supportedKinds: ['GENERIC'] });
    const task = new Orchestration.VerificationTask({ taskId: 'tw_1', kind: 'GENERIC' });
    assert.strictEqual(worker.canExecute(task), true);

    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'COMPLETED');
  });

  await t.test('StaticVerificationWorker formal proof execution', async () => {
    const worker = new Orchestration.StaticVerificationWorker();
    const task = new Orchestration.VerificationTask({
      taskId: 'ts_1',
      kind: Orchestration.VerificationTaskKind.STATIC_VERIFICATION,
      subject: 'math.add'
    });
    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'FORMAL_PROOF_OBTAINED');
    assert.strictEqual(res.evidenceGenerated[0].strength, 'FORMAL');
  });

  await t.test('SymbolicWorker counterexample proving', async () => {
    const worker = new Orchestration.SymbolicWorker();
    const task = new Orchestration.VerificationTask({
      taskId: 'tsym_1',
      kind: Orchestration.VerificationTaskKind.SYMBOLIC_ANALYSIS,
      subject: 'auth.verify',
      inputs: { hasCounterexample: true }
    });
    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'COUNTEREXAMPLE_PROVED');
  });

  await t.test('TestingWorker test execution pass', async () => {
    const worker = new Orchestration.TestingWorker();
    const task = new Orchestration.VerificationTask({
      taskId: 'tt_1',
      kind: Orchestration.VerificationTaskKind.TEST_EXECUTION,
      subject: 'crypto.hash'
    });
    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'TESTS_EXECUTED_PASSED');
  });

  await t.test('ConcolicWorker path exploration', async () => {
    const worker = new Orchestration.ConcolicWorker();
    const task = new Orchestration.VerificationTask({
      taskId: 'tc_1',
      kind: Orchestration.VerificationTaskKind.CONCOLIC_EXECUTION,
      subject: 'parser.state'
    });
    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'NEW_PATH_EXPLORED');
  });

  await t.test('MutationWorker mutant killing', async () => {
    const worker = new Orchestration.MutationWorker();
    const task = new Orchestration.VerificationTask({
      taskId: 'tm_1',
      kind: Orchestration.VerificationTaskKind.MUTANT_KILLING,
      subject: 'mutant_42'
    });
    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'MUTANT_KILLED');
  });

  await t.test('RepairWorker patch validation', async () => {
    const worker = new Orchestration.RepairWorker();
    const task = new Orchestration.VerificationTask({
      taskId: 'tr_1',
      kind: Orchestration.VerificationTaskKind.REPAIR_VALIDATION,
      subject: 'patch_101'
    });
    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'PATCH_VALIDATED');
  });

  await t.test('ProbabilisticWorker distribution calibration', async () => {
    const worker = new Orchestration.ProbabilisticWorker();
    const task = new Orchestration.VerificationTask({
      taskId: 'tp_1',
      kind: Orchestration.VerificationTaskKind.PROBABILISTIC_ANALYSIS,
      subject: 'network.latency'
    });
    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'DISTRIBUTION_CALIBRATED');
  });

  await t.test('RegressionWorker regression run', async () => {
    const worker = new Orchestration.RegressionWorker();
    const task = new Orchestration.VerificationTask({
      taskId: 'treg_1',
      kind: Orchestration.VerificationTaskKind.REGRESSION_ANALYSIS,
      subject: 'suite.core'
    });
    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'REGRESSION_CLEAN');
  });

  await t.test('OracleWorker oracle validation', async () => {
    const worker = new Orchestration.OracleWorker();
    const task = new Orchestration.VerificationTask({
      taskId: 'torc_1',
      kind: Orchestration.VerificationTaskKind.ORACLE_VALIDATION,
      subject: 'spec.calc'
    });
    const res = await worker.execute(task);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'ORACLE_STABLE');
  });

  // =========================================================================
  // 5. Workspace Isolation & Sandboxing
  // =========================================================================
  await t.test('VerificationWorkspace snapshot model', () => {
    const ws = new Orchestration.VerificationWorkspace({
      workspaceId: 'ws_main',
      environmentFingerprint: 'node_v22'
    });
    assert.strictEqual(ws.workspaceId, 'ws_main');
    assert.strictEqual(ws.environmentFingerprint, 'node_v22');
  });

  await t.test('TaskWorkspace isolation context creation', () => {
    const ws = new Orchestration.VerificationWorkspace({ workspaceId: 'ws_root' });
    const task = new Orchestration.VerificationTask({ taskId: 't_sandbox' });
    const taskWs = Orchestration.WorkspaceIsolation.createIsolatedContext(task, ws);
    assert.strictEqual(taskWs.taskId, 't_sandbox');
    assert.strictEqual(taskWs.baseWorkspaceId, 'ws_root');
    assert.ok(taskWs.scratchDirectory.includes('t_sandbox'));
  });

  await t.test('WorkspaceMerge deduplication', () => {
    const base = [{ kind: 'E1', subject: 's1', polarity: 'TRUE' }];
    const results = [
      { evidenceGenerated: [{ kind: 'E1', subject: 's1', polarity: 'TRUE' }, { kind: 'E2', subject: 's2', polarity: 'TRUE' }] }
    ];
    const merged = Orchestration.WorkspaceMerge.mergeEvidence(base, results);
    assert.strictEqual(merged.length, 2);
  });

  // =========================================================================
  // 6. Concurrency & Scheduling
  // =========================================================================
  await t.test('ConcurrencyPolicy configuration', () => {
    const policy = new Orchestration.ConcurrencyPolicy({ maxWorkers: 4, maxConcurrentSolvers: 1 });
    assert.strictEqual(policy.maxWorkers, 4);
    assert.strictEqual(policy.maxConcurrentSolvers, 1);
  });

  await t.test('ConcurrencyController throttling solver tasks', () => {
    const ctrl = new Orchestration.ConcurrencyController({
      policy: new Orchestration.ConcurrencyPolicy({ maxConcurrentSolvers: 1, maxConcurrentTasks: 4 })
    });
    const taskSym1 = new Orchestration.VerificationTask({ taskId: 'sym1', kind: Orchestration.VerificationTaskKind.SYMBOLIC_ANALYSIS });
    const taskSym2 = new Orchestration.VerificationTask({ taskId: 'sym2', kind: Orchestration.VerificationTaskKind.SYMBOLIC_ANALYSIS });

    assert.strictEqual(ctrl.canAdmit(taskSym1), true);
    ctrl.admit(taskSym1);
    assert.strictEqual(ctrl.canAdmit(taskSym2), false); // Throttled to 1 solver

    ctrl.release(taskSym1);
    assert.strictEqual(ctrl.canAdmit(taskSym2), true); // Released slot
  });

  await t.test('VerificationScheduler priority ordering and dispatch', () => {
    const sched = new Orchestration.VerificationScheduler({ policy: Orchestration.SchedulingPolicy.PRIORITY });
    const tLow = new Orchestration.VerificationTask({ taskId: 't_low', priority: 2 });
    const tHigh = new Orchestration.VerificationTask({ taskId: 't_high', priority: 10 });

    sched.enqueue(tLow);
    sched.enqueue(tHigh);

    const dispatched = sched.dispatch();
    assert.strictEqual(dispatched.length, 2);
    assert.strictEqual(dispatched[0].taskId, 't_high');
    assert.strictEqual(dispatched[1].taskId, 't_low');
  });

  await t.test('VerificationScheduler task cancellation', () => {
    const sched = new Orchestration.VerificationScheduler();
    const task = new Orchestration.VerificationTask({ taskId: 't_cancel' });
    sched.enqueue(task);
    assert.strictEqual(sched.getQueueLength(), 1);

    sched.cancel('t_cancel', 'SUPERSEDED');
    assert.strictEqual(sched.getQueueLength(), 0);
  });

  // =========================================================================
  // 7. Critical-Path Scheduling & Bottlenecks
  // =========================================================================
  await t.test('CriticalPathAnalyzer priority boost', () => {
    const graph = new Orchestration.TaskDependencyGraph();
    const t1 = new Orchestration.VerificationTask({ taskId: 'P1', priority: 1 });
    const t2 = new Orchestration.VerificationTask({ taskId: 'P2', dependencies: ['P1'], priority: 1 });
    const tIsolated = new Orchestration.VerificationTask({ taskId: 'ISO', priority: 1 });
    graph.addTask(t1);
    graph.addTask(t2);
    graph.addTask(tIsolated);

    const boosted = Orchestration.CriticalPathAnalyzer.prioritizeCriticalPathTasks(graph, [t1, t2, tIsolated]);
    const boostedP1 = boosted.find(t => t.taskId === 'P1');
    const boostedIso = boosted.find(t => t.taskId === 'ISO');
    assert.ok(boostedP1.priority > boostedIso.priority);
  });

  await t.test('BottleneckAnalyzer starvation detection', () => {
    const sched = new Orchestration.VerificationScheduler();
    const alloc = new Orchestration.ResourceAllocator({ budget: new Orchestration.ResourceBudget({ maxCpu: 1 }) });
    const ctrl = new Orchestration.ConcurrencyController();

    // Allocate the only CPU
    alloc.allocate(new Orchestration.VerificationTask({ taskId: 't_heavy', resourceRequirements: { cpu: 1, memoryMb: 128 } }));
    const bottlenecks = Orchestration.BottleneckAnalyzer.analyzeBottlenecks(sched, alloc, ctrl);
    assert.ok(bottlenecks.some(b => b.type === 'CPU_STARVATION'));
  });

  // =========================================================================
  // 8. Deduplication & Reuse
  // =========================================================================
  await t.test('TaskFingerprint deterministic calculation', () => {
    const task = new Orchestration.VerificationTask({ kind: 'TEST', subject: 'calc', inputs: { a: 1 } });
    const fp1 = Orchestration.TaskFingerprint.compute(task);
    const fp2 = Orchestration.TaskFingerprint.compute(task);
    assert.strictEqual(fp1, fp2);
  });

  await t.test('DuplicateTaskDetector registration and filtering', () => {
    const detector = new Orchestration.DuplicateTaskDetector();
    const task1 = new Orchestration.VerificationTask({ taskId: 'task_dup1', kind: 'TEST', subject: 'sub_a' });
    const task2 = new Orchestration.VerificationTask({ taskId: 'task_dup2', kind: 'TEST', subject: 'sub_a' });

    assert.strictEqual(detector.isDuplicate(task1), false);
    detector.registerCompletedTask(task1, { success: true });

    assert.strictEqual(detector.isDuplicate(task2), true);
    const filtered = detector.filterDuplicates([task2]);
    assert.strictEqual(filtered.length, 0);
  });

  // =========================================================================
  // 9. Speculative Verification & Cancellation
  // =========================================================================
  await t.test('SpeculativeTask creation and cancellation on goal satisfaction', () => {
    const sched = new Orchestration.VerificationScheduler();
    const exec = new Orchestration.SpeculativeExecutor({ scheduler: sched });
    const specTask = new Orchestration.SpeculativeTask({
      taskId: 'spec_1',
      goalId: 'goal_auth',
      subject: 'auth.login'
    });

    sched.enqueue(specTask);
    exec.registerSpeculativeTask('goal_auth', specTask);

    const cancelled = exec.cancelSpeculativeTasksForGoal('goal_auth');
    assert.strictEqual(cancelled.length, 1);
    assert.strictEqual(cancelled[0].status, Orchestration.VerificationTaskStatus.CANCELLED);
    assert.strictEqual(sched.getQueueLength(), 0);
  });

  // =========================================================================
  // 10. Cancellation & Preemption
  // =========================================================================
  await t.test('CancellationReason enum coverage', () => {
    const reasons = Object.values(Orchestration.CancellationReason);
    assert.ok(reasons.includes('GOAL_SATISFIED'));
    assert.ok(reasons.includes('BUDGET_EXHAUSTED'));
    assert.ok(reasons.includes('SUPERSEDED'));
  });

  await t.test('PreemptionPolicy delta evaluation', () => {
    const policy = new Orchestration.PreemptionPolicy({ minPriorityDelta: 5 });
    const running = new Orchestration.VerificationTask({ priority: 2 });
    const candidateHigh = new Orchestration.VerificationTask({ priority: 8 });
    const candidateLow = new Orchestration.VerificationTask({ priority: 3 });

    assert.strictEqual(policy.shouldPreempt(running, candidateHigh), true);
    assert.strictEqual(policy.shouldPreempt(running, candidateLow), false);
  });

  // =========================================================================
  // 11. Failure Recovery & Retries
  // =========================================================================
  await t.test('TaskFailure model', () => {
    const failure = new Orchestration.TaskFailure({
      taskId: 't_fail',
      kind: Orchestration.TaskFailureKind.TRANSIENT,
      retryable: true
    });
    assert.strictEqual(failure.kind, 'TRANSIENT');
    assert.strictEqual(failure.retryable, true);
  });

  await t.test('TaskRecoveryManager transient failure retry backoff', () => {
    const manager = new Orchestration.TaskRecoveryManager();
    const task = new Orchestration.VerificationTask({ taskId: 't_transient' });
    const failure = new Orchestration.TaskFailure({
      taskId: 't_transient',
      kind: Orchestration.TaskFailureKind.TRANSIENT,
      retryable: true
    });

    const decision1 = manager.handleFailure(task, failure);
    assert.strictEqual(decision1.shouldRetry, true);
    assert.strictEqual(decision1.task.retryCount, 1);
    assert.strictEqual(decision1.task.status, Orchestration.VerificationTaskStatus.RETRYING);
  });

  await t.test('TaskRecoveryManager permanent failure termination', () => {
    const manager = new Orchestration.TaskRecoveryManager();
    const task = new Orchestration.VerificationTask({ taskId: 't_perm' });
    const failure = new Orchestration.TaskFailure({
      taskId: 't_perm',
      kind: Orchestration.TaskFailureKind.DETERMINISTIC_FAILURE,
      retryable: false
    });

    const decision = manager.handleFailure(task, failure);
    assert.strictEqual(decision.shouldRetry, false);
    assert.strictEqual(decision.task.status, Orchestration.VerificationTaskStatus.FAILED);
  });

  // =========================================================================
  // 12. Evidence Merging & Conflict Reconciliation
  // =========================================================================
  await t.test('EvidenceMerger detects and reconciles polarity conflict', () => {
    const merger = new Orchestration.EvidenceMerger();
    const base = [{ subject: 'flag.active', polarity: 'TRUE', strength: 'FORMAL' }];
    const results = [{
      evidenceGenerated: [{ subject: 'flag.active', polarity: 'FALSE', strength: 'EMPIRICAL' }]
    }];

    const merged = merger.merge(base, results);
    assert.strictEqual(merged.conflicts.length, 1);
    assert.strictEqual(merged.conflicts[0].conflictType, 'FORMAL_VS_EMPIRICAL');
  });

  // =========================================================================
  // 13. Adaptive Resource Allocation & Batching
  // =========================================================================
  await t.test('ResourceValueModel return computation', () => {
    const ret = Orchestration.ResourceValueModel.computeReturn(0.8, 0.6, 0.4, 2.0);
    assert.strictEqual(ret, 0.9); // (0.8 + 0.6 + 0.4) / 2.0 = 1.8 / 2.0 = 0.9
  });

  await t.test('AdaptiveResourceAllocator learns return rates', () => {
    const alloc = new Orchestration.AdaptiveResourceAllocator();
    alloc.recordReturn('STATIC_VERIFICATION', 0.9, 0.9, 0.9, 1.0);
    alloc.recordReturn('STATIC_VERIFICATION', 0.7, 0.7, 0.7, 1.0);
    const avg = alloc.getAverageReturn('STATIC_VERIFICATION');
    assert.ok(avg > 1.5);
  });

  await t.test('BatchOptimizer groups compatible tasks into batches', () => {
    const tasks = [];
    for (let i = 0; i < 25; i++) {
      tasks.push(new Orchestration.VerificationTask({ taskId: `m_${i}`, kind: Orchestration.VerificationTaskKind.MUTANT_KILLING }));
    }
    const batches = Orchestration.BatchOptimizer.createBatches(tasks, 10);
    assert.strictEqual(batches.length, 3);
    assert.strictEqual(batches[0].tasks.length, 10);
    assert.strictEqual(batches[2].tasks.length, 5);
  });

  // =========================================================================
  // 14. Incremental Execution
  // =========================================================================
  await t.test('IncrementalTaskPlanner isolates affected vs preserved tasks', () => {
    const tA = new Orchestration.VerificationTask({ taskId: 't_math', subject: 'src/math.js' });
    const tB = new Orchestration.VerificationTask({ taskId: 't_str', subject: 'src/string.js' });

    const plan = Orchestration.IncrementalTaskPlanner.planIncrementalTasks([tA, tB], ['src/math.js']);
    assert.strictEqual(plan.tasksToRun.length, 1);
    assert.strictEqual(plan.tasksToRun[0].taskId, 't_math');
    assert.strictEqual(plan.tasksToPreserve.length, 1);
    assert.strictEqual(plan.tasksToPreserve[0].taskId, 't_str');
  });

  // =========================================================================
  // 15. Checkpoints & Deterministic Replay
  // =========================================================================
  await t.test('ExecutionCheckpoint serialization and restoration', () => {
    const cp = new Orchestration.ExecutionCheckpoint({
      completedTaskIds: ['task_1', 'task_2'],
      evidence: [{ id: 'ev_1' }]
    });

    const json = JSON.stringify(cp.toJSON());
    const restored = Orchestration.ExecutionCheckpoint.fromJSON(json);
    assert.strictEqual(restored.completedTaskIds.length, 2);
    assert.strictEqual(restored.evidence.length, 1);
  });

  await t.test('ExecutionTrace recording and ReplayEngine replay', () => {
    const trace = new Orchestration.ExecutionTrace();
    trace.record('TASK_DISPATCHED', { taskId: 't_alpha' });
    trace.record('TASK_COMPLETED', { taskId: 't_alpha', outcome: 'SUCCESS' });

    const replayed = Orchestration.ReplayEngine.replay(trace);
    assert.strictEqual(replayed.taskOrder.length, 1);
    assert.strictEqual(replayed.taskOrder[0], 't_alpha');
  });

  // =========================================================================
  // 16. Verification Event Bus
  // =========================================================================
  await t.test('VerificationEventProcessor pub/sub routing', () => {
    const log = new Orchestration.VerificationEventLog();
    const proc = new Orchestration.VerificationEventProcessor({ eventLog: log });

    let captured = null;
    proc.subscribe(Orchestration.VerificationEventType.TASK_STARTED, (e) => {
      captured = e;
    });

    proc.process(new Orchestration.VerificationEvent({
      type: Orchestration.VerificationEventType.TASK_STARTED,
      payload: { taskId: 't_event' }
    }));

    assert.ok(captured);
    assert.strictEqual(captured.payload.taskId, 't_event');
    assert.strictEqual(log.getEvents().length, 1);
  });

  // =========================================================================
  // 17. 18 Mandatory Stage 26 Scenarios
  // =========================================================================

  await t.test('Scenario 1 — Parallel independent verification', async () => {
    const engine = new Orchestration.OrchestrationEngine();
    engine.addTask({ taskId: 't1', kind: 'STATIC_VERIFICATION', subject: 'mod1' });
    engine.addTask({ taskId: 't2', kind: 'STATIC_VERIFICATION', subject: 'mod2' });
    engine.addTask({ taskId: 't3', kind: 'STATIC_VERIFICATION', subject: 'mod3' });

    const summary = await engine.startExecution();
    assert.strictEqual(summary.completedCount, 3);
  });

  await t.test('Scenario 2 — Dependency ordering', async () => {
    const engine = new Orchestration.OrchestrationEngine();
    engine.addTask({ taskId: 'step1', kind: 'STATIC_VERIFICATION', subject: 'base' });
    engine.addTask({ taskId: 'step2', kind: 'TEST_EXECUTION', subject: 'base', dependencies: ['step1'] });

    const step1Result = await engine.stepExecution();
    assert.strictEqual(step1Result.length, 1);
    assert.strictEqual(step1Result[0].taskId, 'step1');

    const step2Result = await engine.stepExecution();
    assert.strictEqual(step2Result.length, 1);
    assert.strictEqual(step2Result[0].taskId, 'step2');
  });

  await t.test('Scenario 3 — Critical-path prioritization', async () => {
    const engine = new Orchestration.OrchestrationEngine({ schedulingPolicy: Orchestration.SchedulingPolicy.CRITICAL_PATH });
    const graph = engine.taskGraph;
    const tCP1 = engine.addTask({ taskId: 'CP1', priority: 1 });
    const tCP2 = engine.addTask({ taskId: 'CP2', dependencies: ['CP1'], priority: 1 });
    const tSide = engine.addTask({ taskId: 'SIDE', priority: 1 });

    const boosted = Orchestration.CriticalPathAnalyzer.prioritizeCriticalPathTasks(graph, [tCP1, tCP2, tSide]);
    assert.ok(boosted.find(t => t.taskId === 'CP1').priority > boosted.find(t => t.taskId === 'SIDE').priority);
  });

  await t.test('Scenario 4 — Resource exhaustion', async () => {
    const engine = new Orchestration.OrchestrationEngine({
      budget: new Orchestration.ResourceBudget({ maxCpu: 1 })
    });
    engine.addTask({ taskId: 'heavy1', resourceRequirements: { cpu: 1, memoryMb: 128 } });
    engine.addTask({ taskId: 'heavy2', resourceRequirements: { cpu: 1, memoryMb: 128 } });

    // Step 1: only heavy1 can run
    const step1 = await engine.stepExecution();
    assert.strictEqual(step1.length, 1);
    assert.strictEqual(step1[0].taskId, 'heavy1');
  });

  await t.test('Scenario 5 — Resource redistribution', async () => {
    const engine = new Orchestration.OrchestrationEngine({
      budget: new Orchestration.ResourceBudget({ maxCpu: 1 })
    });
    engine.addTask({ taskId: 'q1', subject: 'sub1', resourceRequirements: { cpu: 1, memoryMb: 128 } });
    engine.addTask({ taskId: 'q2', subject: 'sub2', resourceRequirements: { cpu: 1, memoryMb: 128 } });

    await engine.stepExecution(); // q1 completes and releases CPU
    const step2 = await engine.stepExecution(); // q2 now has CPU available
    assert.strictEqual(step2.length, 1);
    assert.strictEqual(step2[0].taskId, 'q2');
  });

  await t.test('Scenario 6 — Duplicate elimination', async () => {
    const engine = new Orchestration.OrchestrationEngine({
      concurrencyPolicy: new Orchestration.ConcurrencyPolicy({ maxConcurrentTasks: 1 })
    });
    const t1 = engine.addTask({ taskId: 'd1', kind: 'STATIC_VERIFICATION', subject: 'math.sin', inputs: { x: 0 } });
    const t2 = engine.addTask({ taskId: 'd2', kind: 'STATIC_VERIFICATION', subject: 'math.sin', inputs: { x: 0 } });

    await engine.stepExecution(); // d1 executes and registers in duplicate detector
    await engine.stepExecution(); // d2 is reused
    const trace = engine.getExecutionTrace().getEventsByType('TASK_DUPLICATE_REUSED');
    assert.ok(trace.length >= 1);
  });

  await t.test('Scenario 7 — Evidence reuse', () => {
    const detector = new Orchestration.DuplicateTaskDetector();
    const task = new Orchestration.VerificationTask({ kind: 'STATIC_VERIFICATION', subject: 'math.cos' });
    detector.registerCompletedTask(task, { success: true, outcome: 'FORMAL_PROOF_OBTAINED' });
    assert.strictEqual(detector.isDuplicate(task), true);
  });

  await t.test('Scenario 8 — Speculative cancellation', async () => {
    const engine = new Orchestration.OrchestrationEngine();
    engine.addTask({
      taskId: 'formal_proof',
      goalId: 'G1',
      kind: Orchestration.VerificationTaskKind.STATIC_VERIFICATION,
      subject: 'target_func'
    });
    engine.addTask({
      taskId: 'spec_mutation',
      goalId: 'G1',
      kind: Orchestration.VerificationTaskKind.MUTANT_KILLING,
      subject: 'target_func',
      isSpeculative: true
    });

    await engine.startExecution();
    assert.strictEqual(engine.scheduler.cancelled.size >= 1, true);
  });

  await t.test('Scenario 9 — Mutation parallelism', async () => {
    const engine = new Orchestration.OrchestrationEngine();
    for (let i = 0; i < 3; i++) {
      engine.addTask({ taskId: `mut_${i}`, kind: Orchestration.VerificationTaskKind.MUTANT_KILLING, subject: `m${i}` });
    }
    const stepped = await engine.stepExecution();
    assert.strictEqual(stepped.length, 3);
  });

  await t.test('Scenario 10 — Solver throttling', async () => {
    const engine = new Orchestration.OrchestrationEngine({
      concurrencyPolicy: new Orchestration.ConcurrencyPolicy({ maxConcurrentSolvers: 1, maxConcurrentTasks: 4 })
    });
    engine.addTask({ taskId: 'sym_a', kind: Orchestration.VerificationTaskKind.SYMBOLIC_ANALYSIS, subject: 'A' });
    engine.addTask({ taskId: 'sym_b', kind: Orchestration.VerificationTaskKind.SYMBOLIC_ANALYSIS, subject: 'B' });

    const step1 = await engine.stepExecution();
    assert.strictEqual(step1.length, 1); // Only 1 symbolic solver admitted
  });

  await t.test('Scenario 11 — Partial worker failure isolation', async () => {
    const failingWorker = new Orchestration.VerificationWorker({
      workerId: 'w_fail',
      supportedKinds: ['STATIC_VERIFICATION']
    });
    failingWorker.performExecution = async () => { throw new Error('Worker crash'); };

    const healthyWorker = new Orchestration.TestingWorker();

    const engine = new Orchestration.OrchestrationEngine({ workers: [failingWorker, healthyWorker] });
    engine.addTask({ taskId: 't_fail', kind: 'STATIC_VERIFICATION' });
    engine.addTask({ taskId: 't_ok', kind: 'TEST_EXECUTION' });

    await engine.startExecution();
    assert.strictEqual(engine.scheduler.failed.size, 1);
    assert.strictEqual(engine.scheduler.completed.size, 1);
  });

  await t.test('Scenario 12 — Retry recovery on transient error', async () => {
    let callCount = 0;
    const transientWorker = new Orchestration.VerificationWorker({ supportedKinds: ['TEST_EXECUTION'] });
    transientWorker.performExecution = async () => {
      callCount++;
      if (callCount === 1) {
        const err = new Error('Transient socket timeout');
        err.isTransient = true;
        throw err;
      }
      return { outcome: 'PASSED' };
    };

    const engine = new Orchestration.OrchestrationEngine({ workers: [transientWorker] });
    engine.addTask({ taskId: 't_retry_task', kind: 'TEST_EXECUTION' });

    await engine.startExecution();
    assert.strictEqual(engine.scheduler.completed.size, 1);
    assert.strictEqual(callCount, 2);
  });

  await t.test('Scenario 13 — Permanent failure recording', async () => {
    const failingWorker = new Orchestration.VerificationWorker({ supportedKinds: ['TEST_EXECUTION'] });
    failingWorker.performExecution = async () => {
      const err = new Error('Permanent bad syntax');
      err.isTransient = false;
      throw err;
    };

    const engine = new Orchestration.OrchestrationEngine({ workers: [failingWorker] });
    engine.addTask({ taskId: 't_perm_fail', kind: 'TEST_EXECUTION' });

    await engine.startExecution();
    assert.strictEqual(engine.scheduler.failed.size, 1);
  });

  await t.test('Scenario 14 — Evidence conflict preservation', () => {
    const merger = new Orchestration.EvidenceMerger();
    const base = [{ subject: 'auth.state', polarity: 'TRUE', kind: 'STATIC_PROOF' }];
    const res = [{ evidenceGenerated: [{ subject: 'auth.state', polarity: 'FALSE', kind: 'DYNAMIC_TEST' }] }];

    const merged = merger.merge(base, res);
    assert.strictEqual(merged.conflicts.length, 1);
    assert.strictEqual(merged.mergedEvidence.length, 2);
  });

  await t.test('Scenario 15 — Incremental execution on code change', () => {
    const tasks = [
      new Orchestration.VerificationTask({ taskId: 't_auth', subject: 'src/auth.js' }),
      new Orchestration.VerificationTask({ taskId: 't_db', subject: 'src/db.js' })
    ];
    const plan = Orchestration.IncrementalTaskPlanner.planIncrementalTasks(tasks, ['src/auth.js']);
    assert.strictEqual(plan.tasksToRun.length, 1);
    assert.strictEqual(plan.tasksToRun[0].taskId, 't_auth');
  });

  await t.test('Scenario 16 — Checkpoint / resume state preservation', async () => {
    const engine = new Orchestration.OrchestrationEngine();
    engine.addTask({ taskId: 'chk_1', kind: 'STATIC_VERIFICATION' });
    await engine.stepExecution();

    const cp = engine.checkpoint();
    assert.ok(cp.checkpointId);

    const engine2 = new Orchestration.OrchestrationEngine();
    engine2.addTask({ taskId: 'chk_1', kind: 'STATIC_VERIFICATION' });
    const restored = engine2.restore(cp);
    assert.strictEqual(restored, true);
    assert.strictEqual(engine2.scheduler.completed.has('chk_1'), true);
  });

  await t.test('Scenario 17 — Deterministic replay reproduction', async () => {
    const engine = new Orchestration.OrchestrationEngine();
    engine.addTask({ taskId: 'rep_1', kind: 'STATIC_VERIFICATION' });
    engine.addTask({ taskId: 'rep_2', kind: 'STATIC_VERIFICATION' });
    await engine.startExecution();

    const replayed = engine.replay();
    assert.deepStrictEqual(replayed.taskOrder, ['rep_1', 'rep_2']);
  });

  await t.test('Scenario 18 — Full autonomous pipeline', async () => {
    const plannerContext = [
      new Planning.ExperimentCandidate({
        experiment: new Planning.Experiment({ id: 'exp_pipeline', kind: 'STATIC_VERIFY', target: 'core.service' }),
        expectedValue: new Planning.ExperimentValue({ informationGain: 0.9 })
      })
    ];

    const engine = new Orchestration.OrchestrationEngine();
    const tasks = engine.decomposePlan(plannerContext);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].subject, 'core.service');

    const result = await engine.startExecution();
    assert.strictEqual(result.completedCount, 1);
    assert.ok(result.evidence.length >= 1);
  });

  // =========================================================================
  // 18. Debugger Stage 26 Integration
  // =========================================================================
  await t.test('Debugger Stage 26 APIs', async () => {
    const dbg = new Debugger();
    const exec = dbg.createVerificationExecution();
    assert.ok(exec);

    dbg.getVerificationTasks();
    dbg.getResourceBudget();
    dbg.getResourceUsage();
    const workers = dbg.getWorkerStatus();
    assert.ok(workers.length > 0);

    const progress = dbg.getOrchestrationProgress();
    assert.strictEqual(progress.isPaused, false);

    const health = dbg.getOrchestrationHealth();
    assert.strictEqual(health.isHealthy, true);
  });

  // =========================================================================
  // 18. Additional Unit Tests & Safety Invariants (Targeting 100+ Tests)
  // =========================================================================
  await t.test('TaskDependency all relation types', () => {
    const relations = Object.values(Orchestration.DependencyRelation);
    assert.strictEqual(relations.length, 6);
    assert.ok(relations.includes('REQUIRED'));
    assert.ok(relations.includes('OPTIONAL'));
    assert.ok(relations.includes('EVIDENCE'));
    assert.ok(relations.includes('RESOURCE'));
    assert.ok(relations.includes('ENVIRONMENT'));
    assert.ok(relations.includes('EXCLUSION'));
  });

  await t.test('ResourceAllocator overcommitment rejection', () => {
    const alloc = new Orchestration.ResourceAllocator({
      budget: new Orchestration.ResourceBudget({ maxCpu: 2, maxMemoryMb: 512 })
    });
    const tHuge = new Orchestration.VerificationTask({
      taskId: 'huge',
      resourceRequirements: { cpu: 4, memoryMb: 1024 }
    });
    assert.strictEqual(alloc.canAllocate(tHuge), false);
    assert.strictEqual(alloc.allocate(tHuge), null);
  });

  await t.test('VerificationWorker health recovery', () => {
    const worker = new Orchestration.VerificationWorker();
    worker.isHealthy = false;
    assert.strictEqual(worker.canExecute(new Orchestration.VerificationTask()), false);
    worker.recover();
    assert.strictEqual(worker.isHealthy, true);
  });

  await t.test('StaticVerificationWorker contract and invariant verification', async () => {
    const worker = new Orchestration.StaticVerificationWorker();
    const tContract = new Orchestration.VerificationTask({
      kind: Orchestration.VerificationTaskKind.CONTRACT_VERIFICATION,
      subject: 'api.spec'
    });
    const tInvariant = new Orchestration.VerificationTask({
      kind: Orchestration.VerificationTaskKind.INVARIANT_VERIFICATION,
      subject: 'loop.inv'
    });
    const resC = await worker.execute(tContract);
    const resI = await worker.execute(tInvariant);
    assert.strictEqual(resC.success, true);
    assert.strictEqual(resI.success, true);
  });

  await t.test('TestingWorker test generation kind', async () => {
    const worker = new Orchestration.TestingWorker();
    const tGen = new Orchestration.VerificationTask({
      kind: Orchestration.VerificationTaskKind.TEST_GENERATION,
      subject: 'crypto.gen'
    });
    const res = await worker.execute(tGen);
    assert.strictEqual(res.success, true);
  });

  await t.test('ConcolicWorker anomaly reproduction kind', async () => {
    const worker = new Orchestration.ConcolicWorker();
    const tAnom = new Orchestration.VerificationTask({
      kind: Orchestration.VerificationTaskKind.ANOMALY_REPRODUCTION,
      subject: 'segfault.case'
    });
    const res = await worker.execute(tAnom);
    assert.strictEqual(res.success, true);
  });

  await t.test('MutationWorker mutation analysis kind', async () => {
    const worker = new Orchestration.MutationWorker();
    const tMut = new Orchestration.VerificationTask({
      kind: Orchestration.VerificationTaskKind.MUTATION_ANALYSIS,
      subject: 'math.pow'
    });
    const res = await worker.execute(tMut);
    assert.strictEqual(res.success, true);
  });

  await t.test('ProbabilisticWorker evidence reconciliation kind', async () => {
    const worker = new Orchestration.ProbabilisticWorker();
    const tReconcile = new Orchestration.VerificationTask({
      kind: Orchestration.VerificationTaskKind.EVIDENCE_RECONCILIATION,
      subject: 'prob.state'
    });
    const res = await worker.execute(tReconcile);
    assert.strictEqual(res.success, true);
  });

  await t.test('WorkspaceIsolation isIsolated validation', () => {
    const ws1 = new Orchestration.TaskWorkspace({ taskId: 't1' });
    const ws2 = new Orchestration.TaskWorkspace({ taskId: 't2' });
    assert.strictEqual(Orchestration.WorkspaceIsolation.isIsolated(ws1, ws2), true);
  });

  await t.test('TaskWorkspace withModification immutability', () => {
    const ws = new Orchestration.TaskWorkspace({ taskId: 't_mod' });
    const wsModified = ws.withModification('flag', true);
    assert.strictEqual(wsModified.localModifications.flag, true);
    assert.strictEqual(ws.localModifications.flag, undefined);
  });

  await t.test('VerificationScheduler FIFO policy dispatch', () => {
    const sched = new Orchestration.VerificationScheduler({ policy: Orchestration.SchedulingPolicy.FIFO });
    const t1 = new Orchestration.VerificationTask({ taskId: 't1', priority: 1 });
    const t2 = new Orchestration.VerificationTask({ taskId: 't2', priority: 10 });
    sched.enqueue(t1);
    sched.enqueue(t2);
    const dispatched = sched.dispatch();
    assert.strictEqual(dispatched[0].taskId, 't1');
  });

  await t.test('VerificationScheduler COST_AWARE policy dispatch', () => {
    const sched = new Orchestration.VerificationScheduler({ policy: Orchestration.SchedulingPolicy.COST_AWARE });
    const tExpensive = new Orchestration.VerificationTask({ taskId: 't_exp', budget: { maxTimeMs: 1000 } });
    const tCheap = new Orchestration.VerificationTask({ taskId: 't_cheap', budget: { maxTimeMs: 10 } });
    sched.enqueue(tExpensive);
    sched.enqueue(tCheap);
    const dispatched = sched.dispatch();
    assert.strictEqual(dispatched[0].taskId, 't_cheap');
  });

  await t.test('VerificationScheduler RISK_FIRST policy dispatch', () => {
    const sched = new Orchestration.VerificationScheduler({ policy: Orchestration.SchedulingPolicy.RISK_FIRST });
    const tLowRisk = new Orchestration.VerificationTask({ taskId: 't_low_r', metadata: { riskScore: 0.1 } });
    const tHighRisk = new Orchestration.VerificationTask({ taskId: 't_high_r', metadata: { riskScore: 0.9 } });
    sched.enqueue(tLowRisk);
    sched.enqueue(tHighRisk);
    const dispatched = sched.dispatch();
    assert.strictEqual(dispatched[0].taskId, 't_high_r');
  });

  await t.test('DuplicateTaskDetector NEVER_REUSE policy', () => {
    const detector = new Orchestration.DuplicateTaskDetector({ policy: Orchestration.TaskReusePolicy.NEVER_REUSE });
    const task = new Orchestration.VerificationTask({ kind: 'STATIC', subject: 'no_reuse' });
    detector.registerCompletedTask(task, { success: true });
    assert.strictEqual(detector.isDuplicate(task), false);
  });

  await t.test('RetryPolicy NO_RETRY strategy', () => {
    const policy = new Orchestration.RetryPolicy({ strategy: Orchestration.RetryStrategy.NO_RETRY });
    const task = new Orchestration.VerificationTask();
    assert.strictEqual(policy.canRetry(task, { retryable: true }), false);
  });

  await t.test('RetryPolicy IMMEDIATE_RETRY delay', () => {
    const policy = new Orchestration.RetryPolicy({ strategy: Orchestration.RetryStrategy.IMMEDIATE_RETRY });
    const task = new Orchestration.VerificationTask();
    assert.strictEqual(policy.computeDelayMs(task), 0);
  });

  await t.test('TaskRecoveryManager multi-step retry exhaustion', () => {
    const manager = new Orchestration.TaskRecoveryManager({
      retryPolicy: new Orchestration.RetryPolicy({ maxRetries: 2 })
    });
    const taskExhausted = new Orchestration.VerificationTask({ taskId: 't_ex', retryCount: 2 });
    const decision = manager.handleFailure(taskExhausted, { retryable: true });
    assert.strictEqual(decision.shouldRetry, false);
    assert.strictEqual(decision.task.status, Orchestration.VerificationTaskStatus.FAILED);
  });

  await t.test('ConflictResolver empirical discordance resolution', () => {
    const conflict = new Orchestration.ExecutionConflict({
      subject: 'metric.val',
      evidenceA: { strength: 'EMPIRICAL', polarity: 'TRUE' },
      evidenceB: { strength: 'EMPIRICAL', polarity: 'FALSE' }
    });
    const resolved = Orchestration.ConflictResolver.resolve(conflict);
    assert.strictEqual(resolved.conflictType, 'EMPIRICAL_DISCORDANCE');
    assert.strictEqual(resolved.resolution, 'RECORD_CONFLICT_FOR_REOBSERVATION');
  });

  await t.test('VerificationEventProcessor wildcard subscription', () => {
    const proc = new Orchestration.VerificationEventProcessor();
    let count = 0;
    proc.subscribe('*', () => { count++; });
    proc.process(new Orchestration.VerificationEvent({ type: 'EVENT_A' }));
    proc.process(new Orchestration.VerificationEvent({ type: 'EVENT_B' }));
    assert.strictEqual(count, 2);
  });

  await t.test('Safety Invariant — Formal proof cannot be downgraded during parallel merge', () => {
    const merger = new Orchestration.EvidenceMerger();
    const base = [{ subject: 'safety.theorem', strength: 'FORMAL', kind: 'STATIC_PROOF', polarity: 'TRUE' }];
    const res = [{ evidenceGenerated: [{ subject: 'safety.theorem', strength: 'EMPIRICAL', polarity: 'FALSE' }] }];
    const merged = merger.merge(base, res);
    assert.strictEqual(merged.conflicts.length, 1);
    assert.strictEqual(merged.conflicts[0].conflictType, 'FORMAL_VS_EMPIRICAL');
    assert.strictEqual(merged.conflicts[0].resolution, 'RETAIN_FORMAL_AND_FLAG_ANOMALY');
  });

  await t.test('Safety Invariant — Failed experiments do not produce proof', async () => {
    const engine = new Orchestration.OrchestrationEngine();
    const task = engine.addTask({ taskId: 't_fail_proof', kind: 'STATIC_VERIFICATION', inputs: { hasFlaw: true } });
    const res = await engine.stepExecution();
    assert.strictEqual(res[0].outcome, 'STATIC_FINDING_CONFIRMED');
    assert.strictEqual(res[0].evidenceGenerated[0].polarity, 'FALSE');
  });

  // =========================================================================
  // 19. Performance Benchmarks
  // =========================================================================
  await t.test('Performance Benchmarks — Task Creations (< 100 ms for 10k)', () => {
    const t0 = Date.now();
    for (let i = 0; i < 10000; i++) {
      new Orchestration.VerificationTask({ taskId: `bench_${i}`, subject: 'test' });
    }
    const d = Date.now() - t0;
    assert.ok(d < 100, `10k task creations took ${d} ms`);
  });

  await t.test('Performance Benchmarks — Dependency Queries (< 100 ms for 10k)', () => {
    const graph = new Orchestration.TaskDependencyGraph();
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'NodeA' }));
    graph.addTask(new Orchestration.VerificationTask({ taskId: 'NodeB', dependencies: ['NodeA'] }));

    const t0 = Date.now();
    for (let i = 0; i < 10000; i++) {
      graph.getPrerequisites('NodeB');
    }
    const d = Date.now() - t0;
    assert.ok(d < 100, `10k dependency queries took ${d} ms`);
  });

  await t.test('Performance Benchmarks — Scheduler Decisions (< 150 ms for 10k)', () => {
    const sched = new Orchestration.VerificationScheduler();
    for (let i = 0; i < 100; i++) {
      sched.enqueue(new Orchestration.VerificationTask({ taskId: `s_${i}`, priority: i % 10 }));
    }

    const t0 = Date.now();
    for (let i = 0; i < 10000; i++) {
      sched.prioritize();
    }
    const d = Date.now() - t0;
    assert.ok(d < 150, `10k scheduler prioritizations took ${d} ms`);
  });

  await t.test('Performance Benchmarks — Resource Allocations (< 100 ms for 10k)', () => {
    const alloc = new Orchestration.ResourceAllocator();
    const task = new Orchestration.VerificationTask({ taskId: 't_alloc', resourceRequirements: { cpu: 1, memoryMb: 128 } });

    const t0 = Date.now();
    for (let i = 0; i < 10000; i++) {
      alloc.canAllocate(task);
    }
    const d = Date.now() - t0;
    assert.ok(d < 100, `10k resource allocation checks took ${d} ms`);
  });

  await t.test('Performance Benchmarks — Duplicate Checks (< 100 ms for 10k)', () => {
    const detector = new Orchestration.DuplicateTaskDetector();
    const task = new Orchestration.VerificationTask({ kind: 'STATIC', subject: 'fast' });
    detector.registerCompletedTask(task, { success: true });

    const t0 = Date.now();
    for (let i = 0; i < 10000; i++) {
      detector.isDuplicate(task);
    }
    const d = Date.now() - t0;
    assert.ok(d < 100, `10k duplicate checks took ${d} ms`);
  });

  await t.test('Performance Benchmarks — Evidence Merges (< 250 ms for 10k)', () => {
    const base = [{ subject: 's', polarity: 'TRUE' }];
    const res = [{ evidenceGenerated: [{ subject: 's2', polarity: 'TRUE' }] }];

    const t0 = Date.now();
    for (let i = 0; i < 10000; i++) {
      Orchestration.WorkspaceMerge.mergeEvidence(base, res);
    }
    const d = Date.now() - t0;
    assert.ok(d < 250, `10k evidence merges took ${d} ms`);
  });

  await t.test('Performance Benchmarks — Checkpoint Serializations (< 250 ms for 1k)', () => {
    const cp = new Orchestration.ExecutionCheckpoint({
      completedTaskIds: ['t1', 't2'],
      evidence: [{ id: 'e1' }]
    });

    const t0 = Date.now();
    for (let i = 0; i < 1000; i++) {
      JSON.stringify(cp.toJSON());
    }
    const d = Date.now() - t0;
    assert.ok(d < 250, `1k checkpoint serializations took ${d} ms`);
  });

  await t.test('Performance Benchmarks — Replay Operations (< 500 ms for 1k)', () => {
    const trace = new Orchestration.ExecutionTrace();
    trace.record('TASK_DISPATCHED', { taskId: 't1' });
    trace.record('TASK_COMPLETED', { taskId: 't1' });

    const t0 = Date.now();
    for (let i = 0; i < 1000; i++) {
      Orchestration.ReplayEngine.replay(trace);
    }
    const d = Date.now() - t0;
    assert.ok(d < 500, `1k replay operations took ${d} ms`);
  });

  await t.test('Performance Benchmarks — Replanning Cycles (< 750 ms for 1k)', () => {
    const tasks = [new Orchestration.VerificationTask({ taskId: 'inc_1', subject: 'core' })];

    const t0 = Date.now();
    for (let i = 0; i < 1000; i++) {
      Orchestration.IncrementalTaskPlanner.planIncrementalTasks(tasks, ['core']);
    }
    const d = Date.now() - t0;
    assert.ok(d < 750, `1k incremental planning cycles took ${d} ms`);
  });

});
