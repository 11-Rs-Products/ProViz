/**
 * ConcurrencyEngine.js
 * Central orchestration facade for the Universal Distributed, Concurrent & Temporal Verification Engine.
 */

import { ConcurrencyModel } from './ConcurrencyModel.js';
import { ExecutionContext, ContextKind } from './ExecutionContext.js';
import { ConcurrentTask, TaskState } from './ConcurrentTask.js';
import { ConcurrentResource, ResourceKind } from './ConcurrentResource.js';
import { SynchronizationPrimitive, PrimitiveKind } from './SynchronizationPrimitive.js';
import { LockModel } from './LockModel.js';
import { LockOrderGraph } from './LockOrderGraph.js';
import { LockOrderAnalyzer } from './LockOrderAnalyzer.js';
import { HappensBeforeRelation, RelationKind } from './HappensBeforeRelation.js';
import { HappensBeforeGraph } from './HappensBeforeGraph.js';
import { CausalOrderAnalyzer } from './CausalOrderAnalyzer.js';
import { MemoryAccess, AccessKind } from './MemoryAccess.js';
import { AccessConflict, ConflictType } from './AccessConflict.js';
import { SharedStateModel } from './SharedStateModel.js';
import { SharedStateAnalyzer } from './SharedStateAnalyzer.js';
import { RaceAnalyzer } from './RaceAnalyzer.js';
import { AtomicRegion } from './AtomicRegion.js';
import { AtomicityAnalyzer } from './AtomicityAnalyzer.js';
import { ConcurrentOperation } from './LinearizabilityModel.js';
import { LinearizabilityAnalyzer } from './LinearizabilityAnalyzer.js';
import { WaitForGraph, DeadlockCondition } from './DeadlockModel.js';
import { DeadlockAnalyzer } from './DeadlockAnalyzer.js';
import { LivenessProperty, LivenessKind } from './LivenessProperty.js';
import { LivenessAnalyzer } from './LivenessAnalyzer.js';
import { StarvationAnalyzer } from './StarvationAnalyzer.js';
import { TemporalPropertyKind } from './TemporalPropertyKind.js';
import { TemporalProperty } from './TemporalProperty.js';
import { TemporalFormula } from './TemporalFormula.js';
import { TemporalEvaluator } from './TemporalEvaluator.js';
import { TemporalCounterexample } from './TemporalCounterexample.js';
import { DistributedModel } from './DistributedModel.js';
import { MessageModel, DeliverySemantics } from './MessageModel.js';
import { MessageChannel } from './MessageChannel.js';
import { DistributedExecution } from './DistributedExecution.js';
import { ConsistencyModel, ConsistencyKind } from './ConsistencyModel.js';
import { ConsistencyAnalyzer } from './ConsistencyAnalyzer.js';
import { ReplicationAnalyzer } from './ReplicationAnalyzer.js';
import { ConflictResolutionAnalyzer } from './ConflictResolutionAnalyzer.js';
import { DistributedFault, FaultType } from './DistributedFault.js';
import { FaultSchedule } from './FaultSchedule.js';
import { FaultScheduleGenerator } from './FaultScheduleGenerator.js';
import { DistributedFaultAnalyzer } from './DistributedFaultAnalyzer.js';
import { Schedule } from './Schedule.js';
import { ScheduleGenerator } from './ScheduleGenerator.js';
import { ScheduleReducer } from './ScheduleReducer.js';
import { ScheduleExplorer } from './ScheduleExplorer.js';
import { IndependenceAnalyzer } from './IndependenceAnalyzer.js';
import { PartialOrderReducer } from './PartialOrderReducer.js';
import { ConcurrencyCounterexample } from './ConcurrencyCounterexample.js';
import { ConcurrencyMutationEngine, MutationType } from './ConcurrencyMutationEngine.js';
import { ConcurrencyRepairAnalyzer, RepairKind, ConcurrencyRepairCandidate } from './ConcurrencyRepairAnalyzer.js';
import { ConcurrencyKnowledgeSynchronizer } from './ConcurrencyKnowledgeSynchronizer.js';
import { ConcurrencyChangeImpact } from './ConcurrencyChangeImpact.js';
import { ConcurrencyEvidence, EvidenceType } from './ConcurrencyEvidence.js';
import { ConcurrencyCertificate } from './ConcurrencyCertificate.js';
import { ConcurrencyDecision, ConcurrencyDecisionKind } from './ConcurrencyDecision.js';

export class ConcurrencyEngine {
  constructor(options = {}) {
    this.options = options;
    this.lockOrderAnalyzer = new LockOrderAnalyzer();
    this.raceAnalyzer = new RaceAnalyzer();
    this.atomicityAnalyzer = new AtomicityAnalyzer();
    this.linearizabilityAnalyzer = new LinearizabilityAnalyzer();
    this.deadlockAnalyzer = new DeadlockAnalyzer();
    this.livenessAnalyzer = new LivenessAnalyzer();
    this.starvationAnalyzer = new StarvationAnalyzer();
    this.temporalEvaluator = new TemporalEvaluator();
    this.consistencyAnalyzer = new ConsistencyAnalyzer();
    this.replicationAnalyzer = new ReplicationAnalyzer();
    this.conflictResolutionAnalyzer = new ConflictResolutionAnalyzer();
    this.faultScheduleGenerator = new FaultScheduleGenerator();
    this.distributedFaultAnalyzer = new DistributedFaultAnalyzer();
    this.scheduleGenerator = new ScheduleGenerator();
    this.scheduleReducer = new ScheduleReducer();
    this.scheduleExplorer = new ScheduleExplorer();
    this.independenceAnalyzer = new IndependenceAnalyzer();
    this.partialOrderReducer = new PartialOrderReducer();
    this.mutationEngine = new ConcurrencyMutationEngine();
    this.repairAnalyzer = new ConcurrencyRepairAnalyzer();
    this.knowledgeSynchronizer = new ConcurrencyKnowledgeSynchronizer(options.knowledgeGraph);
    this.changeImpactAnalyzer = new ConcurrencyChangeImpact();

    this.appliedRepairs = [];
  }

  // --- Topology & Contexts ---
  createExecutionContext(options) {
    return new ExecutionContext(options);
  }

  createConcurrentTask(options) {
    return new ConcurrentTask(options);
  }

  createConcurrentResource(options) {
    return new ConcurrentResource(options);
  }

  createSynchronizationPrimitive(options) {
    return new SynchronizationPrimitive(options);
  }

  createConcurrencyModel(options) {
    return new ConcurrencyModel(options);
  }

  // --- Happens-Before & Races ---
  createHappensBeforeGraph() {
    return new HappensBeforeGraph();
  }

  createMemoryAccess(options) {
    return new MemoryAccess(options);
  }

  analyzeRaces(accesses, hbGraph) {
    return this.raceAnalyzer.detectRaces(accesses, hbGraph);
  }

  // --- Lock Ordering & Deadlocks ---
  createLockOrderGraph() {
    return new LockOrderGraph();
  }

  analyzeLockCycles(lockGraph) {
    return this.lockOrderAnalyzer.analyzeCycles(lockGraph);
  }

  createWaitForGraph() {
    return new WaitForGraph();
  }

  analyzeDeadlocks(wfg) {
    return this.deadlockAnalyzer.detectDeadlocks(wfg);
  }

  // --- Shared State & Atomicity ---
  createSharedStateModel() {
    return new SharedStateModel();
  }

  createAtomicRegion(options) {
    return new AtomicRegion(options);
  }

  analyzeAtomicity(trace, regions) {
    return this.atomicityAnalyzer.detectViolations(trace, regions);
  }

  // --- Linearizability ---
  createConcurrentOperation(options) {
    return new ConcurrentOperation(options);
  }

  analyzeLinearizability(operations, sequentialSpec) {
    return this.linearizabilityAnalyzer.verify(operations, sequentialSpec);
  }

  // --- Liveness & Starvation ---
  createLivenessProperty(options) {
    return new LivenessProperty(options);
  }

  analyzeLiveness(trace, properties) {
    return this.livenessAnalyzer.verifyLiveness(trace, properties);
  }

  analyzeStarvation(trace, options) {
    return this.starvationAnalyzer.detectStarvation(trace, options);
  }

  // --- Temporal Verification ---
  createTemporalProperty(options) {
    return new TemporalProperty(options);
  }

  evaluateTemporalProperty(property, trace) {
    return this.temporalEvaluator.evaluate(property, trace);
  }

  // --- Distributed & Consistency ---
  createDistributedModel(options) {
    return new DistributedModel(options);
  }

  createMessage(options) {
    return new MessageModel(options);
  }

  createMessageChannel(options) {
    return new MessageChannel(options);
  }

  createConsistencyModel(options) {
    return new ConsistencyModel(options);
  }

  analyzeConsistency(history, consistencyModel) {
    return this.consistencyAnalyzer.verifyConsistency(history, consistencyModel);
  }

  analyzeReplication(replicaStates) {
    return this.replicationAnalyzer.checkConvergence(replicaStates);
  }

  resolveConflicts(updates, strategy) {
    return this.conflictResolutionAnalyzer.resolveUpdates(updates, strategy);
  }

  // --- Fault Scheduling & Resiliency ---
  createDistributedFault(options) {
    return new DistributedFault(options);
  }

  generateFaultSchedules(distModel, options) {
    return this.faultScheduleGenerator.generateSchedules(distModel, options);
  }

  verifyFaultTolerance(model, schedule, workload) {
    return this.distributedFaultAnalyzer.simulateFaults(model, schedule, workload);
  }

  // --- Scheduling & Exploration ---
  generateSchedules(contextEventsMap, options) {
    return this.scheduleGenerator.generateInterleavings(contextEventsMap, options);
  }

  minimizeSchedule(failingSchedule, predicate) {
    return this.scheduleReducer.minimizeSchedule(failingSchedule, predicate);
  }

  exploreSchedules(contextEventsMap, options) {
    return this.scheduleExplorer.explore(contextEventsMap, options);
  }

  // --- Mutations & Repairs ---
  generateMutations(programModel) {
    return this.mutationEngine.generateMutations(programModel);
  }

  generateRepairs(defect) {
    return this.repairAnalyzer.synthesizeRepairs(defect);
  }

  validateRepair(repair, constraints) {
    return this.repairAnalyzer.validateRepair(repair, constraints);
  }

  applyRepair(repair) {
    this.appliedRepairs.push(repair);
    return { applied: true, repairId: repair.id, totalActive: this.appliedRepairs.length };
  }

  rollbackRepair(repairId) {
    const idx = this.appliedRepairs.findIndex(r => r.id === repairId);
    if (idx !== -1) {
      const removed = this.appliedRepairs.splice(idx, 1)[0];
      return { rolledBack: true, repair: removed };
    }
    return { rolledBack: false, reason: 'Repair not found in active list' };
  }

  // --- Knowledge & Impact ---
  assessChangeImpact(change) {
    return this.changeImpactAnalyzer.assessImpact(change);
  }

  publishKnowledge(category, payload) {
    return this.knowledgeSynchronizer.publish(category, payload);
  }

  // --- Certificates & Decisions ---
  issueCertificate(options) {
    const cert = new ConcurrencyCertificate(options);
    this.publishKnowledge('CERTIFICATE', cert);
    return cert;
  }

  decide(options) {
    return new ConcurrencyDecision(options);
  }
}
