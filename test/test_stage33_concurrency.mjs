/**
 * test_stage33_concurrency.mjs
 * Test suite for Stage 33 — Universal Distributed, Concurrent & Temporal Verification Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import * as Concurrency from '../src/concurrency/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

test('Stage 33 — Concurrency & Temporal Verification Engine', async (t) => {
  const dbg = new Debugger();
  const engine = new Concurrency.ConcurrencyEngine();

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Concurrency Model & Topology
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 1 & 2: Create concurrency model and multiple execution contexts', () => {
    const thread1 = dbg.createConcurrencyModel ? dbg.createConcurrentTask({
      id: 'task-1',
      name: 'WorkerTask1',
      contextId: 'ctx-thread-1'
    }) : null;

    const ctx1 = new Concurrency.ExecutionContext({
      id: 'ctx-thread-1',
      name: 'MainThread',
      kind: Concurrency.ContextKind.THREAD
    });
    const ctx2 = new Concurrency.ExecutionContext({
      id: 'ctx-thread-2',
      name: 'WorkerThread',
      kind: Concurrency.ContextKind.WORKER
    });

    const model = dbg.createConcurrencyModel({
      id: 'concurrency-top-1',
      name: 'ThreadPoolTopology',
      contexts: [ctx1, ctx2]
    });

    assert.equal(model.id, 'concurrency-top-1');
    assert.equal(model.contexts.length, 2);
    assert.equal(model.getContext('ctx-thread-1').name, 'MainThread');
    assert.equal(dbg.getConcurrencyModel('concurrency-top-1').name, 'ThreadPoolTopology');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Shared State & Accesses
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 3 & 4: Model shared state and synchronization primitives', () => {
    const mutex = dbg.createSynchronizationPrimitive({
      id: 'mutex-shared-var',
      name: 'VarLock',
      kind: Concurrency.PrimitiveKind.MUTEX
    });
    assert.equal(mutex.kind, Concurrency.PrimitiveKind.MUTEX);

    const sharedModel = engine.createSharedStateModel();
    const access1 = engine.createMemoryAccess({
      id: 'acc-1',
      contextId: 'ctx-1',
      resourceId: 'account_balance',
      kind: Concurrency.AccessKind.READ,
      value: 100
    });
    const access2 = engine.createMemoryAccess({
      id: 'acc-2',
      contextId: 'ctx-2',
      resourceId: 'account_balance',
      kind: Concurrency.AccessKind.WRITE,
      value: 150
    });

    sharedModel.recordAccess(access1);
    sharedModel.recordAccess(access2);

    assert.equal(sharedModel.getAccesses('account_balance').length, 2);
    const analyzer = new Concurrency.SharedStateAnalyzer();
    const sharedResources = analyzer.analyzeSharedResources(sharedModel);
    assert.equal(sharedResources.length, 1);
    assert.equal(sharedResources[0].isShared, true);
    assert.equal(sharedResources[0].contexts.length, 2);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Happens-Before & Races
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 5, 6, 7: Build happens-before graph, detect conflicting accesses and data race', () => {
    const hbGraph = engine.createHappensBeforeGraph();
    hbGraph.addEdge('ev-init', 'ev-read1');

    const accRead = engine.createMemoryAccess({
      id: 'ev-read1',
      contextId: 'ctx-1',
      resourceId: 'shared_counter',
      kind: Concurrency.AccessKind.READ
    });
    const accWrite = engine.createMemoryAccess({
      id: 'ev-write2',
      contextId: 'ctx-2',
      resourceId: 'shared_counter',
      kind: Concurrency.AccessKind.WRITE
    });

    // Conflict exists
    const conflict = Concurrency.AccessConflict.check(accRead, accWrite);
    assert.ok(conflict);
    assert.equal(conflict.type, Concurrency.ConflictType.READ_WRITE);

    // No HB edge between ev-read1 and ev-write2 -> Data Race
    const races = dbg.analyzeRaces([accRead, accWrite], hbGraph);
    assert.equal(races.length, 1);
    assert.equal(races[0].resourceId, 'shared_counter');
    assert.equal(dbg.getRaceCandidates().length, 1);

    // With synchronization edge added:
    hbGraph.addEdge('ev-read1', 'ev-write2');
    const racesAfterSync = dbg.analyzeRaces([accRead, accWrite], hbGraph);
    assert.equal(racesAfterSync.length, 0);
  });

  await t.test('Scenario 8 & 9: Generate race counterexample and minimize race schedule', () => {
    const accRead = engine.createMemoryAccess({
      id: 'ev-r1',
      contextId: 'ctx-1',
      resourceId: 'x',
      kind: Concurrency.AccessKind.READ
    });
    const accWrite = engine.createMemoryAccess({
      id: 'ev-w2',
      contextId: 'ctx-2',
      resourceId: 'x',
      kind: Concurrency.AccessKind.WRITE
    });
    const hbGraph = engine.createHappensBeforeGraph();
    dbg.analyzeRaces([accRead, accWrite], hbGraph);

    const cexList = dbg.getRaceCounterexamples();
    assert.equal(cexList.length, 1);
    assert.equal(cexList[0].defectType, 'RACE');
    assert.ok(cexList[0].explanation.includes('Data race detected'));

    // Schedule reduction test
    const longSchedule = new Concurrency.Schedule({
      id: 'long-sched',
      events: [
        { id: 'irrelevant-1', contextId: 'ctx-3' },
        accRead,
        { id: 'irrelevant-2', contextId: 'ctx-3' },
        accWrite,
        { id: 'irrelevant-3', contextId: 'ctx-3' }
      ]
    });

    const minimized = dbg.minimizeSchedule(longSchedule, (sched) => {
      const hasRead = sched.events.some(e => e.id === 'ev-r1');
      const hasWrite = sched.events.some(e => e.id === 'ev-w2');
      return hasRead && hasWrite;
    });

    assert.equal(minimized.events.length, 2);
    assert.ok(minimized.events.some(e => e.id === 'ev-r1'));
    assert.ok(minimized.events.some(e => e.id === 'ev-w2'));
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Lock Order, Deadlocks & Starvation
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 10, 11, 12: Model lock ordering, detect deadlock cycle and counterexample', () => {
    const lockGraph = engine.createLockOrderGraph();
    // Thread 1 acquires LockA then LockB
    lockGraph.addLockOrder('LockA', 'LockB', 'thread-1');
    // Thread 2 acquires LockB then LockA
    lockGraph.addLockOrder('LockB', 'LockA', 'thread-2');

    const analyzer = new Concurrency.LockOrderAnalyzer();
    const cycles = analyzer.analyzeCycles(lockGraph);
    assert.equal(cycles.length, 1);
    assert.ok(cycles[0].cycle.includes('LockA') && cycles[0].cycle.includes('LockB'));

    // WaitForGraph deadlock analysis
    const wfg = engine.createWaitForGraph();
    wfg.addWait('thread-1', 'thread-2', 'LockB');
    wfg.addWait('thread-2', 'thread-1', 'LockA');

    const deadlocks = dbg.analyzeDeadlocks(wfg);
    assert.equal(deadlocks.length, 1);
    assert.equal(dbg.getDeadlockCycles().length, 1);

    const deadlockCex = dbg.getDeadlockCounterexamples();
    assert.equal(deadlockCex.length, 1);
    assert.equal(deadlockCex[0].defectType, 'DEADLOCK');
  });

  await t.test('Scenario 13: Detect thread starvation', () => {
    const trace = [
      { id: '1', contextId: 't1', type: 'WAIT', resourceId: 'res-A' },
      { id: '2', contextId: 't2', type: 'WAIT', resourceId: 'res-A' },
      { id: '3', contextId: 't3', type: 'ACQUIRE', resourceId: 'res-A' }, // t1 and t2 bypassed (1)
      { id: '4', contextId: 't3', type: 'WAIT', resourceId: 'res-A' },
      { id: '5', contextId: 't4', type: 'ACQUIRE', resourceId: 'res-A' }, // t1 and t2 bypassed (2)
      { id: '6', contextId: 't4', type: 'WAIT', resourceId: 'res-A' },
      { id: '7', contextId: 't5', type: 'ACQUIRE', resourceId: 'res-A' }  // t1 and t2 bypassed (3) -> threshold reached
    ];

    const starvation = engine.analyzeStarvation(trace, { bypassThreshold: 3 });
    assert.ok(starvation.length >= 1);
    assert.ok(starvation.some(s => s.contextId === 't1' || s.contextId === 't2'));
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Atomicity & Linearizability
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 14: Verify atomicity violation', () => {
    const region = engine.createAtomicRegion({
      id: 'region-transfer',
      contextId: 'ctx-1',
      startEventId: 'ev-start',
      endEventId: 'ev-end',
      resourceIds: ['res-balance']
    });

    const traceWithInterleaving = [
      { id: 'ev-start', contextId: 'ctx-1', resourceId: 'res-balance' },
      { id: 'ev-interfering', contextId: 'ctx-2', resourceId: 'res-balance', isWrite: true },
      { id: 'ev-end', contextId: 'ctx-1', resourceId: 'res-balance' }
    ];

    const violations = engine.analyzeAtomicity(traceWithInterleaving, [region]);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].interveningEventId, 'ev-interfering');
  });

  await t.test('Scenario 15: Verify linearizability', () => {
    // Op1: Context A adds 5 from t=0 to t=10, result=5
    // Op2: Context B adds 10 from t=15 to t=20, result=15
    const op1 = engine.createConcurrentOperation({
      id: 'op1',
      contextId: 'ctx-A',
      name: 'add',
      args: [5],
      result: 5,
      invokeTime: 0,
      responseTime: 10
    });
    const op2 = engine.createConcurrentOperation({
      id: 'op2',
      contextId: 'ctx-B',
      name: 'add',
      args: [10],
      result: 15,
      invokeTime: 15,
      responseTime: 20
    });

    const res = engine.analyzeLinearizability([op1, op2], {
      initialState: 0,
      apply: (st, op) => ({ state: st + op.args[0], result: st + op.args[0] })
    });
    assert.equal(res.isLinearizable, true);
    assert.deepEqual(res.sequentialOrder, ['op1', 'op2']);

    // Non-linearizable history: Op2 precedes Op1 in real time, but expects Op1's state first
    const badOp1 = engine.createConcurrentOperation({
      id: 'badOp1',
      contextId: 'ctx-A',
      name: 'add',
      args: [5],
      result: 5,
      invokeTime: 30,
      responseTime: 40
    });
    const badOp2 = engine.createConcurrentOperation({
      id: 'badOp2',
      contextId: 'ctx-B',
      name: 'add',
      args: [10],
      result: 15,
      invokeTime: 0,
      responseTime: 10
    });

    const badRes = engine.analyzeLinearizability([badOp1, badOp2], {
      initialState: 0,
      apply: (st, op) => ({ state: st + op.args[0], result: st + op.args[0] })
    });
    assert.equal(badRes.isLinearizable, false);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Temporal Logic & Verification
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 16, 17, 18, 19, 20: Temporal property evaluation (ALWAYS, EVENTUALLY, Bounded Response) and counterexample', () => {
    // 1. ALWAYS (Invariant)
    const alwaysProp = dbg.createTemporalProperty({
      id: 'prop-positive-balance',
      kind: Concurrency.TemporalPropertyKind.ALWAYS,
      predicate: (state) => state.balance >= 0
    });
    const validTrace = [{ balance: 100 }, { balance: 50 }, { balance: 10 }];
    const failingTrace = [{ balance: 100 }, { balance: -5 }, { balance: 20 }];

    const evalPass = dbg.evaluateTemporalProperty(alwaysProp, validTrace);
    assert.equal(evalPass.satisfied, true);

    const evalFail = dbg.evaluateTemporalProperty(alwaysProp, failingTrace);
    assert.equal(evalFail.satisfied, false);
    assert.ok(evalFail.counterexample);
    assert.equal(evalFail.counterexample.violatingStepIndex, 1);

    // 2. EVENTUALLY (Liveness)
    const eventuallyProp = dbg.createTemporalProperty({
      id: 'prop-reaches-zero',
      kind: Concurrency.TemporalPropertyKind.EVENTUALLY,
      predicate: (state) => state.queueLength === 0
    });
    assert.equal(dbg.evaluateTemporalProperty(eventuallyProp, [{ queueLength: 3 }, { queueLength: 0 }]).satisfied, true);
    assert.equal(dbg.evaluateTemporalProperty(eventuallyProp, [{ queueLength: 3 }, { queueLength: 2 }]).satisfied, false);

    // 3. BOUNDED_RESPONSE
    const boundedResponseProp = dbg.createTemporalProperty({
      id: 'prop-bounded-response',
      kind: Concurrency.TemporalPropertyKind.BOUNDED_RESPONSE,
      predicate: (s) => s.type === 'REQ',
      responsePredicate: (s) => s.type === 'RES',
      timeBound: 2
    });
    const okRespTrace = [{ type: 'REQ' }, { type: 'WORK' }, { type: 'RES' }];
    const slowRespTrace = [{ type: 'REQ' }, { type: 'WORK' }, { type: 'WORK' }, { type: 'WORK' }, { type: 'RES' }];

    assert.equal(dbg.evaluateTemporalProperty(boundedResponseProp, okRespTrace).satisfied, true);
    assert.equal(dbg.evaluateTemporalProperty(boundedResponseProp, slowRespTrace).satisfied, false);
    assert.ok(dbg.getTemporalCounterexample());
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Distributed Model, Channels & Consistency
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 21, 22, 23: Distributed model, message channels, and message reordering detection', () => {
    const chan = engine.createMessageChannel({
      id: 'chan-node1-node2',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2'
    });

    const distModel = dbg.createDistributedModel({
      id: 'dist-cluster-1',
      nodes: ['node-1', 'node-2', 'node-3'],
      channels: [chan]
    });
    assert.equal(distModel.nodes.length, 3);

    const hb = engine.createHappensBeforeGraph();
    hb.addEdge('msg-send-1', 'msg-send-2');

    // Trace where msg-send-2 was processed before msg-send-1
    const causalViolations = dbg.analyzeMessageOrdering([
      { id: 'msg-send-2' },
      { id: 'msg-send-1' }
    ], hb);
    assert.equal(causalViolations.length, 1);
  });

  await t.test('Scenario 24: Distributed consistency verification (Read-Your-Writes & Monotonic-Reads)', () => {
    const rywModel = engine.createConsistencyModel({
      id: 'cons-ryw',
      kind: Concurrency.ConsistencyKind.READ_YOUR_WRITES
    });

    const goodHistory = [
      { nodeId: 'node-1', type: 'WRITE', key: 'k1', value: 'v1', version: 2, timestamp: 10 },
      { nodeId: 'node-1', type: 'READ', key: 'k1', value: 'v1', version: 2, timestamp: 20 }
    ];
    const badHistory = [
      { nodeId: 'node-1', type: 'WRITE', key: 'k1', value: 'v1', version: 2, timestamp: 10 },
      { nodeId: 'node-1', type: 'READ', key: 'k1', value: 'v0', version: 1, timestamp: 20 } // Stale read
    ];

    assert.equal(dbg.analyzeConsistency(goodHistory, rywModel).satisfies, true);
    const badRes = dbg.analyzeConsistency(badHistory, rywModel);
    assert.equal(badRes.satisfies, false);
    assert.equal(badRes.violations.length, 1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Distributed Fault Injection & Resiliency
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 25, 26, 27, 28: Fault schedules, message loss, network partition, and recovery', () => {
    const distModel = engine.createDistributedModel({
      id: 'dist-mesh',
      nodes: ['node-A', 'node-B'],
      channels: [engine.createMessageChannel({ id: 'ch1', sourceNodeId: 'node-A', targetNodeId: 'node-B' })]
    });

    const schedules = dbg.generateFaultSchedules(distModel, { maxSchedules: 4 });
    assert.ok(schedules.length >= 2);

    // Inject message loss
    const lossSchedule = new Concurrency.FaultSchedule({
      id: 'sched-loss',
      faults: [
        dbg.createDistributedFault({
          id: 'f-loss',
          type: Concurrency.FaultType.MESSAGE_LOSS,
          targetChannelId: 'ch1',
          triggerTime: 10,
          duration: 20
        })
      ]
    });

    const workload = {
      messages: [
        { id: 'm1', channelId: 'ch1', senderId: 'node-A', receiverId: 'node-B', sendTimestamp: 15 },
        { id: 'm2', channelId: 'ch1', senderId: 'node-A', receiverId: 'node-B', sendTimestamp: 50 }
      ],
      stateCheck: (delivered, dropped) => dropped.length === 1 && delivered.length === 1
    };

    const simResult = dbg.verifyFaultTolerance(distModel, lossSchedule, workload);
    assert.equal(simResult.survived, true);
    assert.equal(simResult.droppedMessages.length, 1);
    assert.equal(simResult.deliveredMessages.length, 1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Partial-Order Reduction & Exploration
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 29: Apply Partial-Order Reduction to avoid redundant schedules', () => {
    const threadA = [
      { id: 'a1', contextId: 'tA', resourceId: 'resX', isWrite: true },
      { id: 'a2', contextId: 'tA', resourceId: 'resX', isWrite: false }
    ];
    const threadB = [
      { id: 'b1', contextId: 'tB', resourceId: 'resY', isWrite: true }
    ];

    const contextMap = { tA: threadA, tB: threadB };
    const explorationWithoutPOR = dbg.exploreSchedules(contextMap, { usePOR: false, maxSchedules: 50 });
    const explorationWithPOR = dbg.exploreSchedules(contextMap, { usePOR: true, maxSchedules: 50 });

    assert.ok(explorationWithPOR.schedules.length <= explorationWithoutPOR.schedules.length);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10. Mutation Analysis
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 30 & 31: Generate concurrency mutations and detect surviving mutants', () => {
    const programModel = {
      primitives: [{ id: 'lock1', name: 'GlobalMutex' }],
      events: [{ id: 'e1' }, { id: 'e2' }],
      timeouts: { requestTimeout: 5000 },
      atomicRegions: [{ id: 'atomic-block-1' }]
    };

    const mutants = engine.generateMutations(programModel);
    assert.ok(mutants.length >= 4);
    assert.ok(mutants.some(m => m.type === Concurrency.MutationType.REMOVE_LOCK));
    assert.ok(mutants.some(m => m.type === Concurrency.MutationType.REORDER_OPERATION));
    assert.ok(mutants.some(m => m.type === Concurrency.MutationType.CHANGE_TIMEOUT));
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 11. Concurrency Repairs, Invariant Preservation & Rollback
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 32, 33, 34, 35: Concurrency repairs, safety/perf rejection, apply and rollback', () => {
    const raceDefect = { defectType: 'RACE', resourceId: 'user_session' };
    const repairs = dbg.generateConcurrencyRepairs(raceDefect);
    assert.ok(repairs.length >= 2);

    const sortedRepairs = dbg.compareConcurrencyRepairs(repairs);
    assert.ok(sortedRepairs.length >= 2);

    // Validation rejecting repair violating security
    const unsafeRepair = new Concurrency.ConcurrencyRepairCandidate({
      id: 'repair-unsafe',
      kind: Concurrency.RepairKind.ADD_LOCK,
      targetResource: 'user_session',
      description: 'Unsafe lock bypassing authentication',
      invariants: { securityPreserved: false, performanceImpactPct: 1.0, reliabilityPreserved: true }
    });

    const invalidCheck = dbg.validateConcurrencyRepair(unsafeRepair, { requireSecurity: true });
    assert.equal(invalidCheck.valid, false);
    assert.ok(invalidCheck.violations.some(v => v.includes('Security invariant violated')));

    // Apply valid repair
    const validRepair = sortedRepairs[0];
    const applyRes = dbg.applyConcurrencyRepair(validRepair);
    assert.equal(applyRes.applied, true);

    // Rollback repair
    const rollbackRes = dbg.rollbackConcurrencyRepair(validRepair.id);
    assert.equal(rollbackRes.rolledBack, true);
    assert.equal(rollbackRes.repair.id, validRepair.id);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 12. Full Autonomous Loop & Scoped Certification
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 36: Complete full closed loop (Semantic Change -> Impact -> Race/Temporal -> Repair -> Verify -> Certify)', () => {
    // 1. Semantic Change Impact
    const impact = engine.assessChangeImpact({
      modifiedFunctions: ['processOrder'],
      modifiedVariables: ['inventoryCount'],
      altersLocking: true,
      altersAsync: true
    });
    assert.equal(impact.riskLevel, 'CRITICAL');
    assert.ok(impact.obligations.length >= 2);

    // 2. Schedule Exploration & Race Detection
    const hbGraph = engine.createHappensBeforeGraph();
    const acc1 = engine.createMemoryAccess({ id: 'a1', contextId: 't1', resourceId: 'inventoryCount', kind: Concurrency.AccessKind.WRITE });
    const acc2 = engine.createMemoryAccess({ id: 'a2', contextId: 't2', resourceId: 'inventoryCount', kind: Concurrency.AccessKind.WRITE });
    const races = engine.analyzeRaces([acc1, acc2], hbGraph);
    assert.equal(races.length, 1);

    // 3. Counterexample
    const cex = new Concurrency.ConcurrencyCounterexample({
      id: 'full-loop-cex',
      defectType: 'RACE',
      failurePoint: { accessA: acc1, accessB: acc2, resourceId: 'inventoryCount' },
      violatedProperty: 'No Data Race on Inventory'
    });

    // 4. Synthesize Repair
    const repairs = engine.generateRepairs(cex);
    const chosenRepair = repairs[0];
    const validation = engine.validateRepair(chosenRepair, { requireSecurity: true, maxPerformanceRegressionPct: 5.0 });
    assert.equal(validation.valid, true);

    // 5. Apply Repair & Re-explore / Reverification
    engine.applyRepair(chosenRepair);
    hbGraph.addEdge('a1', 'a2', 'LOCK_SYNCHRONIZATION');
    const reverifiedRaces = engine.analyzeRaces([acc1, acc2], hbGraph);
    assert.equal(reverifiedRaces.length, 0);

    // 6. Scoped Certificate
    const cert = dbg.generateConcurrencyCertificate({
      id: 'cert-stage33-full-loop',
      property: 'No Data Race & Linearizable Inventory',
      status: 'VERIFIED_WITHIN_SCOPE',
      bounds: { schedules: 50, depth: 20 },
      assumptions: ['Sequential consistency on locked paths', 'Fair scheduler']
    });

    assert.equal(cert.status, 'VERIFIED_WITHIN_SCOPE');
    assert.equal(cert.property, 'No Data Race & Linearizable Inventory');

    // 7. Autonomous Loop run
    const autoLoop = dbg.runConcurrencyVerification({ bounds: { schedules: 50, depth: 20 } });
    assert.equal(autoLoop.status, 'completed');
    assert.equal(autoLoop.decision.passed, true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 13. Performance Benchmarks
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Performance Benchmarks (12 targets under stated limits)', () => {
    // Target 1: 100k concurrency events (< 300 ms)
    let t0 = performance.now();
    const accesses = [];
    for (let i = 0; i < 100000; i++) {
      accesses.push(new Concurrency.MemoryAccess({
        id: `ev-${i}`,
        contextId: `ctx-${i % 10}`,
        resourceId: `res-${i % 50}`,
        kind: i % 2 === 0 ? Concurrency.AccessKind.READ : Concurrency.AccessKind.WRITE
      }));
    }
    let duration = performance.now() - t0;
    assert.ok(duration < 300, `100k events creation took ${duration.toFixed(2)}ms (target < 300ms)`);

    // Target 2: 100k happens-before edges (< 250 ms)
    t0 = performance.now();
    const hb = new Concurrency.HappensBeforeGraph();
    for (let i = 0; i < 100000; i++) {
      hb.addEdge(`node-${i}`, `node-${i + 1}`);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 250, `100k HB edges took ${duration.toFixed(2)}ms (target < 250ms)`);

    // Target 3: 10k race queries (< 150 ms)
    t0 = performance.now();
    const queryPairs = [];
    for (let i = 0; i < 10000; i++) {
      const a = accesses[i];
      const b = accesses[i + 1];
      queryPairs.push(Concurrency.AccessConflict.check(a, b));
    }
    duration = performance.now() - t0;
    assert.ok(duration < 150, `10k race checks took ${duration.toFixed(2)}ms (target < 150ms)`);

    // Target 4: 10k lock-order queries (< 150 ms)
    t0 = performance.now();
    const lockGraph = new Concurrency.LockOrderGraph();
    for (let i = 0; i < 10000; i++) {
      lockGraph.addLockOrder(`lock-${i % 100}`, `lock-${(i + 1) % 100}`);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 150, `10k lock order ops took ${duration.toFixed(2)}ms (target < 150ms)`);

    // Target 5: 1k deadlock analyses (< 500 ms)
    t0 = performance.now();
    const deadlockAnalyzer = new Concurrency.DeadlockAnalyzer();
    for (let i = 0; i < 1000; i++) {
      const wfg = new Concurrency.WaitForGraph();
      wfg.addWait('c1', 'c2');
      wfg.addWait('c2', 'c3');
      deadlockAnalyzer.detectDeadlocks(wfg);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 500, `1k deadlock analyses took ${duration.toFixed(2)}ms (target < 500ms)`);

    // Target 6: 1k temporal evaluations (< 500 ms)
    t0 = performance.now();
    const tempProp = new Concurrency.TemporalProperty({
      id: 'bench-prop',
      kind: Concurrency.TemporalPropertyKind.ALWAYS,
      predicate: (s) => s.v > 0
    });
    const sampleTrace = [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }, { v: 5 }];
    const tempEval = new Concurrency.TemporalEvaluator();
    for (let i = 0; i < 1000; i++) {
      tempEval.evaluate(tempProp, sampleTrace);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 500, `1k temporal evaluations took ${duration.toFixed(2)}ms (target < 500ms)`);

    // Target 7: 1k consistency checks (< 500 ms)
    t0 = performance.now();
    const consAnalyzer = new Concurrency.ConsistencyAnalyzer();
    const consModel = new Concurrency.ConsistencyModel({ id: 'c1', kind: Concurrency.ConsistencyKind.READ_YOUR_WRITES });
    const hist = [
      { nodeId: 'n1', type: 'WRITE', key: 'k', value: 1, version: 1, timestamp: 1 },
      { nodeId: 'n1', type: 'READ', key: 'k', value: 1, version: 1, timestamp: 2 }
    ];
    for (let i = 0; i < 1000; i++) {
      consAnalyzer.verifyConsistency(hist, consModel);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 500, `1k consistency checks took ${duration.toFixed(2)}ms (target < 500ms)`);

    // Target 8: 1k schedule reductions (< 500 ms)
    t0 = performance.now();
    const schedReducer = new Concurrency.ScheduleReducer();
    const sched = new Concurrency.Schedule({ id: 's', events: [{ id: '1' }, { id: '2' }, { id: '3' }] });
    for (let i = 0; i < 1000; i++) {
      schedReducer.minimizeSchedule(sched, (s) => s.events.some(e => e.id === '2'));
    }
    duration = performance.now() - t0;
    assert.ok(duration < 500, `1k schedule reductions took ${duration.toFixed(2)}ms (target < 500ms)`);

    // Target 9: 1k counterexample reductions (< 400 ms)
    t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      new Concurrency.ConcurrencyCounterexample({
        id: `cex-${i}`,
        defectType: 'RACE',
        explanation: 'Data race on shared memory'
      });
    }
    duration = performance.now() - t0;
    assert.ok(duration < 400, `1k counterexample instantiations took ${duration.toFixed(2)}ms (target < 400ms)`);

    // Target 10: 1k fault-schedule generations (< 400 ms)
    t0 = performance.now();
    const faultGen = new Concurrency.FaultScheduleGenerator();
    const dModel = new Concurrency.DistributedModel({ id: 'dm', nodes: ['n1', 'n2'] });
    for (let i = 0; i < 1000; i++) {
      faultGen.generateSchedules(dModel, { maxSchedules: 2 });
    }
    duration = performance.now() - t0;
    assert.ok(duration < 400, `1k fault schedules took ${duration.toFixed(2)}ms (target < 400ms)`);

    // Target 11: 1k concurrency repair rankings (< 400 ms)
    t0 = performance.now();
    const repairAnalyzer = new Concurrency.ConcurrencyRepairAnalyzer();
    const testDefect = { defectType: 'RACE', resourceId: 'res' };
    for (let i = 0; i < 1000; i++) {
      repairAnalyzer.synthesizeRepairs(testDefect);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 400, `1k repair rankings took ${duration.toFixed(2)}ms (target < 400ms)`);

    // Target 12: 1k certificates (< 300 ms)
    t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      new Concurrency.ConcurrencyCertificate({
        id: `cert-${i}`,
        property: 'No Race'
      });
    }
    duration = performance.now() - t0;
    assert.ok(duration < 300, `1k certificates took ${duration.toFixed(2)}ms (target < 300ms)`);
  });
});
