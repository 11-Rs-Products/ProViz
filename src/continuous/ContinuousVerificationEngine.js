/**
 * ContinuousVerificationEngine.js
 * Central coordinator for Stage 34 Continuous Autonomous Verification & Self-Healing Engine.
 */

import { ContinuousVerificationState } from './ContinuousVerificationState.js';
import { ChangeSet } from './ChangeSet.js';
import { ChangeDetector } from './ChangeDetector.js';
import { ChangeClassifier, ChangeCategory } from './ChangeClassifier.js';
import { VerificationObligation, ObligationKind } from './VerificationObligation.js';
import { ObligationGenerator } from './ObligationGenerator.js';
import { ObligationDependencyGraph } from './ObligationDependencyGraph.js';
import { VerificationFreshness } from './VerificationFreshness.js';
import { StalenessAnalyzer } from './StalenessAnalyzer.js';
import { EvidenceInvalidationEngine } from './EvidenceInvalidationEngine.js';
import { ContinuousVerificationPlanner } from './ContinuousVerificationPlanner.js';
import { VerificationTask } from './VerificationTask.js';
import { VerificationTaskStatus } from './VerificationTaskStatus.js';
import { VerificationQueue } from './VerificationQueue.js';
import { VerificationScheduler } from './VerificationScheduler.js';
import { IncrementalVerifier } from './IncrementalVerifier.js';
import { VerificationCache } from './VerificationCache.js';
import { CacheValidator } from './CacheValidator.js';
import { CacheEvictionPolicy } from './CacheEvictionPolicy.js';
import { VerificationRouter } from './VerificationRouter.js';
import { VerificationBarrier } from './VerificationBarrier.js';
import { VerificationPipeline } from './VerificationPipeline.js';
import { FailureCluster } from './FailureCluster.js';
import { VerificationFailureAnalyzer } from './VerificationFailureAnalyzer.js';
import { RootCauseResolver } from './RootCauseResolver.js';
import { RepairCandidateRanker } from './RepairCandidateRanker.js';
import { RepairSafetyGate } from './RepairSafetyGate.js';
import { RepairPlanner } from './RepairPlanner.js';
import { VerificationCheckpoint } from './VerificationCheckpoint.js';
import { RepairHistory } from './RepairHistory.js';
import { VerificationRollbackManager } from './VerificationRollbackManager.js';
import { SelfHealingWorkspace } from './SelfHealingWorkspace.js';
import { VerificationDebtItem } from './VerificationDebt.js';
import { VerificationDebtAnalyzer } from './VerificationDebtAnalyzer.js';
import { VerificationConfidence, EvidenceTier } from './VerificationConfidence.js';
import { ContinuousRegressionAnalyzer } from './ContinuousRegressionAnalyzer.js';
import { CanaryVerifier } from './CanaryVerifier.js';
import { VerificationTriggerMode, VerificationIntensity } from './VerificationMode.js';
import { VerificationBudget } from './VerificationBudget.js';
import { BackgroundVerificationEngine } from './BackgroundVerificationEngine.js';
import { ContinuousFederationCoordinator } from './ContinuousFederationCoordinator.js';
import { ContinuousKnowledgeSynchronizer } from './ContinuousKnowledgeSynchronizer.js';
import { ContinuousDecisionEngine, ContinuousDecisionType } from './ContinuousDecisionEngine.js';
import { VerificationEscalation } from './VerificationEscalation.js';
import { ContinuousCertificate } from './ContinuousCertificate.js';

export class ContinuousVerificationEngine {
  constructor(options = {}) {
    this.options = options;
    this.changeDetector = new ChangeDetector();
    this.changeClassifier = new ChangeClassifier();
    this.obligationGenerator = new ObligationGenerator();
    this.stalenessAnalyzer = new StalenessAnalyzer();
    this.invalidationEngine = new EvidenceInvalidationEngine(this.stalenessAnalyzer);
    this.planner = new ContinuousVerificationPlanner();
    this.queue = new VerificationQueue();
    this.scheduler = new VerificationScheduler({ queue: this.queue });
    this.incrementalVerifier = new IncrementalVerifier();
    this.cache = new VerificationCache();
    this.cacheValidator = new CacheValidator();
    this.cacheEvictionPolicy = new CacheEvictionPolicy();
    this.router = new VerificationRouter();
    this.pipeline = new VerificationPipeline({ router: this.router });
    this.failureAnalyzer = new VerificationFailureAnalyzer();
    this.rootCauseResolver = new RootCauseResolver();
    this.repairRanker = new RepairCandidateRanker();
    this.safetyGate = new RepairSafetyGate();
    this.repairPlanner = new RepairPlanner(this.repairRanker);
    this.rollbackManager = new VerificationRollbackManager();
    this.repairHistory = new RepairHistory();
    this.selfHealingWorkspace = new SelfHealingWorkspace({
      rollbackManager: this.rollbackManager,
      safetyGate: this.safetyGate,
      repairHistory: this.repairHistory
    });
    this.debtAnalyzer = new VerificationDebtAnalyzer();
    this.confidenceAggregator = new VerificationConfidence();
    this.regressionAnalyzer = new ContinuousRegressionAnalyzer();
    this.canaryVerifier = new CanaryVerifier();
    this.budget = new VerificationBudget();
    this.backgroundEngine = new BackgroundVerificationEngine({
      scheduler: this.scheduler,
      budget: this.budget
    });
    this.federationCoordinator = new ContinuousFederationCoordinator(options.federationEngine);
    this.knowledgeSynchronizer = new ContinuousKnowledgeSynchronizer(options.knowledgeGraph);
    this.decisionEngine = new ContinuousDecisionEngine();

    this.state = new ContinuousVerificationState({ sourceRevision: options.sourceRevision || 'initial' });
    this.escalations = [];
    this.certificates = [];
  }

  // --- Change Detection & Classification ---
  detectChanges(prevFiles, currFiles, metadata = {}) {
    return this.changeDetector.detectChanges(prevFiles, currFiles, metadata);
  }

  classifyChange(changeSet) {
    return this.changeClassifier.classify(changeSet);
  }

  // --- Obligation Generation & Planning ---
  generateObligations(changeSet, semanticImpact = {}) {
    const obligations = this.obligationGenerator.generateObligations(changeSet, semanticImpact);
    this.knowledgeSynchronizer.publish('OBLIGATION', obligations);
    return obligations;
  }

  planVerification(obligations, context = {}) {
    const planned = this.planner.plan(obligations, context);
    for (let i = 0; i < planned.length; i++) {
      const task = new VerificationTask({
        id: `task-${Date.now()}-${i + 1}`,
        obligation: planned[i].obligation,
        priority: planned[i].priority
      });
      this.queue.enqueue(task);
    }
    return planned;
  }

  // --- Staleness & Incremental Verification ---
  processEvidenceInvalidation(evidenceList, changeSet, affectedEntities = []) {
    return this.invalidationEngine.processInvalidation(evidenceList, changeSet, affectedEntities);
  }

  computeAffectedScope(changedEntities, dependencyGraph = {}) {
    return this.incrementalVerifier.computeAffectedScope(changedEntities, dependencyGraph);
  }

  // --- Failure Diagnosis & Root Cause ---
  analyzeFailures(failures) {
    const clusters = this.failureAnalyzer.clusterFailures(failures);
    this.knowledgeSynchronizer.publish('FAILURE', clusters);
    return clusters;
  }

  resolveRootCause(cluster, causalGraph = null) {
    return this.rootCauseResolver.resolveRootCause(cluster, causalGraph);
  }

  // --- Autonomous Self-Healing & Repairs ---
  planRepairs(cluster) {
    return this.repairPlanner.planRepairs(cluster);
  }

  stageAndVerifyRepair(revision, files, candidate, validationResults = {}) {
    this.selfHealingWorkspace.initialize(revision, files);
    this.selfHealingWorkspace.stageRepair(candidate, candidate.patch || {});
    const outcome = this.selfHealingWorkspace.commitOrRollback(candidate, validationResults);
    this.knowledgeSynchronizer.publish('REPAIR', outcome);
    return outcome;
  }

  rollbackRepair(checkpointId) {
    return this.rollbackManager.rollback(checkpointId);
  }

  // --- Debt, Confidence & Canary ---
  calculateDebt(debtItems) {
    return this.debtAnalyzer.calculateDebt(debtItems);
  }

  calculateConfidence(evidenceList) {
    return this.confidenceAggregator.aggregate(evidenceList);
  }

  runCanary(obligations, options = {}) {
    return this.canaryVerifier.runCanary(obligations, options);
  }

  // --- Decision & Escalation ---
  evaluateDecision(context = {}) {
    const decision = this.decisionEngine.evaluate(context);
    this.knowledgeSynchronizer.publish('DECISION', decision);
    return decision;
  }

  escalate(escalationOptions) {
    const escalation = new VerificationEscalation(escalationOptions);
    this.escalations.push(escalation);
    this.knowledgeSynchronizer.publish('ESCALATION', escalation);
    return escalation;
  }

  // --- Certification ---
  issueCertificate(options) {
    const cert = new ContinuousCertificate(options);
    this.certificates.push(cert);
    this.knowledgeSynchronizer.publish('CERTIFICATE', cert);
    return cert;
  }

  getState() {
    return this.state;
  }
}
