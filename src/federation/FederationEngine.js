import { CapabilityRegistry } from './CapabilityRegistry.js';
import { Federation } from './Federation.js';
import { FederationManager } from './FederationManager.js';
import { DelegationEngine } from './DelegationEngine.js';
import { DelegationRequest } from './DelegationRequest.js';
import { AgentHealthMonitor } from './AgentHealthMonitor.js';
import { SolverPortfolio } from './SolverPortfolio.js';
import { CrossValidator } from './CrossValidator.js';
import { EvidenceConsensus } from './EvidenceConsensus.js';
import { EvidenceVote } from './EvidenceVote.js';
import { DisagreementAnalyzer } from './DisagreementAnalyzer.js';
import { FederationEvidenceGraph } from './FederationEvidenceGraph.js';
import { FederatedTask } from './FederatedTask.js';
import { FederatedPlan } from './FederatedPlan.js';
import { FederatedTaskGraph } from './FederatedTaskGraph.js';
import { FederationSession } from './FederationSession.js';
import { ReplicationPlanner } from './ReplicationPolicy.js';
import { FederationRecovery } from './FederationRecovery.js';
import { FederationFailure, FederationFailureType } from './FederationFailure.js';
import { VerificationAgent } from './VerificationAgent.js';
import { VerificationAgentKind } from './VerificationAgentKind.js';
import { AgentTrustLevel } from './AgentTrustLevel.js';

/**
 * Central federation coordinator integrating multi-agent discovery, delegation,
 * portfolio solvers, cross-validation, consensus, and replanning.
 */
export class FederationEngine {
  constructor({
    registry = new CapabilityRegistry(),
    manager = null,
    delegationEngine = null,
    healthMonitor = new AgentHealthMonitor(),
    solverPortfolio = new SolverPortfolio(),
    evidenceGraph = new FederationEvidenceGraph()
  } = {}) {
    this.registry = registry;
    this.federation = new Federation({ registry: this.registry });
    this.manager = manager || new FederationManager(this.registry);
    this.delegationEngine = delegationEngine || new DelegationEngine({ registry: this.registry });
    this.healthMonitor = healthMonitor;
    this.solverPortfolio = solverPortfolio;
    this.evidenceGraph = evidenceGraph;
    this.session = new FederationSession({
      federation: this.federation,
      manager: this.manager,
      healthMonitor: this.healthMonitor,
      delegationEngine: this.delegationEngine,
      evidenceGraph: this.evidenceGraph
    });
    this._checkpoints = new Map();
  }

  registerAgent(agent) {
    return this.manager.addAgent(agent);
  }

  removeAgent(agentId) {
    return this.manager.removeAgent(agentId);
  }

  getAgents() {
    return this.registry.getAgents();
  }

  getAgent(agentId) {
    return this.registry.getAgent(agentId);
  }

  getAgentHealth(agentId) {
    return this.healthMonitor.getHealth(agentId);
  }

  quarantineAgent(agentId, reason) {
    return this.manager.quarantineAgent(agentId, reason);
  }

  restoreAgent(agentId) {
    return this.manager.unquarantineAgent(agentId);
  }

  delegateTask(taskOrRequest) {
    const request = taskOrRequest instanceof DelegationRequest
      ? taskOrRequest
      : new DelegationRequest(taskOrRequest);

    const decision = this.delegationEngine.delegate(request);
    this.session.recordDecision(decision);
    return decision;
  }

  createFederatedPlan({ goalId = 'goal-default', requirements = [] } = {}) {
    const graph = new FederatedTaskGraph();
    const assignments = {};

    for (let i = 0; i < requirements.length; i++) {
      const req = requirements[i];
      const taskId = req.taskId || `task-${i + 1}`;
      const decision = this.delegateTask({
        taskId,
        goalId,
        requiredCapabilities: req.capabilities || req,
        preferredEvidence: req.preferredEvidence
      });

      const assignedAgentId = decision.selectedAgentId;
      assignments[taskId] = assignedAgentId;

      const fedTask = new FederatedTask({
        taskId,
        agentId: assignedAgentId,
        goalId,
        taskKind: req.taskKind || 'STATIC_PROOF',
        inputPayload: req.payload || req,
        dependencies: req.dependencies || []
      });

      graph.addTask(fedTask);
      this.session.addTask(fedTask);
    }

    return new FederatedPlan({
      goalId,
      taskGraph: graph,
      agentAssignments: assignments
    });
  }

  async executeFederatedPlan(plan) {
    const executionOrder = plan.executionOrder;
    const results = [];
    const votes = [];

    for (const task of executionOrder) {
      const agent = this.registry.getAgent(task.agentId);

      // Handle offline or missing agent
      if (!agent || !agent.isAvailable()) {
        const failure = new FederationFailure({
          failureType: FederationFailureType.AGENT_OFFLINE,
          agentId: task.agentId,
          taskId: task.taskId,
          details: { message: `Agent '${task.agentId}' is unavailable` }
        });
        const recovery = FederationRecovery.determineStrategy(failure);
        results.push({ task, status: 'FAILED', failure, recovery });
        continue;
      }

      // Execute simulation/mock for agent
      const startTime = Date.now();
      let res;

      if (agent.kind === VerificationAgentKind.SYMBOLIC_SOLVER || agent.kind === VerificationAgentKind.EXTERNAL_SOLVER) {
        res = this.solverPortfolio.solve(task.inputPayload);
      } else {
        res = {
          agentId: agent.agentId,
          status: 'PROVED',
          evidenceKind: agent.supportedEvidence[0] || 'EMPIRICAL_OBSERVATION',
          confidence: 0.95,
          timeMs: 15
        };
      }

      const elapsed = Date.now() - startTime;
      this.healthMonitor.recordExecution(agent.agentId, {
        success: res.status !== 'ERROR' && res.status !== 'FAILED',
        latencyMs: elapsed,
        evidenceScore: res.confidence || 0.9
      });

      results.push({ task, result: res });

      const vote = new EvidenceVote({
        agentId: agent.agentId,
        evidenceKind: res.evidenceKind || agent.supportedEvidence[0] || 'EMPIRICAL_OBSERVATION',
        trustLevel: agent.trustProfile.trustLevel,
        claim: task.goalId,
        resultStatus: res.status || 'PROVED',
        confidence: res.confidence || 0.95
      });
      votes.push(vote);

      // Provenance Graph recording
      this.evidenceGraph.recordProvenanceChain({
        programId: 'active-program',
        goalId: task.goalId,
        taskId: task.taskId,
        agentId: agent.agentId,
        environmentFingerprint: agent.environmentFingerprint,
        executionId: `exec-${task.taskId}`,
        resultId: `res-${task.taskId}`,
        evidenceId: `ev-${task.taskId}`,
        confidenceScore: vote.confidence
      });
    }

    const consensus = EvidenceConsensus.evaluate(votes);
    return {
      planId: plan.planId,
      results,
      votes,
      consensus
    };
  }

  crossValidateEvidence({ sourceAgentId, validatorAgentId, evidence, validatorResult, scopeMatch = true }) {
    const sourceAgent = this.registry.getAgent(sourceAgentId);
    const validatorAgent = this.registry.getAgent(validatorAgentId);

    const validation = CrossValidator.validate({
      sourceAgent,
      validatorAgent,
      evidence,
      validatorResult,
      scopeMatch
    });

    if (validation.status === 'DISAGREEMENT') {
      const disagreement = DisagreementAnalyzer.analyze({
        agentA: sourceAgent,
        agentB: validatorAgent,
        claim: evidence.claim || 'PROPERTY',
        resultA: evidence.status,
        resultB: validatorResult.status,
        scopeA: evidence.scope || 'GLOBAL',
        scopeB: validatorResult.scope || 'GLOBAL',
        environmentA: sourceAgent?.environmentFingerprint,
        environmentB: validatorAgent?.environmentFingerprint
      });
      this.session.recordConflict(disagreement);
    }

    return validation;
  }

  checkpoint(checkpointId) {
    const id = checkpointId || `cp-${Date.now()}`;
    const snap = this.session.createSnapshot();
    this._checkpoints.set(id, snap);
    return id;
  }

  restoreCheckpoint(checkpointId) {
    const snap = this._checkpoints.get(checkpointId);
    if (!snap) return false;
    this.session.restoreSnapshot(snap);
    return true;
  }

  getTrace() {
    return [...this.session.trace];
  }

  replayTrace(trace = null) {
    const targetTrace = trace || this.session.trace;
    const replayed = [];
    for (const step of targetTrace) {
      replayed.push({
        event: step.event,
        data: step.data,
        replayedAt: Date.now()
      });
    }
    return replayed;
  }
}
