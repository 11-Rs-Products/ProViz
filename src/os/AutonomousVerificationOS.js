/**
 * AutonomousVerificationOS.js
 * Master top-level coordinator for ProViz Autonomous Verification Operating System (Stage 36).
 */

import { OSState } from './OSState.js';
import { OSMode } from './OSMode.js';
import { OSLifecycle } from './OSLifecycle.js';
import { OSRuntime } from './OSRuntime.js';
import { OSConfiguration } from './OSConfiguration.js';
import { OSIdentity } from './OSIdentity.js';
import { OSCapabilities } from './OSCapabilities.js';
import { VerificationEventBus } from './VerificationEventBus.js';
import { VerificationEvent } from './VerificationEvent.js';
import { VerificationEventKind } from './VerificationEventKind.js';
import { ProjectStateCoordinator } from './ProjectStateCoordinator.js';
import { UnifiedProjectState } from './UnifiedProjectState.js';
import { CapabilityRegistry } from './CapabilityRegistry.js';
import { AutonomousVerificationPipeline } from './AutonomousVerificationPipeline.js';
import { AutonomyPolicySet } from './AutonomyPolicySet.js';
import { AutonomyPolicyEvaluator } from './AutonomyPolicyEvaluator.js';
import { ApprovalManager } from './ApprovalManager.js';
import { EscalationManager } from './EscalationManager.js';
import { GlobalResourceBudget, ResourceBudgetManager } from './GlobalResourceBudget.js';
import { AutonomousScheduler } from './AutonomousScheduler.js';
import { VerificationMemory } from './VerificationMemory.js';
import { GlobalKnowledgeCoordinator } from './GlobalKnowledgeCoordinator.js';
import { EvidenceStore, EvidenceMergeEngine, EvidenceFreshnessManager } from './EvidenceStore.js';
import { CertificateComposer, CertificateRegistry, UnifiedCertificate } from './UnifiedCertificate.js';
import { AutonomousDecisionEngine } from './AutonomousDecisionEngine.js';
import { AutonomousRepairController } from './AutonomousRepairController.js';
import { TransactionManager } from './AutonomousTransaction.js';
import { SelfDiagnosticEngine, OSHealth } from './OSHealth.js';
import { GlobalGovernanceEngine, ReleaseCandidate } from './ReleaseCandidate.js';
import { AutonomousSession, AutonomousGoalAnalyzer, SessionGoal } from './AutonomousSession.js';
import { AutonomousLearningEngine } from './AutonomousLearningEngine.js';
import { AuditTrail } from './AuditTrail.js';
import { AutonomousReplay, AutonomousSimulation } from './AutonomousReplay.js';

export class AutonomousVerificationOS {
  /**
   * @param {Object} [options]
   * @param {string} [options.projectId='proviz_project']
   * @param {OSConfiguration} [options.config]
   */
  constructor(options = {}) {
    this.projectId = options.projectId || 'proviz_project';
    this.config = options.config || new OSConfiguration();
    this.identity = new OSIdentity({ clusterId: 'proviz-cluster' });
    this.capabilities = new OSCapabilities();

    // 1. Runtime & Lifecycle
    this.lifecycle = new OSLifecycle(OSState.INITIALIZING);
    this.runtime = new OSRuntime({ lifecycle: this.lifecycle });

    // 2. Events & State
    this.eventBus = new VerificationEventBus();
    this.stateCoordinator = new ProjectStateCoordinator({ projectId: this.projectId });

    // 3. Capabilities & Pipelines
    this.capabilityRegistry = new CapabilityRegistry();
    this.pipeline = new AutonomousVerificationPipeline();

    // 4. Autonomy & Approvals
    this.autonomyPolicySet = new AutonomyPolicySet();
    this.autonomyEvaluator = new AutonomyPolicyEvaluator(this.autonomyPolicySet, this.config.autonomyLevel);
    this.approvalManager = new ApprovalManager();
    this.escalationManager = new EscalationManager();

    // 5. Resources & Scheduling
    this.resourceBudget = new GlobalResourceBudget();
    this.budgetManager = new ResourceBudgetManager(this.resourceBudget);
    this.scheduler = new AutonomousScheduler({ budgetManager: this.budgetManager });

    // 6. Memory & Knowledge
    this.memory = new VerificationMemory();
    this.knowledgeCoordinator = new GlobalKnowledgeCoordinator();

    // 7. Evidence & Certification
    this.evidenceStore = new EvidenceStore();
    this.evidenceMerger = new EvidenceMergeEngine();
    this.freshnessManager = new EvidenceFreshnessManager();
    this.certificateComposer = new CertificateComposer();
    this.certificateRegistry = new CertificateRegistry();

    // 8. Decisions & Repair
    this.decisionEngine = new AutonomousDecisionEngine();
    this.transactionManager = new TransactionManager();
    this.repairController = new AutonomousRepairController({
      transactionManager: this.transactionManager,
      autonomyEvaluator: this.autonomyEvaluator
    });

    // 9. Diagnostics & Safe Mode
    this.diagnosticEngine = new SelfDiagnosticEngine();

    // 10. Governance & Release
    this.governanceEngine = new GlobalGovernanceEngine();

    // 11. Sessions, Learning & Replay
    this.sessions = new Map();
    this.goalAnalyzer = new AutonomousGoalAnalyzer();
    this.learningEngine = new AutonomousLearningEngine();
    this.auditTrail = new AuditTrail();
    this.replay = new AutonomousReplay();
    this.simulation = new AutonomousSimulation();

    // Boot complete
    this.runtime.start();
    this.auditTrail.record('OS_BOOT_COMPLETE', 'AUTONOMOUS_OS', { instanceId: this.identity.instanceId });
  }

  // Runtime Controls
  getState() {
    return this.runtime.state;
  }

  getHealth() {
    return this.diagnosticEngine.runDiagnostics();
  }

  start() {
    this.runtime.start();
  }

  pause() {
    this.runtime.pause();
    this.auditTrail.record('RUNTIME_PAUSED', 'OPERATOR');
  }

  resume() {
    this.runtime.resume();
    this.auditTrail.record('RUNTIME_RESUMED', 'OPERATOR');
  }

  stop() {
    this.runtime.stop();
    this.auditTrail.record('RUNTIME_STOPPED', 'OPERATOR');
  }

  enterSafeMode(reason = 'Operator trigger') {
    this.runtime.enterSafeMode(reason);
    this.auditTrail.record('SAFE_MODE_ENTERED', 'AUTONOMOUS_OS', { reason });
  }

  recover(reason = 'Operator recovery') {
    this.runtime.recover(reason);
    this.auditTrail.record('SAFE_MODE_RECOVERED', 'OPERATOR', { reason });
  }

  // Unified State & Events
  getUnifiedProjectState() {
    return this.stateCoordinator.getState();
  }

  getStateRevision() {
    return this.stateCoordinator.getRevision();
  }

  publishEvent(eventData) {
    const evt = this.eventBus.publish(eventData);
    this.auditTrail.record(`EVENT_${evt.kind}`, evt.source, evt.payload, evt.projectRevision, evt.causationId);
    return evt;
  }

  subscribeEvents(filter, handler) {
    return this.eventBus.subscribe(filter, handler);
  }

  // Capabilities
  getCapabilities() {
    return this.capabilityRegistry.getCapabilities();
  }

  resolveCapabilities(requestedIds) {
    return this.capabilityRegistry.resolveExecutionOrder(requestedIds);
  }

  // Autonomy & Approvals
  setAutonomyLevel(level) {
    this.autonomyEvaluator.setAutonomyLevel(level);
  }

  getAutonomyLevel() {
    return this.autonomyEvaluator.currentAutonomyLevel;
  }

  evaluateAutonomyPermission(operation, context = {}) {
    return this.autonomyEvaluator.evaluate(operation, context);
  }

  requestApproval(requestData) {
    const req = this.approvalManager.createRequest(requestData);
    this.auditTrail.record('APPROVAL_REQUEST_CREATED', 'AUTONOMOUS_OS', req.toJSON());
    return req;
  }

  recordHumanDecision(decisionData) {
    const dec = this.approvalManager.recordDecision(decisionData);
    this.auditTrail.record('HUMAN_DECISION_RECORDED', 'OPERATOR', dec.toJSON());
    return dec;
  }

  // Verification & Decision
  evaluateGlobalDecision(params = {}) {
    const dec = this.decisionEngine.evaluate(params);
    this.auditTrail.record('GLOBAL_DECISION_EVALUATED', 'AUTONOMOUS_OS', dec.toJSON());
    return dec;
  }

  executeAutonomousRepair(finding, candidateRepair, gateContext = {}) {
    return this.repairController.executeRepair(finding, candidateRepair, {
      ...gateContext,
      currentRevision: this.getStateRevision().sequenceNumber,
      stateCoordinator: this.stateCoordinator
    });
  }

  // Certification & Release
  generateUnifiedCertificate(params = {}) {
    const cert = this.certificateComposer.compose({
      projectId: this.projectId,
      revision: this.getStateRevision().sequenceNumber,
      ...params
    });
    this.certificateRegistry.register(cert);
    this.auditTrail.record('CERTIFICATE_ISSUED', 'AUTONOMOUS_OS', cert.toJSON());
    return cert;
  }

  evaluateReleaseCandidate(candidateData, evidenceData = {}) {
    const candidate = candidateData instanceof ReleaseCandidate ? candidateData : new ReleaseCandidate(candidateData);
    const decision = this.governanceEngine.evaluateRelease(candidate, evidenceData);
    this.auditTrail.record('RELEASE_EVALUATED', 'AUTONOMOUS_OS', decision.toJSON());
    return decision;
  }

  // Autonomous Sessions
  startAutonomousSession(goalData) {
    const sessionId = `SESSION_${Date.now()}`;
    const goal = goalData instanceof SessionGoal ? goalData : new SessionGoal(goalData);
    const session = new AutonomousSession({
      sessionId,
      goal,
      startRevision: this.getStateRevision().sequenceNumber
    });
    this.sessions.set(sessionId, session);
    this.auditTrail.record('AUTONOMOUS_SESSION_STARTED', 'OPERATOR', { sessionId, goal: goal.toJSON() });
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  // Pipeline & Planning
  createAutonomousPlan(options = {}) {
    return this.pipeline.planner.plan(options);
  }

  async executeAutonomousPlan(plan, context = {}) {
    return await this.pipeline.executor.execute(plan, context);
  }

  // Replay & Simulation
  replaySession(artifact) {
    return this.replay.replaySession(artifact);
  }

  simulatePlan(plan) {
    return this.simulation.simulate(plan, this.getUnifiedProjectState());
  }

  simulateAutonomousPlan(plan) {
    return this.simulatePlan(plan);
  }

  exportAuditTrail() {
    return this.auditTrail.exportAudit();
  }
}
