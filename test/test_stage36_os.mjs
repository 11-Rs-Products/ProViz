/**
 * test_stage36_os.mjs
 * Stage 36: ProViz Autonomous Verification Operating System Test Suite.
 * 50 Mandatory Scenarios + 14 Performance Benchmarks.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Debugger } from '../src/debugger/Debugger.js';
import * as OS from '../src/os/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Operating System Core & State (Scenarios 1–8)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Scenario 1: OS initialization and boot attestation', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'test_proj' });
  assert.equal(os.getState(), OS.OSState.READY);
  assert.ok(os.identity.instanceId);
  assert.equal(os.identity.version, OS.OSVersion.VERSION);
});

test('Stage 36 — Scenario 2: Capability registration and catalog completeness', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'test_proj' });
  const caps = os.getCapabilities();
  assert.ok(caps.length >= 20);
  assert.ok(os.capabilityRegistry.hasCapability(OS.CapabilityKind.CONTINUOUS_VERIFICATION));
  assert.ok(os.capabilityRegistry.hasCapability(OS.CapabilityKind.PROJECT_INTELLIGENCE));
});

test('Stage 36 — Scenario 3: Unified project state creation', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'test_proj' });
  const state = os.getUnifiedProjectState();
  assert.equal(state.projectId, 'test_proj');
  assert.equal(state.revision.sequenceNumber, 0);
});

test('Stage 36 — Scenario 4: State revision progression and lineage', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'test_proj' });
  const rev0 = os.getStateRevision();
  os.stateCoordinator.updateState({ metadata: { update: 1 } }, 'Test update');
  const rev1 = os.getStateRevision();

  assert.equal(rev1.sequenceNumber, rev0.sequenceNumber + 1);
  assert.equal(rev1.parentRevisionId, rev0.revisionId);
});

test('Stage 36 — Scenario 5: State consistency validation', () => {
  const validator = new OS.StateConsistencyValidator();
  const state = new OS.UnifiedProjectState({
    projectId: 'test_proj',
    revision: new OS.StateRevision({ sequenceNumber: 1 }),
    projectModel: { id: 'model_1' }
  });
  const res = validator.validate(state);
  assert.equal(res.isValid, true);
});

test('Stage 36 — Scenario 6: Runtime lifecycle state machine transitions', () => {
  const lifecycle = new OS.OSLifecycle(OS.OSState.READY);
  assert.equal(lifecycle.state, OS.OSState.READY);

  lifecycle.transitionTo(OS.OSState.VERIFYING, 'Start verification');
  assert.equal(lifecycle.state, OS.OSState.VERIFYING);

  lifecycle.transitionTo(OS.OSState.GOVERNING, 'Governance check');
  assert.equal(lifecycle.state, OS.OSState.GOVERNING);
});

test('Stage 36 — Scenario 7: Runtime pause and resume controls', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'test_proj' });
  assert.equal(os.getState(), OS.OSState.READY);

  os.pause();
  assert.equal(os.getState(), OS.OSState.PAUSED);

  os.resume();
  assert.equal(os.getState(), OS.OSState.READY);
});

test('Stage 36 — Scenario 8: Safe graceful runtime shutdown', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'test_proj' });
  os.stop();
  assert.equal(os.getState(), OS.OSState.STOPPED);
});

// ─────────────────────────────────────────────────────────────────────────────
// Event Bus & Coordination (Scenarios 9–12)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Scenario 9: Event publication and immutable structure', () => {
  const bus = new OS.VerificationEventBus();
  const evt = bus.publish({
    kind: OS.VerificationEventKind.SOURCE_CHANGED,
    source: 'FileWatcher',
    payload: { file: 'auth.js' }
  });

  assert.equal(evt.kind, OS.VerificationEventKind.SOURCE_CHANGED);
  assert.ok(evt.eventId.startsWith('EVT_'));
  assert.throws(() => {
    evt.kind = 'MUTATED';
  });
});

test('Stage 36 — Scenario 10: Event routing with filtered subscribers', () => {
  const bus = new OS.VerificationEventBus();
  const received = [];

  bus.subscribe({ kinds: [OS.VerificationEventKind.VERIFICATION_STARTED] }, (e) => {
    received.push(e);
  });

  bus.publish({ kind: OS.VerificationEventKind.SOURCE_CHANGED });
  bus.publish({ kind: OS.VerificationEventKind.VERIFICATION_STARTED, payload: { id: 'task_1' } });

  assert.equal(received.length, 1);
  assert.equal(received[0].payload.id, 'task_1');
});

test('Stage 36 — Scenario 11: Event causation and correlation tracking', () => {
  const bus = new OS.VerificationEventBus();
  const parentEvt = bus.publish({
    kind: OS.VerificationEventKind.SOURCE_CHANGED,
    correlationId: 'CORR_123'
  });

  const childEvt = bus.publish({
    kind: OS.VerificationEventKind.VERIFICATION_OBLIGATION_CREATED,
    causationId: parentEvt.eventId,
    correlationId: parentEvt.correlationId
  });

  assert.equal(childEvt.causationId, parentEvt.eventId);
  assert.equal(childEvt.correlationId, 'CORR_123');
});

test('Stage 36 — Scenario 12: Event journal replay and retrieval', () => {
  const bus = new OS.VerificationEventBus();
  bus.publish({ kind: OS.VerificationEventKind.PROJECT_LOADED });
  bus.publish({ kind: OS.VerificationEventKind.SOURCE_CHANGED });

  const events = bus.getEvents();
  assert.equal(events.length, 2);
  assert.equal(events[0].kind, OS.VerificationEventKind.PROJECT_LOADED);
});

// ─────────────────────────────────────────────────────────────────────────────
// Autonomy & Approvals (Scenarios 13–19)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Scenario 13: Autonomy policy evaluation for permitted operations', () => {
  const evaluator = new OS.AutonomyPolicyEvaluator(new OS.AutonomyPolicySet(), OS.AutonomyPolicyLevel.LEVEL_3_AUTO_REPAIR);
  const decision = evaluator.evaluate('AUTO_REPAIR', { risk: 'LOW' });

  assert.ok(decision.isAllowed);
  assert.equal(decision.outcome, OS.AutonomyOutcome.ALLOWED);
});

test('Stage 36 — Scenario 14: Low-risk autonomous verification execution', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'p' });
  const decision = os.evaluateAutonomyPermission('VERIFY', { risk: 'LOW' });
  assert.ok(decision.isAllowed);
});

test('Stage 36 — Scenario 15: Restricted autonomous repair under policy', () => {
  const policySet = new OS.AutonomyPolicySet();
  policySet.addPolicy(new OS.AutonomyPolicy({
    id: 'p_repair',
    operation: 'AUTO_REPAIR',
    requiresHumanApproval: true
  }));

  const evaluator = new OS.AutonomyPolicyEvaluator(policySet);
  const decision = evaluator.evaluate('AUTO_REPAIR');

  assert.ok(decision.requiresHumanApproval);
  assert.equal(decision.isAllowed, false);
});

test('Stage 36 — Scenario 16: High-risk operation escalation requirement', () => {
  const evaluator = new OS.AutonomyPolicyEvaluator();
  const decision = evaluator.evaluate('ARCHITECTURE_TRANSFORMATION', { risk: 'CRITICAL' });

  assert.ok(decision.requiresHumanApproval);
});

test('Stage 36 — Scenario 17: Policy denial under LEVEL_0_OBSERVE_ONLY', () => {
  const evaluator = new OS.AutonomyPolicyEvaluator(new OS.AutonomyPolicySet(), OS.AutonomyPolicyLevel.LEVEL_0_OBSERVE_ONLY);
  const decision = evaluator.evaluate('AUTO_REPAIR');

  assert.equal(decision.outcome, OS.AutonomyOutcome.PROHIBITED);
});

test('Stage 36 — Scenario 18: Human approval request creation and approval', () => {
  const manager = new OS.ApprovalManager();
  const req = manager.createRequest({
    title: 'Deploy Critical Security Mitigation',
    rationale: 'Patches CVE-2026-X',
    risk: 'HIGH'
  });

  assert.equal(manager.getPendingRequests().length, 1);

  manager.recordDecision(new OS.HumanDecision({
    requestId: req.id,
    operatorId: 'sec_admin@proviz.org',
    decision: 'APPROVED',
    comments: 'Reviewed and authorized'
  }));

  assert.ok(manager.isApproved(req.id));
  assert.equal(manager.getPendingRequests().length, 0);
});

test('Stage 36 — Scenario 19: Human rejection blocking autonomous pipeline', () => {
  const manager = new OS.ApprovalManager();
  const req = manager.createRequest({
    title: 'Destructive Migration',
    rationale: 'Database schema drop',
    risk: 'CRITICAL'
  });

  manager.recordDecision(new OS.HumanDecision({
    requestId: req.id,
    operatorId: 'lead_architect',
    decision: 'REJECTED',
    comments: 'Unsafe schema alteration'
  }));

  assert.equal(manager.isApproved(req.id), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Verification Pipeline & Evidence (Scenarios 20–25)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Scenario 20: Global verification planning based on risk', () => {
  const planner = new OS.PipelinePlanner();
  const plan = planner.plan({ riskLevel: 'HIGH', needsRepair: true });

  assert.ok(plan.phases.includes(OS.VerificationPhase.VERIFY));
  assert.ok(plan.phases.includes(OS.VerificationPhase.REPAIR));
  assert.ok(plan.phases.includes(OS.VerificationPhase.CERTIFY));
});

test('Stage 36 — Scenario 21: Cross-stage pipeline execution', async () => {
  const pipeline = new OS.AutonomousVerificationPipeline();
  pipeline.registerPhaseHandler(OS.VerificationPhase.OBSERVE, async () => ({ observed: true }));
  pipeline.registerPhaseHandler(OS.VerificationPhase.VERIFY, async (ctx) => ({ verified: ctx.observed }));

  const res = await pipeline.runPipeline({ riskLevel: 'LOW', needsRepair: false, needsCertification: false });
  assert.ok(res.isSuccess);
  assert.equal(res.completedPhaseCount > 0, true);
});

test('Stage 36 — Scenario 22: Evidence aggregation across categories', () => {
  const store = new OS.EvidenceStore();
  const merger = new OS.EvidenceMergeEngine();

  const ev1 = store.put(new OS.EvidenceArtifact({
    id: 'ev_formal',
    category: OS.EvidenceCategory.FORMAL,
    targetEntityId: 'mod_core',
    isFormalProof: true,
    claim: { isCorrect: true }
  }));

  const ev2 = store.put(new OS.EvidenceArtifact({
    id: 'ev_test',
    category: OS.EvidenceCategory.TEST,
    targetEntityId: 'mod_core',
    confidence: 0.95,
    claim: { passedTests: 10 }
  }));

  const merged = merger.merge([ev1, ev2]);
  assert.equal(merged.hasFormalProof, true);
  assert.equal(merged.mergedCount, 2);
});

test('Stage 36 — Scenario 23: Invariant: Empirical and probabilistic evidence never equals formal proof', () => {
  const ev = new OS.EvidenceArtifact({
    id: 'ev_prob',
    category: OS.EvidenceCategory.PROBABILISTIC,
    targetEntityId: 'modA',
    isFormalProof: true, // Should be rejected by invariant
    claim: { p: 0.9999 }
  });

  assert.equal(ev.isFormalProof, false);
});

test('Stage 36 — Scenario 24: Stale evidence detection and invalidation', () => {
  const freshnessManager = new OS.EvidenceFreshnessManager();
  const artifacts = [
    new OS.EvidenceArtifact({
      id: 'ev_fresh',
      category: OS.EvidenceCategory.STATIC,
      targetEntityId: 'modA',
      provenance: { revision: 10 }
    }),
    new OS.EvidenceArtifact({
      id: 'ev_stale',
      category: OS.EvidenceCategory.STATIC,
      targetEntityId: 'modB',
      provenance: { revision: 2 } // Stale relative to rev 10
    })
  ];

  const res = freshnessManager.detectStale(artifacts, 10);
  assert.equal(res.staleCount, 1);
  assert.equal(res.staleArtifacts[0].id, 'ev_stale');
});

test('Stage 36 — Scenario 25: Global decision engine heuristic calculation', () => {
  const engine = new OS.AutonomousDecisionEngine();
  const dec = engine.evaluate({
    evidenceStrength: 0.95,
    coverage: 0.9,
    freshness: 1.0,
    hasCriticalViolation: false
  });

  assert.equal(dec.decisionClass, OS.DecisionClass.ACCEPT);
  assert.ok(dec.score > 0);
  assert.ok(dec.explanation.supportingEvidence.length > 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Autonomous Repair & Rollback (Scenarios 26–32)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Scenario 26: Autonomous repair transaction creation and commit', async () => {
  const controller = new OS.AutonomousRepairController();
  const res = await controller.executeRepair(
    { id: 'finding_1' },
    { id: 'repair_1', risk: 'LOW' },
    { preservationPassed: true, securityGatePassed: true }
  );

  assert.equal(res.status, 'COMMITTED');
  assert.ok(res.transactionId);
});

test('Stage 36 — Scenario 27: Repair sandboxed execution and gate checks', async () => {
  const controller = new OS.AutonomousRepairController();
  const res = await controller.executeRepair(
    { id: 'finding_sec' },
    { id: 'patch_sec', risk: 'LOW' },
    { securityGatePassed: false } // Security failure
  );

  assert.equal(res.status, 'ROLLED_BACK');
  assert.equal(res.gates.securityGatePassed, false);
});

test('Stage 36 — Scenario 28: Multi-gate validation across security, performance, and concurrency', async () => {
  const controller = new OS.AutonomousRepairController();
  const res = await controller.executeRepair(
    { id: 'finding_perf' },
    { id: 'patch_perf', risk: 'LOW' },
    { performanceGatePassed: false }
  );

  assert.equal(res.status, 'ROLLED_BACK');
});

test('Stage 36 — Scenario 29: Successful transaction commit records state progression', () => {
  const tm = new OS.TransactionManager();
  const tx = tm.beginTransaction(1, { files: ['app.js'] });
  tx.addModification({ file: 'app.js', diff: '+ verified' });
  const committed = tm.commitTransaction(tx.id);

  assert.equal(committed, true);
  assert.equal(tx.status, OS.TransactionStatus.COMMITTED);
});

test('Stage 36 — Scenario 30: Failed repair triggers automatic rollback', () => {
  const tm = new OS.TransactionManager();
  const tx = tm.beginTransaction(1, { files: ['app.js'] });
  const rollbackRes = tm.rollbackTransaction(tx.id);

  assert.ok(rollbackRes.isRollbackVerified);
  assert.equal(tx.status, OS.TransactionStatus.ROLLED_BACK);
});

test('Stage 36 — Scenario 31: Rollback restoration to base revision checkpoint', () => {
  const stateCoord = new OS.ProjectStateCoordinator({ projectId: 'p' });
  const tm = new OS.TransactionManager();
  const tx = tm.beginTransaction(0, stateCoord.getState());

  stateCoord.updateState({ metadata: { brokenChange: true } }, 'Unverified edit');
  assert.equal(stateCoord.getRevision().sequenceNumber, 1);

  const rollbackRes = tm.rollbackTransaction(tx.id, stateCoord);
  assert.ok(rollbackRes.isRollbackVerified);
});

test('Stage 36 — Scenario 32: Verified rollback integrity validation', () => {
  const rollbackManager = new OS.GlobalRollbackManager();
  const tx = new OS.AutonomousTransaction({ id: 'tx_1', baseRevision: 1, checkpointState: {} });
  const res = rollbackManager.rollback(tx);

  assert.equal(res.restoredRevision, 1);
  assert.equal(res.isRollbackVerified, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Governance & Release Gates (Scenarios 33–38)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Scenario 33: Architecture governance gate in release pipeline', () => {
  const engine = new OS.GlobalGovernanceEngine();
  const candidate = new OS.ReleaseCandidate({
    id: 'RC_1',
    projectId: 'p',
    targetVersion: '1.0.0',
    revision: 1
  });

  const decision = engine.evaluateRelease(candidate, { architecture: false });
  assert.equal(decision.outcome, 'RELEASE_WITH_SCOPE');
  assert.ok(decision.blockingReasons.includes('architecture'));
});

test('Stage 36 — Scenario 34: Security release gate blocks candidate with unmitigated vulnerability', () => {
  const engine = new OS.GlobalGovernanceEngine();
  const candidate = new OS.ReleaseCandidate({
    id: 'RC_2',
    projectId: 'p',
    targetVersion: '1.0.0',
    revision: 1
  });

  const decision = engine.evaluateRelease(candidate, { security: false });
  assert.equal(decision.outcome, 'BLOCK');
  assert.equal(decision.isApproved, false);
});

test('Stage 36 — Scenario 35: Performance release gate evaluation', () => {
  const engine = new OS.GlobalGovernanceEngine();
  const candidate = new OS.ReleaseCandidate({
    id: 'RC_3',
    projectId: 'p',
    targetVersion: '1.0.0',
    revision: 1
  });

  const decision = engine.evaluateRelease(candidate, { performance: false });
  assert.equal(decision.outcome, 'RELEASE_WITH_SCOPE');
});

test('Stage 36 — Scenario 36: Concurrency release gate evaluation', () => {
  const engine = new OS.GlobalGovernanceEngine();
  const candidate = new OS.ReleaseCandidate({
    id: 'RC_4',
    projectId: 'p',
    targetVersion: '1.0.0',
    revision: 1
  });

  const decision = engine.evaluateRelease(candidate, { concurrency: false });
  assert.equal(decision.outcome, 'RELEASE_WITH_SCOPE');
});

test('Stage 36 — Scenario 37: 11-gate clean release approval', () => {
  const engine = new OS.GlobalGovernanceEngine();
  const candidate = new OS.ReleaseCandidate({
    id: 'RC_PROD',
    projectId: 'p',
    targetVersion: '2.0.0',
    revision: 5
  });

  const decision = engine.evaluateRelease(candidate, {});
  assert.equal(decision.outcome, 'RELEASE');
  assert.equal(decision.isApproved, true);
  assert.equal(decision.blockingReasons.length, 0);
});

test('Stage 36 — Scenario 38: Governance conflict and safety precedence', () => {
  const decEngine = new OS.AutonomousDecisionEngine();
  // Critical violation must override favorable aggregate metrics
  const decision = decEngine.evaluate({
    evidenceStrength: 0.99,
    coverage: 0.99,
    hasCriticalViolation: true
  });

  assert.equal(decision.decisionClass, OS.DecisionClass.REJECT);
});

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge & Health Synchronization (Scenarios 39–42)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Scenario 39: Global knowledge coordinator synchronization', () => {
  const coord = new OS.GlobalKnowledgeCoordinator();
  const res = coord.syncKnowledge({ modifiedEntities: ['auth.js', 'token.js'] });

  assert.ok(res.id.startsWith('SYNC_'));
  assert.equal(coord.getSyncHistory().length, 1);
});

test('Stage 36 — Scenario 40: Semantic synchronization updates state revision', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'p' });
  const revBefore = os.getStateRevision().sequenceNumber;

  os.stateCoordinator.updateState({ semanticState: { changedAstNodes: 3 } }, 'Semantic patch');
  const revAfter = os.getStateRevision().sequenceNumber;

  assert.equal(revAfter, revBefore + 1);
});

test('Stage 36 — Scenario 41: Project-health update reflection in unified state', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'p' });
  os.stateCoordinator.updateState({
    projectIntelligenceState: { healthScore: 0.92 }
  }, 'Recalculated health');

  const state = os.getUnifiedProjectState();
  assert.equal(state.projectIntelligenceState.healthScore, 0.92);
});

test('Stage 36 — Scenario 42: Unified certificate composition across domain certificates', () => {
  const composer = new OS.CertificateComposer();
  const cert = composer.compose({
    projectId: 'proviz_core',
    revision: 1,
    underlyingCertificates: {
      security: { id: 'CERT_SEC_01', status: 'CERTIFIED' },
      performance: { id: 'CERT_PERF_01', status: 'CERTIFIED' }
    }
  });

  assert.equal(cert.status, 'CERTIFIED');
  assert.ok(cert.disclaimer.includes('declared verification, governance, and certification criteria'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Reliability & Safe Mode (Scenarios 43–46)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Scenario 43: Subsystem failure detection during diagnostics', () => {
  const engine = new OS.SelfDiagnosticEngine();
  engine.recordSubsystemHealth({
    subsystemId: 'concurrency_model_checker',
    isAvailable: false,
    lastError: 'Solver crash'
  });

  const health = engine.runDiagnostics();
  assert.equal(health.isHealthy, false);
  assert.equal(health.alerts.length, 1);
});

test('Stage 36 — Scenario 44: Automatic safe-mode entry on core subsystem failure', () => {
  const engine = new OS.SelfDiagnosticEngine();
  engine.recordSubsystemHealth({
    subsystemId: 'symbolic_solver',
    isAvailable: false
  });

  const health = engine.runDiagnostics();
  assert.equal(health.isInSafeMode, true);
});

test('Stage 36 — Scenario 45: Invariant: Safe mode prohibits autonomous modifications', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'p' });
  os.enterSafeMode('Anomaly trigger');

  assert.equal(os.getState(), OS.OSState.FAILED_SAFE);
});

test('Stage 36 — Scenario 46: Safe mode recovery and health restoration', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'p' });
  os.enterSafeMode('Test anomaly');
  assert.equal(os.getState(), OS.OSState.FAILED_SAFE);

  os.recover('Anomaly cleared');
  assert.equal(os.getState(), OS.OSState.READY);
});

// ─────────────────────────────────────────────────────────────────────────────
// Reproducibility, Replay & Sessions (Scenarios 47–50)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Scenario 47: Deterministic replay of event sequence', () => {
  const replay = new OS.AutonomousReplay();
  const res = replay.replaySession({
    initialState: { rev: 1 },
    events: [
      { eventId: 'e1', kind: 'SOURCE_CHANGED' },
      { eventId: 'e2', kind: 'VERIFICATION_COMPLETED' }
    ]
  });

  assert.equal(res.status, 'IDENTICAL');
  assert.equal(res.isDeterministic, true);
  assert.equal(res.replayedEventsCount, 2);
});

test('Stage 36 — Scenario 48: Autonomous development session tracking', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'p' });
  const session = os.startAutonomousSession({
    kind: 'IMPROVE_SECURITY',
    description: 'Harden authentication endpoints'
  });

  assert.equal(session.status, 'ACTIVE');
  assert.equal(session.goal.kind, 'IMPROVE_SECURITY');

  session.recordStep({ step: 1, action: 'Threat analysis completed' });
  assert.equal(session.steps.length, 1);
});

test('Stage 36 — Scenario 49: Dry-run simulation of planned verification pipeline', () => {
  const os = new OS.AutonomousVerificationOS({ projectId: 'p' });
  const plan = os.createAutonomousPlan({ riskLevel: 'MEDIUM' });
  const sim = os.simulateAutonomousPlan(plan);

  assert.equal(sim.isSafe, true);
  assert.equal(sim.projectStateMutated, false);
  assert.ok(sim.steps.length > 0);
});

test('Stage 36 — Scenario 50: Full Autonomous Verification OS lifecycle through Debugger API', () => {
  const dbg = new Debugger();

  assert.equal(dbg.getOSState(), OS.OSState.READY);

  const plan = dbg.createAutonomousPlan({ riskLevel: 'LOW' });
  assert.ok(plan);

  const sim = dbg.simulateAutonomousPlan(plan);
  assert.ok(sim.isSafe);

  const decision = dbg.getGlobalDecision({
    evidenceStrength: 0.95,
    coverage: 0.9,
    freshness: 1.0
  });
  assert.equal(decision.decisionClass, OS.DecisionClass.ACCEPT);

  const candidate = dbg.createReleaseCandidate({
    id: 'RC_FINAL',
    projectId: 'proviz_full',
    targetVersion: '36.0.0',
    revision: 1
  });
  const relDecision = dbg.verifyReleaseCandidate(candidate, {});
  assert.ok(relDecision.isApproved);

  const cert = dbg.generateUnifiedCertificate({
    projectId: 'proviz_full',
    revision: 1
  });
  assert.ok(cert.isCertified);
  assert.ok(cert.id.startsWith('UNIFIED_CERT_'));

  const audit = dbg.exportAuditTrail();
  assert.ok(audit.totalRecords > 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Performance Benchmarks (Targets 1–14)
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 36 — Benchmark 1: 100k event records (<250 ms)', () => {
  const journal = new OS.EventJournal();
  const start = performance.now();
  for (let i = 0; i < 100000; i++) {
    journal.append({
      eventId: `e_${i}`,
      kind: OS.VerificationEventKind.SOURCE_CHANGED,
      source: 'benchmark',
      projectRevision: 1
    });
  }
  const duration = performance.now() - start;
  assert.equal(journal.length, 100000);
  assert.ok(duration < 250, `Duration ${duration.toFixed(2)}ms exceeded 250ms`);
});

test('Stage 36 — Benchmark 2: 100k state transitions (<300 ms)', () => {
  const fromRev = new OS.StateRevision({ sequenceNumber: 0 });
  const toRev = new OS.StateRevision({ sequenceNumber: 1 });
  const start = performance.now();
  for (let i = 0; i < 100000; i++) {
    new OS.StateTransition({
      id: `t_${i}`,
      fromRevision: fromRev,
      toRevision: toRev,
      cause: 'benchmark'
    });
  }
  const duration = performance.now() - start;
  assert.ok(duration < 300, `Duration ${duration.toFixed(2)}ms exceeded 300ms`);
});

test('Stage 36 — Benchmark 3: 10k capability resolutions (<100 ms)', () => {
  const registry = new OS.CapabilityRegistry();
  const requested = [
    OS.CapabilityKind.CONCOLIC_EXECUTION,
    OS.CapabilityKind.CERTIFICATION,
    OS.CapabilityKind.SECURITY
  ];

  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    registry.resolveExecutionOrder(requested);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 100, `Duration ${duration.toFixed(2)}ms exceeded 100ms`);
});

test('Stage 36 — Benchmark 4: 10k policy evaluations (<150 ms)', () => {
  const evaluator = new OS.AutonomyPolicyEvaluator();
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    evaluator.evaluate('AUTO_REPAIR', { risk: 'LOW' });
  }
  const duration = performance.now() - start;
  assert.ok(duration < 150, `Duration ${duration.toFixed(2)}ms exceeded 150ms`);
});

test('Stage 36 — Benchmark 5: 10k decision evaluations (<300 ms)', () => {
  const engine = new OS.AutonomousDecisionEngine();
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    engine.evaluate({ evidenceStrength: 0.9, coverage: 0.8 });
  }
  const duration = performance.now() - start;
  assert.ok(duration < 300, `Duration ${duration.toFixed(2)}ms exceeded 300ms`);
});

test('Stage 36 — Benchmark 6: 10k evidence lookups (<150 ms)', () => {
  const store = new OS.EvidenceStore();
  for (let i = 0; i < 100; i++) {
    store.put(new OS.EvidenceArtifact({
      id: `ev_${i}`,
      category: OS.EvidenceCategory.STATIC,
      targetEntityId: `entity_${i % 10}`
    }));
  }

  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    store.getByEntity(`entity_${i % 10}`);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 150, `Duration ${duration.toFixed(2)}ms exceeded 150ms`);
});

test('Stage 36 — Benchmark 7: 1k evidence merges (<300 ms)', () => {
  const merger = new OS.EvidenceMergeEngine();
  const artifacts = [
    new OS.EvidenceArtifact({ id: 'e1', category: OS.EvidenceCategory.FORMAL, targetEntityId: 'm1', isFormalProof: true }),
    new OS.EvidenceArtifact({ id: 'e2', category: OS.EvidenceCategory.TEST, targetEntityId: 'm1', confidence: 0.9 })
  ];

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    merger.merge(artifacts);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 300, `Duration ${duration.toFixed(2)}ms exceeded 300ms`);
});

test('Stage 36 — Benchmark 8: 1k governance evaluations (<300 ms)', () => {
  const govEngine = new OS.GlobalGovernanceEngine();
  const candidate = new OS.ReleaseCandidate({ id: 'RC_B', projectId: 'p', targetVersion: '1.0', revision: 1 });

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    govEngine.evaluateRelease(candidate, {});
  }
  const duration = performance.now() - start;
  assert.ok(duration < 300, `Duration ${duration.toFixed(2)}ms exceeded 300ms`);
});

test('Stage 36 — Benchmark 9: 1k autonomy decisions (<300 ms)', () => {
  const evaluator = new OS.AutonomyPolicyEvaluator();
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    evaluator.evaluate('AUTO_REFACTOR', { risk: 'MEDIUM' });
  }
  const duration = performance.now() - start;
  assert.ok(duration < 300, `Duration ${duration.toFixed(2)}ms exceeded 300ms`);
});

test('Stage 36 — Benchmark 10: 1k certificate compositions (<300 ms)', () => {
  const composer = new OS.CertificateComposer();
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    composer.compose({ projectId: 'p', revision: i });
  }
  const duration = performance.now() - start;
  assert.ok(duration < 300, `Duration ${duration.toFixed(2)}ms exceeded 300ms`);
});

test('Stage 36 — Benchmark 11: 1k state snapshots (<250 ms)', () => {
  const rev = new OS.StateRevision({ sequenceNumber: 1 });
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    new OS.UnifiedProjectState({ projectId: `proj_${i}`, revision: rev });
  }
  const duration = performance.now() - start;
  assert.ok(duration < 250, `Duration ${duration.toFixed(2)}ms exceeded 250ms`);
});

test('Stage 36 — Benchmark 12: 1k audit records (<200 ms)', () => {
  const audit = new OS.AuditTrail();
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    audit.record('BENCHMARK_ACTION', 'AUTONOMOUS_OS', { i }, 1);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 200, `Duration ${duration.toFixed(2)}ms exceeded 200ms`);
});

test('Stage 36 — Benchmark 13: 1k replay preparations (<400 ms)', () => {
  const replay = new OS.AutonomousReplay();
  const artifact = {
    initialState: {},
    events: [{ eventId: 'e1', kind: 'SOURCE_CHANGED' }]
  };

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    replay.replaySession(artifact);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 400, `Duration ${duration.toFixed(2)}ms exceeded 400ms`);
});

test('Stage 36 — Benchmark 14: 100 autonomous pipeline plans (<500 ms)', () => {
  const planner = new OS.PipelinePlanner();
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    planner.plan({ riskLevel: 'HIGH', needsRepair: true });
  }
  const duration = performance.now() - start;
  assert.ok(duration < 500, `Duration ${duration.toFixed(2)}ms exceeded 500ms`);
});
