/**
 * test_stage34_continuous.mjs
 * Test suite for Stage 34 — Universal Continuous Autonomous Verification & Self-Healing Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import * as Continuous from '../src/continuous/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

test('Stage 34 — Continuous Autonomous Verification & Self-Healing Engine', async (t) => {
  const dbg = new Debugger();
  const engine = new Continuous.ContinuousVerificationEngine();

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Continuous State, Change Detection & Classification
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 1, 2, 3: Create state, detect source changes, and classify changes', () => {
    const state = dbg.createContinuousVerification({ sourceRevision: 'v1.0.0' });
    assert.equal(state.sourceRevision, 'v1.0.0');
    assert.equal(state.confidence, 1.0);
    assert.equal(dbg.getVerificationHealth().status, 'HEALTHY');

    const prevFiles = { 'src/auth.js': 'function login() {}', 'src/math.js': 'function add() {}' };
    const currFiles = { 'src/auth.js': 'function login(token) {}', 'src/math.js': 'function add() {}', 'src/api.js': 'export default {}' };

    const changeSet = dbg.detectChanges(prevFiles, currFiles, {
      description: 'Modified auth security and added API',
      modifiedApis: ['authApi']
    });

    assert.equal(changeSet.addedFiles.length, 1);
    assert.equal(changeSet.modifiedFiles.length, 1);
    assert.equal(changeSet.deletedFiles.length, 0);

    const classification = dbg.classifyChange(changeSet);
    assert.ok(classification.categories.includes(Continuous.ChangeCategory.SECURITY_CHANGE));
    assert.ok(classification.categories.includes(Continuous.ChangeCategory.API_CHANGE));
    assert.equal(classification.riskLevel, 'CRITICAL');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Obligation Generation, Prioritization & Queue
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 4, 5, 6, 7: Generate semantic impact, obligations, prioritize, and queue', () => {
    const changeSet = new Continuous.ChangeSet({
      id: 'cs-auth-change',
      modifiedFiles: ['src/auth.js'],
      description: 'Security patch and performance lock on auth.js'
    });

    const obligations = dbg.generateVerificationObligations(changeSet, {
      affectedNodes: ['src/auth.js', 'src/session.js'],
      riskLevel: 'CRITICAL'
    });

    assert.ok(obligations.length >= 4);
    assert.ok(obligations.some(o => o.kind === Continuous.ObligationKind.CONTRACT_PRESERVATION));
    assert.ok(obligations.some(o => o.kind === Continuous.ObligationKind.SECURITY_PROPERTY));
    assert.ok(obligations.some(o => o.kind === Continuous.ObligationKind.PERFORMANCE_THRESHOLD));
    assert.ok(obligations.some(o => o.kind === Continuous.ObligationKind.RACE_FREEDOM));

    const planned = dbg.planContinuousVerification(obligations);
    assert.equal(planned.length, obligations.length);
    assert.ok(planned[0].priority >= planned[planned.length - 1].priority);

    const queue = dbg.getVerificationQueue();
    assert.ok(queue.size() >= obligations.length);
    const topTask = queue.peek();
    assert.ok(topTask);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Incremental Verification, Evidence Reuse & Invalidation
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 8, 9, 10: Incremental scope calculation, evidence reuse, and staleness invalidation', () => {
    const dependencyGraph = {
      'src/auth.js': ['src/session.js'],
      'src/session.js': ['src/dashboard.js'],
      'src/unrelated.js': ['src/logger.js']
    };

    const affectedScope = dbg.getAffectedVerificationScope(['src/auth.js'], dependencyGraph);
    assert.deepEqual(affectedScope.transitiveClosure.sort(), ['src/auth.js', 'src/dashboard.js', 'src/session.js'].sort());
    assert.ok(!affectedScope.transitiveClosure.includes('src/unrelated.js'));

    const priorEvidence = [
      { id: 'ev-auth', targetEntity: 'src/auth.js', assumptions: [] },
      { id: 'ev-session', targetEntity: 'src/session.js', assumptions: [] },
      { id: 'ev-unrelated', targetEntity: 'src/unrelated.js', assumptions: [] }
    ];

    const changeSet = new Continuous.ChangeSet({
      id: 'cs-1',
      modifiedFiles: ['src/auth.js']
    });

    const invalidationResult = dbg.reuseVerificationEvidence(priorEvidence, changeSet, affectedScope.transitiveClosure);
    assert.equal(invalidationResult.reusable.length, 1);
    assert.equal(invalidationResult.reusable[0].targetEntity, 'src/unrelated.js');
    assert.equal(invalidationResult.invalidated.length, 2);

    // Invalidate cache by key pattern
    dbg._continuousEngine.cache.put('src/auth.js:NULL_SAFETY:latest:default', { passed: true });
    dbg._continuousEngine.cache.put('src/math.js:NULL_SAFETY:latest:default', { passed: true });
    assert.equal(dbg._continuousEngine.cache.size(), 2);
    dbg.invalidateVerificationEvidence('src/auth.js');
    assert.equal(dbg._continuousEngine.cache.size(), 1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Cross-Engine Routing & Multi-Engine Pipeline
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 11, 12, 13, 14, 15, 16: Route obligations across engines and execute pipeline', () => {
    const router = new Continuous.VerificationRouter();

    const staticObl = new Continuous.VerificationObligation({ id: '1', kind: Continuous.ObligationKind.NULL_SAFETY, targetEntity: 'fn1' });
    const secObl = new Continuous.VerificationObligation({ id: '2', kind: Continuous.ObligationKind.SECURITY_PROPERTY, targetEntity: 'auth' });
    const perfObl = new Continuous.VerificationObligation({ id: '3', kind: Continuous.ObligationKind.PERFORMANCE_THRESHOLD, targetEntity: 'api' });
    const concObl = new Continuous.VerificationObligation({ id: '4', kind: Continuous.ObligationKind.RACE_FREEDOM, targetEntity: 'lock' });

    assert.equal(router.route(staticObl).engineId, 'static');
    assert.equal(router.route(secObl).engineId, 'security');
    assert.equal(router.route(perfObl).engineId, 'performance');
    assert.equal(router.route(concObl).engineId, 'concurrency');

    const pipeline = new Continuous.VerificationPipeline({ router });
    const stages = pipeline.buildPipeline([staticObl, secObl, perfObl, concObl]);
    assert.equal(stages.length, 4);

    // Verification Barrier
    const barrier = new Continuous.VerificationBarrier({
      id: 'barrier-security',
      requiredObligationIds: ['2']
    });
    assert.equal(barrier.isPassed(new Set(['1'])), false);
    assert.equal(barrier.isPassed(new Set(['1', '2'])), true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Failure Diagnosis, Clustering & Root Cause Resolution
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 17, 18, 19: Detect failures, cluster by root cause, and resolve root cause', () => {
    const failures = [
      { id: 'fail-1', targetEntity: 'src/auth.js', kind: 'SECURITY_PROPERTY', message: 'Token bypass' },
      { id: 'fail-2', targetEntity: 'src/auth.js', kind: 'SECURITY_PROPERTY', message: 'Missing auth guard' },
      { id: 'fail-3', targetEntity: 'src/payment.js', kind: 'NULL_SAFETY', message: 'Dereference null user' }
    ];

    const clusters = dbg.clusterVerificationFailures(failures);
    assert.equal(clusters.length, 2);

    const authCluster = clusters.find(c => c.affectedEntities.includes('src/auth.js'));
    assert.ok(authCluster);
    assert.equal(authCluster.failureCount(), 2);

    const rootCause = dbg.resolveVerificationRootCause(authCluster);
    assert.ok(rootCause.confidence >= 0.85);
    assert.ok(rootCause.rootCause.includes('src/auth.js'));
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Autonomous Repair, Isolated Sandbox, Multi-Gate Validation & Rollback
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31: Autonomous repairs, sandbox, cross-stage gates, apply and rollback', () => {
    const cluster = new Continuous.FailureCluster({
      id: 'cluster-null',
      rootCauseSummary: 'NULL_SAFETY defect in user session',
      affectedEntities: ['src/session.js']
    });

    const candidates = dbg.generateAutonomousRepairs(cluster);
    assert.ok(candidates.length >= 1);
    const ranked = dbg.rankAutonomousRepairs(candidates);
    assert.ok(ranked[0].utility >= 5.0);

    const baseFiles = { 'src/session.js': 'function getSession() { return user.name; }' };
    const bestRepair = ranked[0];

    // 1. Validation failure: unsafe repair violating security
    const rejectOutcome = dbg.applyAutonomousRepair(bestRepair, baseFiles, {
      functionalPassed: true,
      securityPassed: false // Security gate fails
    });
    assert.equal(rejectOutcome.accepted, false);
    assert.equal(rejectOutcome.safetyResult.passed, false);
    assert.ok(rejectOutcome.safetyResult.violations.some(v => v.includes('Security gate failed')));

    // 2. Validation success: all gates pass
    const acceptOutcome = dbg.applyAutonomousRepair(bestRepair, baseFiles, {
      functionalPassed: true,
      securityPassed: true,
      performancePassed: true,
      reliabilityPassed: true,
      concurrencyPassed: true
    });
    assert.equal(acceptOutcome.accepted, true);
    assert.equal(acceptOutcome.safetyResult.passed, true);

    // 3. Rollback
    const rollbackRes = dbg.rollbackAutonomousRepair(acceptOutcome.record.checkpointId);
    assert.equal(rollbackRes.success, true);
    assert.equal(rollbackRes.files.get('src/session.js'), 'function getSession() { return user.name; }');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Verification Debt, Confidence & Canary Verification
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 32, 33, 34, 35: Measure debt, stale evidence, confidence tiers, and canary verification', () => {
    const debtItems = [
      new Continuous.VerificationDebtItem({ id: 'd1', targetEntity: 'auth.js', debtKind: 'STALE_SECURITY', risk: 4.0, scope: 2.0, staleness: 1.5 }),
      new Continuous.VerificationDebtItem({ id: 'd2', targetEntity: 'math.js', debtKind: 'UNTESTED_CODE', risk: 1.0, scope: 1.0, staleness: 1.0 })
    ];

    const debtReport = dbg.analyzeVerificationDebt(debtItems);
    assert.equal(debtReport.totalDebt, 13.0); // 4*2*1.5 + 1*1*1 = 12 + 1 = 13
    assert.equal(debtReport.criticalDebts.length, 1);

    // Confidence aggregation with tier preservation
    const evidence = [
      { id: '1', tier: Continuous.EvidenceTier.FORMAL_PROOF },
      { id: '2', tier: Continuous.EvidenceTier.TEST_EVIDENCE }
    ];
    const confidence = dbg.getVerificationConfidence(evidence);
    assert.equal(confidence.hasFormalProof, true);
    assert.equal(confidence.highestTier, Continuous.EvidenceTier.FORMAL_PROOF);
    assert.equal(confidence.confidence, 0.75); // (1.0 + 0.5) / 2

    // Canary run
    const obligations = [
      new Continuous.VerificationObligation({ id: 'obl-high', kind: Continuous.ObligationKind.SECURITY_PROPERTY, targetEntity: 'auth', risk: 5.0, impact: 5.0 }),
      new Continuous.VerificationObligation({ id: 'obl-low', kind: Continuous.ObligationKind.NULL_SAFETY, targetEntity: 'ui', risk: 1.0, impact: 1.0 })
    ];
    const canary = engine.runCanary(obligations, {
      maxCanaryCount: 1,
      executor: (obl) => ({ success: true })
    });
    assert.equal(canary.canaryPassed, true);
    assert.equal(canary.testedCount, 1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Background Verification & Budget Limiting
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 36 & 37: Execute background verification and enforce resource budgets', () => {
    const budget = new Continuous.VerificationBudget({ maxCpuMs: 50, maxSolverCalls: 2 });
    const queue = new Continuous.VerificationQueue();
    const scheduler = new Continuous.VerificationScheduler({ queue });
    const bgEngine = new Continuous.BackgroundVerificationEngine({ scheduler, budget });

    queue.enqueue(new Continuous.VerificationTask({ id: 't1', obligation: new Continuous.VerificationObligation({ id: 'o1', kind: 'NULL_SAFETY', targetEntity: 'e1' }) }));
    queue.enqueue(new Continuous.VerificationTask({ id: 't2', obligation: new Continuous.VerificationObligation({ id: 'o2', kind: 'NULL_SAFETY', targetEntity: 'e2' }) }));
    queue.enqueue(new Continuous.VerificationTask({ id: 't3', obligation: new Continuous.VerificationObligation({ id: 'o3', kind: 'NULL_SAFETY', targetEntity: 'e3' }) }));

    bgEngine.start();
    const batch1 = bgEngine.processBatch(() => ({ success: true }));
    assert.equal(batch1.length, 2); // Budget maxSolverCalls = 2 limit reached

    const batch2 = bgEngine.processBatch(() => ({ success: true }));
    assert.equal(batch2.length, 0); // Budget exhausted
    assert.equal(budget.isExhausted(), true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Decision Evaluation & Human Escalation
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 38 & 39: Autonomous decision evaluation, human escalation, and certification', () => {
    const decisionEngine = new Continuous.ContinuousDecisionEngine();

    // High confidence accept
    const acceptDec = decisionEngine.evaluate({
      evidenceStrength: 1.0,
      coverage: 1.0,
      freshness: 1.0,
      riskReduction: 1.0,
      residualRisk: 0.0,
      verificationCost: 0.1
    });
    assert.equal(acceptDec.decision, Continuous.ContinuousDecisionType.ACCEPT);
    assert.equal(acceptDec.passed, true);

    // Escalation
    const escalation = dbg.escalateVerification({
      id: 'esc-1',
      reason: 'Equally plausible conflicting repairs for critical security boundary',
      severity: 'CRITICAL',
      candidateOptions: [{ id: 'repair-A' }, { id: 'repair-B' }]
    });
    assert.equal(escalation.severity, 'CRITICAL');

    // Continuous Certificate
    const cert = dbg.generateContinuousCertificate({
      id: 'cert-cont-1',
      revision: 'v1.1.0',
      status: 'VERIFIED_CONTINUOUSLY',
      confidence: 0.98,
      assumptions: ['Ordered message delivery', 'Deterministic garbage collection']
    });
    assert.equal(cert.revision, 'v1.1.0');
    assert.equal(cert.confidence, 0.98);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10. Full Autonomous Closed Loop
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Scenario 40: Complete full continuous loop (Change -> Impact -> Obligation -> Plan -> Verify -> Diagnose -> Repair -> Reverification -> Decision -> Certify -> Knowledge Update -> Next Change)', () => {
    // 1. Detect change
    const prev = { 'src/user.js': 'function getUser(id) { return db.find(id); }' };
    const curr = { 'src/user.js': 'function getUser(id) { if (!id) throw new Error(); return db.find(id); }' };
    const changeSet = dbg.detectChanges(prev, curr, { description: 'Added ID guard in user.js' });

    // 2. Generate obligations
    const obligations = dbg.generateVerificationObligations(changeSet, { affectedNodes: ['src/user.js'] });
    assert.ok(obligations.length >= 2);

    // 3. Plan verification
    const planned = dbg.planContinuousVerification(obligations);
    assert.ok(planned.length >= 2);

    // 4. Verification failure simulation & diagnosis
    const mockFailure = [{ targetEntity: 'src/user.js', kind: 'CONTRACT_PRESERVATION', message: 'Missing error typing' }];
    const clusters = dbg.clusterVerificationFailures(mockFailure);
    assert.equal(clusters.length, 1);

    // 5. Automated repair synthesis & validation
    const repairs = dbg.generateAutonomousRepairs(clusters[0]);
    assert.ok(repairs.length >= 1);
    const chosenRepair = repairs[0];

    const repairOutcome = dbg.applyAutonomousRepair(chosenRepair, curr, {
      functionalPassed: true,
      securityPassed: true,
      performancePassed: true,
      reliabilityPassed: true,
      concurrencyPassed: true
    });
    assert.equal(repairOutcome.accepted, true);

    // 6. Final Decision & Certificate
    const finalDecision = dbg.getContinuousDecision({ evidenceStrength: 1.0, coverage: 1.0, freshness: 1.0 });
    assert.equal(finalDecision.passed, true);

    const certificate = dbg.generateContinuousCertificate({
      id: 'cert-loop-closed',
      revision: 'v1.2.0',
      status: 'VERIFIED_CONTINUOUSLY',
      confidence: 1.0
    });
    assert.equal(certificate.status, 'VERIFIED_CONTINUOUSLY');

    // 7. Verification History in Knowledge Graph
    const history = dbg.getVerificationHistory();
    assert.ok(history.length >= 3);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 11. Performance Benchmarks
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('Performance Benchmarks (12 targets under stated limits)', () => {
    // Target 1: 100k change records (< 300 ms)
    let t0 = performance.now();
    const changes = [];
    for (let i = 0; i < 100000; i++) {
      changes.push(new Continuous.ChangeSet({
        id: `cs-${i}`,
        modifiedFiles: [`file-${i % 50}.js`]
      }));
    }
    let duration = performance.now() - t0;
    assert.ok(duration < 300, `100k change records took ${duration.toFixed(2)}ms (target < 300ms)`);

    // Target 2: 100k obligation records (< 300 ms)
    t0 = performance.now();
    const obligations = [];
    for (let i = 0; i < 100000; i++) {
      obligations.push(new Continuous.VerificationObligation({
        id: `obl-${i}`,
        kind: Continuous.ObligationKind.NULL_SAFETY,
        targetEntity: `entity-${i % 100}`
      }));
    }
    duration = performance.now() - t0;
    assert.ok(duration < 300, `100k obligations took ${duration.toFixed(2)}ms (target < 300ms)`);

    // Target 3: 10k impact-to-obligation mappings (< 200 ms)
    t0 = performance.now();
    const oblGen = new Continuous.ObligationGenerator();
    const sampleCs = new Continuous.ChangeSet({ id: 'cs-bench', modifiedFiles: ['f.js'] });
    for (let i = 0; i < 10000; i++) {
      oblGen.generateObligations(sampleCs, { affectedNodes: ['f.js'] });
    }
    duration = performance.now() - t0;
    assert.ok(duration < 200, `10k obligation mappings took ${duration.toFixed(2)}ms (target < 200ms)`);

    // Target 4: 10k evidence freshness checks (< 150 ms)
    t0 = performance.now();
    const stalenessAnalyzer = new Continuous.StalenessAnalyzer();
    const sampleEv = { targetEntity: 'f1.js', assumptions: ['a.js'] };
    for (let i = 0; i < 10000; i++) {
      stalenessAnalyzer.evaluateFreshness(sampleEv, sampleCs, []);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 150, `10k freshness checks took ${duration.toFixed(2)}ms (target < 150ms)`);

    // Target 5: 10k cache validations (< 200 ms)
    t0 = performance.now();
    const cacheValidator = new Continuous.CacheValidator();
    const entry = { key: 'fn:prop:v1:def', assumptions: [], revision: 'v1' };
    for (let i = 0; i < 10000; i++) {
      cacheValidator.isValid(entry, [], 'v1');
    }
    duration = performance.now() - t0;
    assert.ok(duration < 200, `10k cache validations took ${duration.toFixed(2)}ms (target < 200ms)`);

    // Target 6: 10k verification priorities (< 200 ms)
    t0 = performance.now();
    const planner = new Continuous.ContinuousVerificationPlanner();
    const sampleObl = obligations[0];
    for (let i = 0; i < 10000; i++) {
      planner.computePriority(sampleObl);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 200, `10k verification priorities took ${duration.toFixed(2)}ms (target < 200ms)`);

    // Target 7: 1k failure clusters (< 500 ms)
    t0 = performance.now();
    const failAnalyzer = new Continuous.VerificationFailureAnalyzer();
    const sampleFails = [
      { targetEntity: 'auth.js', kind: 'SECURITY' },
      { targetEntity: 'auth.js', kind: 'SECURITY' },
      { targetEntity: 'pay.js', kind: 'NULL' }
    ];
    for (let i = 0; i < 1000; i++) {
      failAnalyzer.clusterFailures(sampleFails);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 500, `1k failure clusters took ${duration.toFixed(2)}ms (target < 500ms)`);

    // Target 8: 1k repair rankings (< 500 ms)
    t0 = performance.now();
    const ranker = new Continuous.RepairCandidateRanker();
    const sampleRepairs = [{ benefit: 10, risk: 1 }, { benefit: 5, risk: 2 }];
    for (let i = 0; i < 1000; i++) {
      ranker.rank(sampleRepairs);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 500, `1k repair rankings took ${duration.toFixed(2)}ms (target < 500ms)`);

    // Target 9: 1k decision evaluations (< 400 ms)
    t0 = performance.now();
    const decEngine = new Continuous.ContinuousDecisionEngine();
    for (let i = 0; i < 1000; i++) {
      decEngine.evaluate({ evidenceStrength: 1.0, coverage: 1.0 });
    }
    duration = performance.now() - t0;
    assert.ok(duration < 400, `1k decision evaluations took ${duration.toFixed(2)}ms (target < 400ms)`);

    // Target 10: 1k confidence aggregations (< 400 ms)
    t0 = performance.now();
    const confAgg = new Continuous.VerificationConfidence();
    const sampleEvList = [{ tier: 'FORMAL_PROOF' }, { tier: 'TEST_EVIDENCE' }];
    for (let i = 0; i < 1000; i++) {
      confAgg.aggregate(sampleEvList);
    }
    duration = performance.now() - t0;
    assert.ok(duration < 400, `1k confidence aggregations took ${duration.toFixed(2)}ms (target < 400ms)`);

    // Target 11: 1k certificate generations (< 300 ms)
    t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      new Continuous.ContinuousCertificate({
        id: `cert-${i}`,
        revision: `rev-${i}`
      });
    }
    duration = performance.now() - t0;
    assert.ok(duration < 300, `1k certificates took ${duration.toFixed(2)}ms (target < 300ms)`);

    // Target 12: 1k verification-state snapshots (< 300 ms)
    t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      new Continuous.ContinuousVerificationState({
        sourceRevision: `rev-${i}`
      });
    }
    duration = performance.now() - t0;
    assert.ok(duration < 300, `1k state snapshots took ${duration.toFixed(2)}ms (target < 300ms)`);
  });
});
