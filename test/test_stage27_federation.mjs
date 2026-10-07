import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  VerificationAgentKind,
  AgentCapability,
  AgentTrustLevel,
  AgentTrustProfile,
  EvidenceAuthority,
  VerificationAgent,
  CapabilityGap,
  CapabilityMatcher,
  CapabilityRegistry,
  FederationMembership,
  Federation,
  FederationManager,
  DelegationRequest,
  DelegationCandidate,
  DelegationDecision,
  DelegationEngine,
  FederatedTask,
  FederatedTaskGraph,
  FederatedPlan,
  SolverBackend,
  LinearSolverBackend,
  SMTSolverBackend,
  BitVectorSolverBackend,
  IntervalSolverBackend,
  ConcreteSearchSolverBackend,
  SolverDisagreement,
  SolverConsensus,
  SolverPortfolio,
  CrossValidationTask,
  CrossValidator,
  EvidenceVote,
  ConsensusPolicy,
  EvidenceConsensus,
  AgentDisagreement,
  DisagreementAnalyzer,
  FederatedEnvironment,
  EnvironmentCompatibility,
  EnvironmentNormalizer,
  EnvironmentDriftDetector,
  LanguageKind,
  LanguageCapability,
  LanguageFederationAdapter,
  CrossLanguageBoundary,
  CrossLanguageEvidence,
  BoundaryVerification,
  AgentHealth,
  AgentHealthMonitor,
  AgentQuarantine,
  FederationFailureType,
  FederationFailure,
  RecoveryStrategy,
  FederationRecovery,
  ReplicationPolicy,
  ReplicationPlanner,
  EvidenceAttestation,
  ResultIntegrityVerifier,
  UntrustedResultPolicy,
  AgentEvidenceNode,
  AgentEvidenceEdge,
  FederationEvidenceGraph,
  AgentPerformanceModel,
  AgentSelectionLearner,
  FederationLearningPolicy,
  FederationOptimizer,
  FederationSnapshot,
  FederationQueries,
  FederationSession,
  FederationEngine
} from '../src/federation/index.js';

import { Debugger } from '../src/debugger/Debugger.js';

describe('Stage 27: Universal Verification Federation & Multi-Engine Coordination Engine', () => {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Agent Model & Trust
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Verification Agent Model & Trust Profiles', () => {
    it('1.1 should define all standard verification agent kinds', () => {
      assert.equal(VerificationAgentKind.STATIC_ANALYZER, 'STATIC_ANALYZER');
      assert.equal(VerificationAgentKind.SYMBOLIC_SOLVER, 'SYMBOLIC_SOLVER');
      assert.equal(VerificationAgentKind.CONCOLIC_ENGINE, 'CONCOLIC_ENGINE');
      assert.equal(VerificationAgentKind.EXTERNAL_SOLVER, 'EXTERNAL_SOLVER');
      assert.ok(Object.keys(VerificationAgentKind).length >= 15);
    });

    it('1.2 should create and validate AgentCapability', () => {
      const cap = new AgentCapability({
        propertyKinds: ['SAFETY', 'LIVENESS'],
        supportedLanguages: ['JAVASCRIPT', 'PYTHON'],
        supportedConstraints: ['LIA', 'LRA']
      });
      assert.ok(cap.supportsProperty('SAFETY'));
      assert.ok(!cap.supportsProperty('SECURITY'));
      assert.ok(cap.supportsLanguage('python'));
      assert.ok(cap.supportsConstraint('LIA'));
    });

    it('1.3 should correctly match capabilities with AgentCapability.matches()', () => {
      const cap = new AgentCapability({
        propertyKinds: ['SAFETY'],
        supportedLanguages: ['JAVASCRIPT']
      });
      assert.ok(cap.matches({ propertyKind: 'SAFETY', language: 'JAVASCRIPT' }));
      assert.ok(!cap.matches({ propertyKind: 'LIVENESS' }));
    });

    it('1.4 should serialize and deserialize AgentCapability', () => {
      const cap = new AgentCapability({ propertyKinds: ['SAFETY'] });
      const json = cap.toJSON();
      const restored = AgentCapability.fromJSON(json);
      assert.deepEqual(restored.propertyKinds, cap.propertyKinds);
    });

    it('1.5 should define AgentTrustLevel hierarchy', () => {
      assert.equal(AgentTrustLevel.FORMAL, 'FORMAL');
      assert.equal(AgentTrustLevel.VERIFIED, 'VERIFIED');
      assert.equal(AgentTrustLevel.TRUSTED, 'TRUSTED');
      assert.equal(AgentTrustLevel.STANDARD, 'STANDARD');
      assert.equal(AgentTrustLevel.EXPERIMENTAL, 'EXPERIMENTAL');
      assert.equal(AgentTrustLevel.UNTRUSTED, 'UNTRUSTED');
    });

    it('1.6 should update AgentTrustProfile upon execution', () => {
      let profile = new AgentTrustProfile({ trustLevel: AgentTrustLevel.TRUSTED });
      profile = profile.recordExecution(true, 0.95);
      assert.equal(profile.totalExecutions, 1);
      assert.equal(profile.successfulExecutions, 1);
      assert.equal(profile.failureRate, 0.0);
      assert.ok(profile.reliabilityScore > 0.8);

      profile = profile.recordExecution(false, 0.2);
      assert.equal(profile.totalExecutions, 2);
      assert.equal(profile.failedExecutions, 1);
      assert.equal(profile.failureRate, 0.5);
    });

    it('1.7 should compute reliabilityScore correctly from multiple attributes', () => {
      const profile = new AgentTrustProfile({
        correctnessHistory: 0.9,
        failureRate: 0.1,
        determinism: 1.0,
        environmentStability: 1.0,
        versionStability: 1.0
      });
      assert.ok(profile.reliabilityScore >= 0.85);
    });

    it('1.8 should enforce EvidenceAuthority permitted evidence types per trust level', () => {
      assert.ok(EvidenceAuthority.canProduceEvidence(AgentTrustLevel.FORMAL, 'FORMAL_PROOF'));
      assert.ok(!EvidenceAuthority.canProduceEvidence(AgentTrustLevel.STANDARD, 'FORMAL_PROOF'));
      assert.ok(EvidenceAuthority.canProduceEvidence(AgentTrustLevel.STANDARD, 'TEST_RESULT'));
      assert.ok(!EvidenceAuthority.canProduceEvidence(AgentTrustLevel.UNTRUSTED, 'FORMAL_PROOF'));
    });

    it('1.9 should sanitize unearned formal evidence assertions from empirical agents', () => {
      const agent = new VerificationAgent({
        agentId: 'empirical-agent-1',
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.STANDARD })
      });
      const claim = { evidenceKind: 'FORMAL_PROOF', theorem: 'x > 0' };
      const sanitized = EvidenceAuthority.sanitizeEvidence(agent, claim);
      assert.equal(sanitized.evidenceKind, 'EMPIRICAL_OBSERVATION');
      assert.ok(sanitized.sanitizedReason);
    });

    it('1.10 should instantiate and freeze immutable VerificationAgent', () => {
      const agent = new VerificationAgent({
        agentId: 'agent-static-1',
        name: 'Static Proof Engine',
        kind: VerificationAgentKind.STATIC_ANALYZER,
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.FORMAL })
      });
      assert.equal(agent.agentId, 'agent-static-1');
      assert.ok(agent.isAvailable());
      assert.throws(() => { agent.agentId = 'modified'; });
    });

    it('1.11 should support wildcard language and property capabilities', () => {
      const cap = new AgentCapability({
        supportedLanguages: ['*'],
        propertyKinds: ['*']
      });
      assert.ok(cap.supportsLanguage('HASKELL'));
      assert.ok(cap.supportsProperty('ARBITRARY_PROPERTY'));
    });

    it('1.12 should transition VerificationAgent availability immutably', () => {
      const agent = new VerificationAgent({ agentId: 'agent-init', availability: 'AVAILABLE' });
      const busy = agent.withAvailability('BUSY');
      assert.equal(busy.availability, 'BUSY');
      assert.equal(agent.availability, 'AVAILABLE');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Capability Registry & Matcher & Gap Discovery
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Capability Registry & Discovery', () => {
    let registry;

    beforeEach(() => {
      registry = new CapabilityRegistry();
      registry.registerAgent(new VerificationAgent({
        agentId: 'static-proof',
        kind: VerificationAgentKind.STATIC_ANALYZER,
        capabilities: new AgentCapability({ propertyKinds: ['SAFETY'], supportedLanguages: ['JAVASCRIPT'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.FORMAL })
      }));
      registry.registerAgent(new VerificationAgent({
        agentId: 'concolic-engine',
        kind: VerificationAgentKind.CONCOLIC_ENGINE,
        capabilities: new AgentCapability({ propertyKinds: ['CRASH', 'SAFETY'], supportedLanguages: ['JAVASCRIPT', 'PYTHON'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.TRUSTED })
      }));
    });

    it('2.1 should register and retrieve agents', () => {
      assert.equal(registry.size, 2);
      assert.ok(registry.getAgent('static-proof'));
      assert.equal(registry.getAgent('unknown'), null);
    });

    it('2.2 should unregister agents', () => {
      const ok = registry.unregisterAgent('static-proof');
      assert.ok(ok);
      assert.equal(registry.size, 1);
    });

    it('2.3 should find capable agents matching requirements', () => {
      const agents = registry.findCapableAgents({ propertyKind: 'SAFETY', language: 'JAVASCRIPT' });
      assert.equal(agents.length, 2);
      assert.equal(agents[0].agentId, 'static-proof'); // Formal rank sorted first
    });

    it('2.4 should find best capable agent', () => {
      const best = registry.findBestAgent({ propertyKind: 'CRASH', language: 'PYTHON' });
      assert.equal(best.agentId, 'concolic-engine');
    });

    it('2.5 should identify CapabilityGap when no agent satisfies requirements', () => {
      const gap = CapabilityMatcher.findGaps({
        goalId: 'floating-point-proof',
        propertyKind: 'FLOATING_POINT_INVARIANT',
        language: 'RUST'
      }, registry.getAgents());

      assert.ok(gap instanceof CapabilityGap);
      assert.ok(gap.missingLanguages.includes('RUST'));
      assert.ok(gap.missingProperties.includes('FLOATING_POINT_INVARIANT'));
    });

    it('2.6 should return null gap when capable agents exist', () => {
      const gap = CapabilityMatcher.findGaps({
        propertyKind: 'SAFETY',
        language: 'JAVASCRIPT'
      }, registry.getAgents());
      assert.equal(gap, null);
    });

    it('2.7 should ignore quarantined agents during capability queries', () => {
      const agent = registry.getAgent('static-proof');
      registry.registerAgent(agent.withAvailability('QUARANTINED'));
      const found = registry.findCapableAgents({ propertyKind: 'SAFETY', language: 'JAVASCRIPT' });
      assert.equal(found.length, 1);
      assert.equal(found[0].agentId, 'concolic-engine');
    });

    it('2.8 should serialize and restore CapabilityRegistry', () => {
      const json = registry.toJSON();
      const restored = CapabilityRegistry.fromJSON(json);
      assert.equal(restored.size, 2);
      assert.ok(restored.getAgent('static-proof'));
    });

    it('2.9 should clear registry completely', () => {
      registry.clear();
      assert.equal(registry.size, 0);
    });

    it('2.10 should calculate match score penalty for environment fingerprint mismatch', () => {
      const agent = registry.getAgent('static-proof');
      const match = CapabilityMatcher.matchAgent(agent, {
        propertyKind: 'SAFETY',
        language: 'JAVASCRIPT',
        environmentFingerprint: 'different-fingerprint'
      });
      assert.ok(match.isMatch);
      assert.ok(match.score < 1.0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Delegation Engine & Multi-Agent Planning
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Delegation Engine & Federated Planning', () => {
    let registry, delegationEngine;

    beforeEach(() => {
      registry = new CapabilityRegistry();
      registry.registerAgent(new VerificationAgent({
        agentId: 'agent-formal',
        name: 'Formal Prover',
        kind: VerificationAgentKind.STATIC_ANALYZER,
        capabilities: new AgentCapability({ propertyKinds: ['SAFETY'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.FORMAL, evidenceQuality: 1.0 })
      }));
      registry.registerAgent(new VerificationAgent({
        agentId: 'agent-empirical',
        name: 'Empirical Tester',
        kind: VerificationAgentKind.TEST_EXECUTOR,
        capabilities: new AgentCapability({ propertyKinds: ['SAFETY'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.STANDARD, evidenceQuality: 0.7 })
      }));
      delegationEngine = new DelegationEngine({ registry });
    });

    it('3.1 should delegate task to the best candidate', () => {
      const req = new DelegationRequest({
        taskId: 'task-1',
        goalId: 'safety-goal',
        requiredCapabilities: { propertyKind: 'SAFETY' }
      });
      const decision = delegationEngine.delegate(req);
      assert.equal(decision.selectedAgentId, 'agent-formal');
      assert.ok(decision.confidence > 0.5);
    });

    it('3.2 should break ties deterministically by agentId', () => {
      const reg = new CapabilityRegistry();
      reg.registerAgent(new VerificationAgent({
        agentId: 'agent-z',
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.STANDARD })
      }));
      reg.registerAgent(new VerificationAgent({
        agentId: 'agent-a',
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.STANDARD })
      }));
      const engine = new DelegationEngine({ registry: reg });
      const dec = engine.delegate(new DelegationRequest({ taskId: 't-1' }));
      assert.equal(dec.selectedAgentId, 'agent-a');
    });

    it('3.3 should return null selectedAgent when no candidate matches', () => {
      const req = new DelegationRequest({
        taskId: 'task-unsupported',
        requiredCapabilities: { propertyKind: 'UNSUPPORTED_PROPERTY' }
      });
      const dec = delegationEngine.delegate(req);
      assert.equal(dec.selectedAgentId, null);
      assert.equal(dec.confidence, 0.0);
    });

    it('3.4 should build FederatedTask and update status immutably', () => {
      const task = new FederatedTask({
        taskId: 'ft-1',
        agentId: 'agent-formal',
        goalId: 'goal-1',
        taskKind: 'STATIC_PROOF'
      });
      const updated = task.withStatus('COMPLETED', { proved: true });
      assert.equal(updated.status, 'COMPLETED');
      assert.equal(task.status, 'PENDING');
      assert.deepEqual(updated.result, { proved: true });
    });

    it('3.5 should construct FederatedTaskGraph and compute topological execution order', () => {
      const graph = new FederatedTaskGraph();
      graph.addTask(new FederatedTask({ taskId: 'task-root' }));
      graph.addTask(new FederatedTask({ taskId: 'task-mid', dependencies: ['task-root'] }));
      graph.addTask(new FederatedTask({ taskId: 'task-leaf', dependencies: ['task-mid'] }));

      const order = graph.getExecutionOrder();
      assert.deepEqual(order.map(t => t.taskId), ['task-root', 'task-mid', 'task-leaf']);
    });

    it('3.6 should detect cycles in FederatedTaskGraph', () => {
      const graph = new FederatedTaskGraph();
      graph.addTask(new FederatedTask({ taskId: 't-a', dependencies: ['t-b'] }));
      graph.addTask(new FederatedTask({ taskId: 't-b', dependencies: ['t-a'] }));
      assert.throws(() => graph.getExecutionOrder(), /Cycle detected/);
    });

    it('3.7 should eliminate duplicate tasks in FederatedTaskGraph', () => {
      const graph = new FederatedTaskGraph();
      graph.addTask(new FederatedTask({ taskId: 't-1', agentId: 'agent-a', taskKind: 'PROOF', inputPayload: { x: 1 } }));
      graph.addTask(new FederatedTask({ taskId: 't-2', agentId: 'agent-a', taskKind: 'PROOF', inputPayload: { x: 1 } }));
      assert.equal(graph.getAllTasks().length, 2);

      const removed = graph.eliminateDuplicates();
      assert.equal(removed.length, 1);
      assert.equal(graph.getAllTasks().length, 1);
    });

    it('3.8 should create and serialize FederatedPlan', () => {
      const graph = new FederatedTaskGraph();
      graph.addTask(new FederatedTask({ taskId: 'task-1', agentId: 'agent-formal' }));
      const plan = new FederatedPlan({
        planId: 'plan-1',
        goalId: 'goal-safety',
        taskGraph: graph,
        agentAssignments: { 'task-1': 'agent-formal' }
      });
      assert.equal(plan.tasks.length, 1);
      const json = plan.toJSON();
      const restored = FederatedPlan.fromJSON(json);
      assert.equal(restored.planId, 'plan-1');
      assert.equal(restored.tasks.length, 1);
    });

    it('3.9 should evaluate candidate scoring breakdown accurately', () => {
      const cand = new DelegationCandidate({
        agent: new VerificationAgent({ agentId: 'test-agent' }),
        capabilityFit: 1.0,
        evidenceQuality: 0.9,
        reliability: 0.95,
        compositeScore: 4.5
      });
      assert.equal(cand.compositeScore, 4.5);
      assert.equal(cand.toJSON().agentId, 'test-agent');
    });

    it('3.10 should prioritize higher composite score over lower score in delegation', () => {
      const reg = new CapabilityRegistry();
      reg.registerAgent(new VerificationAgent({
        agentId: 'high-quality-agent',
        trustProfile: new AgentTrustProfile({ evidenceQuality: 1.0, failureRate: 0.0 })
      }));
      reg.registerAgent(new VerificationAgent({
        agentId: 'low-quality-agent',
        trustProfile: new AgentTrustProfile({ evidenceQuality: 0.2, failureRate: 0.5 })
      }));
      const engine = new DelegationEngine({ registry: reg });
      const dec = engine.delegate(new DelegationRequest({ taskId: 't-score' }));
      assert.equal(dec.selectedAgentId, 'high-quality-agent');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Parallel Solver Federation & Portfolio
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Solver Federation & Portfolio Orchestration', () => {
    let portfolio;

    beforeEach(() => {
      portfolio = new SolverPortfolio([
        new LinearSolverBackend(),
        new SMTSolverBackend(),
        new BitVectorSolverBackend(),
        new IntervalSolverBackend(),
        new ConcreteSearchSolverBackend()
      ]);
    });

    it('4.1 should support built-in solver backends', () => {
      const solvers = portfolio.getSolvers();
      assert.equal(solvers.length, 5);
      assert.ok(solvers.some(s => s.kind === 'LINEAR'));
      assert.ok(solvers.some(s => s.kind === 'SMT'));
      assert.ok(solvers.some(s => s.kind === 'BITVECTOR'));
      assert.ok(solvers.some(s => s.kind === 'INTERVAL'));
    });

    it('4.2 should execute portfolio solve and achieve unanimous consensus', () => {
      const res = portfolio.solve({ theory: 'LIA', x: 10 });
      assert.ok(res.results.length >= 2);
      assert.equal(res.consensus.status, 'UNANIMOUS');
      assert.equal(res.consensus.consensusStatus, 'SAT');
    });

    it('4.3 should identify solver disagreement and preserve contradictory results', () => {
      const mockPortfolio = new SolverPortfolio([
        { backendId: 's1', supports: () => true, solve: () => ({ status: 'SAT', model: { x: 1 } }) },
        { backendId: 's2', supports: () => true, solve: () => ({ status: 'UNSAT', model: null }) }
      ]);
      const res = mockPortfolio.solve({ constraint: 'contradictory-query' });
      assert.equal(res.consensus.status, 'CONFLICTING');
      assert.ok(res.consensus.disagreement instanceof SolverDisagreement);
      assert.deepEqual(res.consensus.disagreement.conflictingStatuses, ['SAT', 'UNSAT']);
    });

    it('4.4 should handle solver error gracefully without crashing portfolio', () => {
      const mockPortfolio = new SolverPortfolio([
        { backendId: 's-err', supports: () => true, solve: () => { throw new Error('Solver crashed'); } },
        { backendId: 's-ok', supports: () => true, solve: () => ({ status: 'SAT' }) }
      ]);
      const res = mockPortfolio.solve({});
      assert.equal(res.results.length, 2);
      assert.equal(res.results[0].status, 'ERROR');
      assert.equal(res.results[1].status, 'SAT');
    });

    it('4.5 should execute portfolio proof query', () => {
      const res = portfolio.prove({ property: 'x > 0' });
      assert.ok(res.results.length > 0);
      assert.equal(res.consensus.consensusStatus, 'PROVED');
    });

    it('4.6 should execute counterexample search on solver backends', () => {
      const backend = new SMTSolverBackend();
      const ce = backend.findCounterexample({ property: 'x < 0' });
      assert.equal(ce.status, 'COUNTEREXAMPLE_FOUND');
      assert.deepEqual(ce.counterexample, { x: -1 });
    });

    it('4.7 should estimate solving complexity', () => {
      const backend = new LinearSolverBackend();
      const est = backend.estimate({ theory: 'LRA' });
      assert.ok(est.estimatedTimeMs > 0);
      assert.ok(est.confidence > 0.5);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Cross-Validation & Evidence Consensus
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Cross-Validation & Consensus', () => {
    it('5.1 should confirm evidence when validator agrees', () => {
      const res = CrossValidator.validate({
        sourceAgent: { kind: 'STATIC_ANALYZER' },
        validatorAgent: { kind: 'SYMBOLIC_SOLVER' },
        evidence: { evidenceKind: 'FORMAL_PROOF', status: 'PROVED' },
        validatorResult: { evidenceKind: 'SYMBOLIC_MODEL', status: 'PROVED' }
      });
      assert.equal(res.status, 'CONFIRMED');
    });

    it('5.2 should uphold formal proof when empirical test disagrees outside scope', () => {
      const res = CrossValidator.validate({
        sourceAgent: { kind: 'STATIC_ANALYZER' },
        validatorAgent: { kind: 'TEST_EXECUTOR' },
        evidence: { evidenceKind: 'FORMAL_PROOF', status: 'PROVED' },
        validatorResult: { evidenceKind: 'TEST_RESULT', status: 'FAIL' },
        scopeMatch: false
      });
      assert.equal(res.status, 'CONFIRMED');
      assert.ok(res.preservedFormalStatus);
    });

    it('5.3 should flag partial confirmation when empirical test anomalies occur within scope', () => {
      const res = CrossValidator.validate({
        sourceAgent: { kind: 'STATIC_ANALYZER' },
        validatorAgent: { kind: 'TEST_EXECUTOR' },
        evidence: { evidenceKind: 'FORMAL_PROOF', status: 'PROVED' },
        validatorResult: { evidenceKind: 'TEST_RESULT', status: 'FAIL' },
        scopeMatch: true
      });
      assert.equal(res.status, 'PARTIALLY_CONFIRMED');
      assert.ok(res.investigationRequired);
    });

    it('5.4 should compute unanimous evidence consensus', () => {
      const votes = [
        new EvidenceVote({ agentId: 'a1', resultStatus: 'PROVED', confidence: 1.0 }),
        new EvidenceVote({ agentId: 'a2', resultStatus: 'PROVED', confidence: 0.9 })
      ];
      const consensus = EvidenceConsensus.evaluate(votes);
      assert.equal(consensus.outcome, 'UNANIMOUS');
      assert.ok(consensus.isSatisfied);
    });

    it('5.5 should enforce FORMAL_DOMINANCE over empirical votes', () => {
      const votes = [
        new EvidenceVote({ agentId: 'formal-prover', evidenceKind: 'FORMAL_PROOF', trustLevel: AgentTrustLevel.FORMAL, resultStatus: 'PROVED' }),
        new EvidenceVote({ agentId: 'empirical-1', evidenceKind: 'TEST_RESULT', trustLevel: AgentTrustLevel.STANDARD, resultStatus: 'FAIL' }),
        new EvidenceVote({ agentId: 'empirical-2', evidenceKind: 'TEST_RESULT', trustLevel: AgentTrustLevel.STANDARD, resultStatus: 'FAIL' })
      ];
      const consensus = EvidenceConsensus.evaluate(votes, ConsensusPolicy.FORMAL_DOMINANCE);
      assert.equal(consensus.outcome, 'FORMAL_DOMINANCE');
      assert.equal(consensus.dominantResult, 'PROVED');
      assert.ok(consensus.formalDominanceApplied);
    });

    it('5.6 should flag CONFLICTING under STRICT_AGREEMENT policy', () => {
      const votes = [
        new EvidenceVote({ agentId: 'a1', resultStatus: 'PROVED' }),
        new EvidenceVote({ agentId: 'a2', resultStatus: 'COUNTEREXAMPLE' })
      ];
      const consensus = EvidenceConsensus.evaluate(votes, ConsensusPolicy.STRICT_AGREEMENT);
      assert.equal(consensus.outcome, 'CONFLICTING');
      assert.ok(!consensus.isSatisfied);
    });

    it('5.7 should return INSUFFICIENT on empty votes', () => {
      const consensus = EvidenceConsensus.evaluate([]);
      assert.equal(consensus.outcome, 'INSUFFICIENT');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Disagreement Analysis
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Disagreement Analysis & Root Cause Classification', () => {
    it('6.1 should classify SCOPE_MISMATCH when analysis scopes differ', () => {
      const diag = DisagreementAnalyzer.analyze({
        agentA: { agentId: 'a1' },
        agentB: { agentId: 'a2' },
        resultA: 'PROVED',
        resultB: 'FAIL',
        scopeA: 'FUNCTION_BAR',
        scopeB: 'GLOBAL'
      });
      assert.equal(diag.classification, 'SCOPE_MISMATCH');
    });

    it('6.2 should classify ENVIRONMENT_MISMATCH when environments differ', () => {
      const diag = DisagreementAnalyzer.analyze({
        agentA: { agentId: 'a1' },
        agentB: { agentId: 'a2' },
        resultA: 'PASS',
        resultB: 'FAIL',
        scopeA: 'GLOBAL',
        scopeB: 'GLOBAL',
        environmentA: { fingerprint: 'node-linux' },
        environmentB: { fingerprint: 'node-windows' }
      });
      assert.equal(diag.classification, 'ENVIRONMENT_MISMATCH');
    });

    it('6.3 should classify SOLVER_DISAGREEMENT between symbolic solvers', () => {
      const diag = DisagreementAnalyzer.analyze({
        agentA: { kind: 'SYMBOLIC_SOLVER' },
        agentB: { kind: 'EXTERNAL_SOLVER' },
        resultA: 'SAT',
        resultB: 'UNSAT'
      });
      assert.equal(diag.classification, 'SOLVER_DISAGREEMENT');
    });

    it('6.4 should classify ORACLE_DISAGREEMENT when oracle engine is involved', () => {
      const diag = DisagreementAnalyzer.analyze({
        agentA: { kind: 'ORACLE_ENGINE' },
        agentB: { kind: 'TEST_EXECUTOR' },
        resultA: 'VIOLATION',
        resultB: 'PASS'
      });
      assert.equal(diag.classification, 'ORACLE_DISAGREEMENT');
    });

    it('6.5 should classify RUNTIME_VARIANCE for dynamic analyzers', () => {
      const diag = DisagreementAnalyzer.analyze({
        agentA: { kind: 'RUNTIME_ANALYZER' },
        agentB: { kind: 'TEST_EXECUTOR' },
        resultA: 'PASS',
        resultB: 'FAIL'
      });
      assert.equal(diag.classification, 'RUNTIME_VARIANCE');
    });

    it('6.6 should classify TRUE_CONTRADICTION for direct logical conflict', () => {
      const diag = DisagreementAnalyzer.analyze({
        agentA: { kind: 'STATIC_ANALYZER' },
        agentB: { kind: 'STATIC_ANALYZER' },
        resultA: 'PROVED',
        resultB: 'REFUTED'
      });
      assert.equal(diag.classification, 'TRUE_CONTRADICTION');
    });

    it('6.7 should classify INSUFFICIENT_INFORMATION when results are missing', () => {
      const diag = DisagreementAnalyzer.analyze({
        agentA: { agentId: 'a1' },
        agentB: { agentId: 'a2' },
        resultA: 'PROVED',
        resultB: null
      });
      assert.equal(diag.classification, 'INSUFFICIENT_INFORMATION');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Environment Federation & Drift Detection
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Environment Federation & Drift Detection', () => {
    it('7.1 should instantiate FederatedEnvironment and compute fingerprint', () => {
      const env = new FederatedEnvironment({
        runtime: 'node',
        runtimeVersion: '20.10.0',
        os: 'darwin',
        architecture: 'arm64'
      });
      assert.ok(env.fingerprint.includes('node-20.10.0'));
      assert.ok(env.fingerprint.includes('darwin-arm64'));
    });

    it('7.2 should evaluate EnvironmentCompatibility', () => {
      const envA = new FederatedEnvironment({ runtime: 'node', os: 'darwin' });
      const envB = new FederatedEnvironment({ runtime: 'node', os: 'darwin' });
      const envC = new FederatedEnvironment({ runtime: 'python', os: 'linux' });

      assert.ok(EnvironmentCompatibility.check(envA, envB).compatible);
      assert.ok(!EnvironmentCompatibility.check(envA, envC).compatible);
    });

    it('7.3 should normalize environments with EnvironmentNormalizer', () => {
      const norm = EnvironmentNormalizer.normalize({ runtime: 'NODE', os: 'DARWIN', arch: 'ARM64' });
      assert.equal(norm.runtime, 'node');
      assert.equal(norm.os, 'darwin');
      assert.equal(norm.architecture, 'arm64');
    });

    it('7.4 should detect environment drift with EnvironmentDriftDetector', () => {
      const env1 = new FederatedEnvironment({ runtimeVersion: '20.0.0', dependencies: { lodash: '4.17.20' } });
      const env2 = new FederatedEnvironment({ runtimeVersion: '22.0.0', dependencies: { lodash: '4.17.21' } });

      const drift = EnvironmentDriftDetector.detectDrift(env1, env2);
      assert.ok(drift.hasDrift);
      assert.ok(drift.driftTypes.includes('RUNTIME_VERSION_DRIFT'));
      assert.ok(drift.driftTypes.includes('DEPENDENCY_DRIFT'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Language Federation & Cross-Language Boundary Verification
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. Language Federation & Cross-Language Boundaries', () => {
    it('8.1 should define LanguageCapability across languages', () => {
      const cap = new LanguageCapability({ languages: [LanguageKind.JAVASCRIPT, LanguageKind.RUST] });
      assert.ok(cap.supportsLanguage('javascript'));
      assert.ok(cap.supportsLanguage('rust'));
      assert.ok(!cap.supportsLanguage('python'));
    });

    it('8.2 should normalize types across languages using LanguageFederationAdapter', () => {
      const adapter = new LanguageFederationAdapter(LanguageKind.RUST);
      assert.equal(adapter.normalizeType('i32'), 'NUMBER');
      assert.equal(adapter.normalizeType('&str'), 'STRING');
      assert.equal(adapter.normalizeType('bool'), 'BOOLEAN');
      assert.equal(adapter.normalizeType('Vec<i32>'), 'ARRAY');
    });

    it('8.3 should verify cross-language boundary successfully when valid', () => {
      const boundary = new CrossLanguageBoundary({
        callerLanguage: 'JAVASCRIPT',
        calleeLanguage: 'RUST',
        functionName: 'compute_hash',
        signature: { params: ['STRING'], returns: 'NUMBER' }
      });
      const verification = BoundaryVerification.verifyBoundary({
        boundary,
        callerTypes: ['STRING'],
        calleeTypes: ['STRING']
      });
      assert.ok(verification.isValid);
    });

    it('8.4 should detect type mismatch across cross-language boundary', () => {
      const boundary = new CrossLanguageBoundary({
        callerLanguage: 'JAVASCRIPT',
        calleeLanguage: 'C++',
        signature: { params: ['NUMBER', 'NUMBER'], returns: 'NUMBER' }
      });
      const verification = BoundaryVerification.verifyBoundary({
        boundary,
        callerTypes: ['NUMBER'], // Only 1 argument provided
        calleeTypes: ['NUMBER', 'NUMBER']
      });
      assert.ok(!verification.isValid);
      assert.ok(verification.mismatches.some(m => m.includes('TYPE_MISMATCH')));
    });

    it('8.5 should detect ownership mismatch across boundary', () => {
      const boundary = new CrossLanguageBoundary({
        callerLanguage: 'JAVASCRIPT',
        calleeLanguage: 'RUST',
        ownershipTransfer: true
      });
      const verification = BoundaryVerification.verifyBoundary({
        boundary,
        callerTypes: [],
        contracts: { callerReleasesOwnership: false }
      });
      assert.ok(!verification.isValid);
      assert.ok(verification.mismatches.some(m => m.includes('OWNERSHIP_MISMATCH')));
    });

    it('8.6 should connect caller and callee proofs via CrossLanguageEvidence', () => {
      const boundary = new CrossLanguageBoundary({
        callerLanguage: 'PYTHON',
        calleeLanguage: 'C++',
        signature: { params: [] }
      });
      const verification = BoundaryVerification.verifyBoundary({ boundary, callerTypes: [] });
      const ev = new CrossLanguageEvidence({
        boundary,
        callerProof: { status: 'PROVED' },
        calleeProof: { status: 'PROVED' },
        boundaryVerification: verification
      });
      assert.ok(ev.isSound);
    });

    it('8.7 should normalize contract pre and post conditions using LanguageFederationAdapter', () => {
      const adapter = new LanguageFederationAdapter('PYTHON');
      const contract = adapter.normalizeContract(['x > 0'], ['result >= x']);
      assert.equal(contract.language, 'PYTHON');
      assert.equal(contract.preconditions.length, 1);
      assert.equal(contract.postconditions.length, 1);
    });

    it('8.8 should normalize execution results with exceptions across language runtimes', () => {
      const adapter = new LanguageFederationAdapter('CPP');
      const res = adapter.normalizeExecutionResult({ error: 'SIGSEGV', trace: [1, 2] });
      assert.equal(res.exception, 'SIGSEGV');
      assert.equal(res.executionTrace.length, 2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Agent Health, Quarantine & Fault Tolerance
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. Agent Health, Quarantine & Fault Tolerance', () => {
    let monitor, quarantine;

    beforeEach(() => {
      monitor = new AgentHealthMonitor();
      quarantine = new AgentQuarantine({ maxFailureRate: 0.4 });
    });

    it('9.1 should track executions and compute health metrics', () => {
      monitor.recordExecution('agent-1', { success: true, latencyMs: 20 });
      monitor.recordExecution('agent-1', { success: true, latencyMs: 30 });
      const health = monitor.getHealth('agent-1');
      assert.ok(health.isHealthy);
      assert.equal(health.failureRate, 0.0);
      assert.equal(health.latencyMs, 25);
    });

    it('9.2 should detect unhealthy agent and recommend quarantine', () => {
      for (let i = 0; i < 5; i++) {
        monitor.recordExecution('flaky-agent', { success: false, latencyMs: 50 });
      }
      const health = monitor.getHealth('flaky-agent');
      assert.ok(!health.isHealthy);
      assert.ok(quarantine.shouldQuarantine(health));
    });

    it('9.3 should quarantine and release agent', () => {
      quarantine.quarantine('flaky-agent', 'High failure rate');
      assert.ok(quarantine.isQuarantined('flaky-agent'));
      assert.equal(quarantine.getQuarantinedAgents().length, 1);

      quarantine.release('flaky-agent');
      assert.ok(!quarantine.isQuarantined('flaky-agent'));
    });

    it('9.4 should determine recovery strategy on agent offline failure', () => {
      const failure = new FederationFailure({
        failureType: FederationFailureType.AGENT_OFFLINE,
        agentId: 'agent-dead'
      });
      const strategy = FederationRecovery.determineStrategy(failure);
      assert.equal(strategy, RecoveryStrategy.REDIRECT);
    });

    it('9.5 should apply recovery by redirecting to fallback agent', () => {
      const failure = new FederationFailure({
        failureType: FederationFailureType.AGENT_OFFLINE,
        agentId: 'agent-dead'
      });
      const fallback = new VerificationAgent({ agentId: 'agent-fallback' });
      const rec = FederationRecovery.applyRecovery({
        failure,
        strategy: RecoveryStrategy.REDIRECT,
        fallbackAgents: [fallback]
      });
      assert.ok(rec.recovered);
      assert.equal(rec.targetAgentId, 'agent-fallback');
    });

    it('9.6 should determine retry strategy on transient timeout', () => {
      const failure = new FederationFailure({
        failureType: FederationFailureType.AGENT_TIMEOUT,
        agentId: 'slow-agent'
      });
      const strategy = FederationRecovery.determineStrategy(failure, 0);
      assert.equal(strategy, RecoveryStrategy.RETRY);

      const strategyAfterRetries = FederationRecovery.determineStrategy(failure, 2);
      assert.equal(strategyAfterRetries, RecoveryStrategy.REDIRECT);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Replicated Verification & Byzantine Resistance
  // ─────────────────────────────────────────────────────────────────────────────
  describe('10. Replicated Verification & Byzantine Resistance', () => {
    it('10.1 should plan replicated verification for HIGH_RISK properties', () => {
      const task = new FederatedTask({ taskId: 'critical-task', agentId: 'agent-1' });
      const agents = [
        new VerificationAgent({ agentId: 'agent-1' }),
        new VerificationAgent({ agentId: 'agent-2' }),
        new VerificationAgent({ agentId: 'agent-3' })
      ];
      const replicas = ReplicationPlanner.planReplication(task, ReplicationPolicy.HIGH_RISK, agents);
      assert.equal(replicas.length, 2);
      assert.ok(replicas.some(r => r.agentId === 'agent-2'));
      assert.ok(replicas.some(r => r.agentId === 'agent-3'));
    });

    it('10.2 should generate and verify EvidenceAttestation', () => {
      const attest = new EvidenceAttestation({
        agentIdentity: 'agent-formal',
        taskFingerprint: 'task-fp-123',
        inputFingerprint: 'input-fp-abc',
        outputFingerprint: 'out-fp-xyz'
      });
      assert.ok(attest.signature.includes('agent-formal'));

      const task = { agentId: 'agent-formal' };
      const res = { status: 'PROVED' };
      const verify = ResultIntegrityVerifier.verify(task, res, attest);
      assert.ok(verify.isValid);
    });

    it('10.3 should detect task-agent attestation mismatch', () => {
      const attest = new EvidenceAttestation({ agentIdentity: 'impostor-agent' });
      const task = { agentId: 'expected-agent' };
      const verify = ResultIntegrityVerifier.verify(task, {}, attest);
      assert.ok(!verify.isValid);
    });

    it('10.4 should quarantine untrusted agent results without corrupting formal goals', () => {
      const untrustedAgent = new VerificationAgent({
        agentId: 'untrusted-1',
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.UNTRUSTED })
      });
      const evalRes = UntrustedResultPolicy.evaluateResult(untrustedAgent, { status: 'PROVED' });
      assert.ok(!evalRes.isAccepted);
      assert.ok(evalRes.isObservable);
      assert.equal(evalRes.quarantinedEvidence.canSatisfyFormalGoal, false);
    });

    it('10.5 should plan random audit replication policy', () => {
      const task = new FederatedTask({ taskId: 'audit-target', agentId: 'agent-1' });
      const agents = [
        new VerificationAgent({ agentId: 'agent-1' }),
        new VerificationAgent({ agentId: 'agent-auditor' })
      ];
      const auditTasks = ReplicationPlanner.planReplication(task, ReplicationPolicy.RANDOM_AUDIT, agents);
      assert.equal(auditTasks.length, 1);
      assert.equal(auditTasks[0].agentId, 'agent-auditor');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Federation Knowledge Graph & Learning
  // ─────────────────────────────────────────────────────────────────────────────
  describe('11. Federation Knowledge Graph & Learning Policies', () => {
    it('11.1 should construct FederationEvidenceGraph with complete provenance chain', () => {
      const graph = new FederationEvidenceGraph();
      graph.recordProvenanceChain({
        programId: 'main-app',
        goalId: 'goal-no-overflow',
        taskId: 'task-bv-solve',
        agentId: 'smt-solver-1',
        environmentFingerprint: 'node-arm64',
        executionId: 'exec-1',
        resultId: 'res-unsat',
        evidenceId: 'ev-no-overflow-proof',
        confidenceScore: 1.0
      });

      assert.equal(graph.getNodes().length, 9);
      assert.equal(graph.getEdges().length, 8);
      assert.ok(graph.getNode('prog-main-app'));
      assert.ok(graph.getNode('agent-smt-solver-1'));
    });

    it('11.2 should train AgentSelectionLearner dynamically from observations', () => {
      const learner = new AgentSelectionLearner();
      learner.recordObservation('agent-a', { success: true, runtimeMs: 25, evidenceQuality: 0.95 });
      learner.recordObservation('agent-a', { success: true, runtimeMs: 35, evidenceQuality: 0.90 });

      const model = learner.getPerformanceModel('agent-a');
      assert.equal(model.sampleCount, 2);
      assert.equal(model.successProbability, 1.0);
      assert.equal(model.expectedRuntimeMs, 30);
      assert.ok(learner.getLearnedScoreBonus('agent-a') > 0.5);
    });

    it('11.3 should prevent learning from altering formal proof semantics', () => {
      const learner = new AgentSelectionLearner();
      assert.throws(() => {
        learner.recordObservation('agent-a', { modifiesProofSemantics: true });
      }, /FederationLearningPolicy violation/);
    });

    it('11.4 should optimize task schedules with FederationOptimizer', () => {
      const tasks = [
        new FederatedTask({ taskId: 't-high', priority: 10 }),
        new FederatedTask({ taskId: 't-low', priority: 2 })
      ];
      const agents = [
        new VerificationAgent({ agentId: 'fast-agent', resourceProfile: { costPerOp: 1, avgLatencyMs: 10 } }),
        new VerificationAgent({ agentId: 'slow-agent', resourceProfile: { costPerOp: 5, avgLatencyMs: 500 } })
      ];
      const schedule = FederationOptimizer.optimizeSchedule(tasks, agents);
      assert.equal(schedule.length, 2);
      assert.equal(schedule[0].taskId, 't-high');
      assert.equal(schedule[0].assignedAgentId, 'fast-agent');
    });

    it('11.5 should serialize and deserialize FederationEvidenceGraph', () => {
      const graph = new FederationEvidenceGraph();
      graph.addNode(new AgentEvidenceNode({ id: 'n1', type: 'AGENT', label: 'Prover' }));
      graph.addEdge(new AgentEvidenceEdge({ from: 'n1', to: 'n2', relation: 'EXECUTES' }));
      const json = graph.toJSON();
      const restored = FederationEvidenceGraph.fromJSON(json);
      assert.equal(restored.getNodes().length, 1);
      assert.equal(restored.getEdges().length, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Federation Session, Checkpoints & Replay
  // ─────────────────────────────────────────────────────────────────────────────
  describe('12. Session, Snapshots, Checkpointing & Replay', () => {
    let engine;

    beforeEach(() => {
      engine = new FederationEngine();
      engine.registerAgent(new VerificationAgent({ agentId: 'agent-1' }));
    });

    it('12.1 should record tasks, decisions, evidence and conflicts in session', () => {
      engine.session.addTask(new FederatedTask({ taskId: 'task-1' }));
      engine.session.recordEvidence({ id: 'ev-1', claim: 'SAFETY' });
      assert.equal(engine.session.tasks.length, 1);
      assert.equal(engine.session.evidence.length, 1);
    });

    it('12.2 should create and restore deterministic snapshot', () => {
      engine.session.addTask(new FederatedTask({ taskId: 'task-snap-1' }));
      const snap = engine.session.createSnapshot();
      assert.ok(snap instanceof FederationSnapshot);
      assert.equal(snap.tasks.length, 1);

      engine.session.tasks = [];
      assert.equal(engine.session.tasks.length, 0);

      engine.session.restoreSnapshot(snap);
      assert.equal(engine.session.tasks.length, 1);
    });

    it('12.3 should create named checkpoint and restore from checkpoint', () => {
      engine.session.addTask(new FederatedTask({ taskId: 'task-cp' }));
      const cpId = engine.checkpoint('checkpoint-alpha');
      assert.equal(cpId, 'checkpoint-alpha');

      engine.session.tasks = [];
      const restored = engine.restoreCheckpoint('checkpoint-alpha');
      assert.ok(restored);
      assert.equal(engine.session.tasks.length, 1);
    });

    it('12.4 should query session state using FederationQueries', () => {
      const q = new FederationQueries(engine.session);
      assert.equal(q.getHealthyAgents().length, 1);
      assert.equal(q.getQuarantinedAgents().length, 0);
    });

    it('12.5 should record and replay execution trace deterministically', () => {
      engine.session.recordTrace('STEP_A', { step: 1 });
      engine.session.recordTrace('STEP_B', { step: 2 });
      const trace = engine.getTrace();
      assert.equal(trace.length, 2);

      const replayed = engine.replayTrace(trace);
      assert.equal(replayed.length, 2);
      assert.equal(replayed[0].event, 'STEP_A');
    });

    it('12.6 should query failed and completed tasks from session', () => {
      const q = new FederationQueries(engine.session);
      engine.session.addTask(new FederatedTask({ taskId: 't-completed', status: 'COMPLETED' }));
      engine.session.addTask(new FederatedTask({ taskId: 't-failed', status: 'FAILED' }));
      assert.equal(q.getCompletedTasks().length, 1);
      assert.equal(q.getFailedTasks().length, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. Twenty Mandatory End-to-End Scenarios
  // ─────────────────────────────────────────────────────────────────────────────
  describe('13. Twenty Mandatory End-to-End Scenarios', () => {
    let engine;

    beforeEach(() => {
      engine = new FederationEngine();
    });

    it('Scenario 1: Capability-based agent selection', () => {
      engine.registerAgent(new VerificationAgent({
        agentId: 'py-agent',
        capabilities: new AgentCapability({ supportedLanguages: ['PYTHON'] })
      }));
      engine.registerAgent(new VerificationAgent({
        agentId: 'js-agent',
        capabilities: new AgentCapability({ supportedLanguages: ['JAVASCRIPT'] })
      }));

      const dec = engine.delegateTask({
        taskId: 't1',
        requiredCapabilities: { language: 'PYTHON' }
      });
      assert.equal(dec.selectedAgentId, 'py-agent');
    });

    it('Scenario 2: Multiple agents capable of the same task', () => {
      engine.registerAgent(new VerificationAgent({
        agentId: 'agent-standard',
        capabilities: new AgentCapability({ propertyKinds: ['SAFETY'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.STANDARD })
      }));
      engine.registerAgent(new VerificationAgent({
        agentId: 'agent-formal',
        capabilities: new AgentCapability({ propertyKinds: ['SAFETY'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.FORMAL })
      }));

      const dec = engine.delegateTask({
        taskId: 't2',
        requiredCapabilities: { propertyKind: 'SAFETY' }
      });
      assert.equal(dec.selectedAgentId, 'agent-formal');
      assert.equal(dec.candidates.length, 2);
    });

    it('Scenario 3: Deterministic delegation tie-breaking', () => {
      engine.registerAgent(new VerificationAgent({
        agentId: 'agent-b',
        capabilities: new AgentCapability({ propertyKinds: ['SAFETY'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.STANDARD })
      }));
      engine.registerAgent(new VerificationAgent({
        agentId: 'agent-a',
        capabilities: new AgentCapability({ propertyKinds: ['SAFETY'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.STANDARD })
      }));

      const dec = engine.delegateTask({ taskId: 't3', requiredCapabilities: { propertyKind: 'SAFETY' } });
      assert.equal(dec.selectedAgentId, 'agent-a');
    });

    it('Scenario 4: Formal solver dominates empirical agents', () => {
      const votes = [
        new EvidenceVote({ agentId: 'smt-solver', evidenceKind: 'FORMAL_PROOF', trustLevel: AgentTrustLevel.FORMAL, resultStatus: 'PROVED' }),
        new EvidenceVote({ agentId: 'fuzzer', evidenceKind: 'TEST_RESULT', trustLevel: AgentTrustLevel.STANDARD, resultStatus: 'FAIL' })
      ];
      const consensus = EvidenceConsensus.evaluate(votes, ConsensusPolicy.FORMAL_DOMINANCE);
      assert.equal(consensus.outcome, 'FORMAL_DOMINANCE');
      assert.equal(consensus.dominantResult, 'PROVED');
    });

    it('Scenario 5: Parallel solver portfolio', () => {
      const portfolio = engine.solverPortfolio;
      const res = portfolio.solve({ theory: 'LIA', x: 5 });
      assert.ok(res.results.length >= 2);
      assert.ok(res.results.some(r => r.solverId === 'linear-solver'));
      assert.ok(res.results.some(r => r.solverId === 'smt-solver'));
    });

    it('Scenario 6: Solver consensus', () => {
      const results = [
        { solverId: 's1', status: 'SAT', model: { x: 1 } },
        { solverId: 's2', status: 'SAT', model: { x: 1 } }
      ];
      const consensus = SolverConsensus.evaluate({ x: 1 }, results);
      assert.equal(consensus.status, 'UNANIMOUS');
      assert.equal(consensus.consensusStatus, 'SAT');
    });

    it('Scenario 7: Solver disagreement preservation', () => {
      const results = [
        { solverId: 's1', status: 'SAT', model: { x: 1 } },
        { solverId: 's2', status: 'UNSAT', model: null }
      ];
      const consensus = SolverConsensus.evaluate({ query: 'hard-constraint' }, results);
      assert.equal(consensus.status, 'CONFLICTING');
      assert.ok(consensus.disagreement);
      assert.deepEqual(consensus.disagreement.conflictingStatuses, ['SAT', 'UNSAT']);
    });

    it('Scenario 8: Cross-validation of a static proof', () => {
      engine.registerAgent(new VerificationAgent({ agentId: 'static-prover', kind: 'STATIC_ANALYZER' }));
      engine.registerAgent(new VerificationAgent({ agentId: 'symbolic-validator', kind: 'SYMBOLIC_SOLVER' }));

      const validation = engine.crossValidateEvidence({
        sourceAgentId: 'static-prover',
        validatorAgentId: 'symbolic-validator',
        evidence: { evidenceKind: 'FORMAL_PROOF', status: 'PROVED' },
        validatorResult: { evidenceKind: 'SYMBOLIC_MODEL', status: 'PROVED' }
      });
      assert.equal(validation.status, 'CONFIRMED');
    });

    it('Scenario 9: Environment mismatch detection', () => {
      const envA = new FederatedEnvironment({ os: 'darwin', runtimeVersion: '20.0.0' });
      const envB = new FederatedEnvironment({ os: 'linux', runtimeVersion: '22.0.0' });
      const diag = DisagreementAnalyzer.analyze({
        agentA: { agentId: 'a1' },
        agentB: { agentId: 'a2' },
        resultA: 'PASS',
        resultB: 'FAIL',
        environmentA: envA,
        environmentB: envB
      });
      assert.equal(diag.classification, 'ENVIRONMENT_MISMATCH');
    });

    it('Scenario 10: Agent failure and reassignment', () => {
      const failure = new FederationFailure({
        failureType: FederationFailureType.AGENT_OFFLINE,
        agentId: 'failed-agent',
        taskId: 'task-10'
      });
      const fallback = new VerificationAgent({ agentId: 'backup-agent' });
      const recovery = FederationRecovery.applyRecovery({
        failure,
        strategy: RecoveryStrategy.REDIRECT,
        fallbackAgents: [fallback]
      });
      assert.ok(recovery.recovered);
      assert.equal(recovery.targetAgentId, 'backup-agent');
    });

    it('Scenario 11: Agent timeout and recovery', () => {
      const failure = new FederationFailure({
        failureType: FederationFailureType.AGENT_TIMEOUT,
        agentId: 'timeout-agent',
        taskId: 'task-11'
      });
      const strat = FederationRecovery.determineStrategy(failure, 0);
      assert.equal(strat, RecoveryStrategy.RETRY);
    });

    it('Scenario 12: Agent quarantine after repeated failures', () => {
      const agent = engine.registerAgent(new VerificationAgent({ agentId: 'bad-agent' }));
      for (let i = 0; i < 5; i++) {
        engine.healthMonitor.recordExecution('bad-agent', { success: false });
      }
      const health = engine.getAgentHealth('bad-agent');
      assert.ok(!health.isHealthy);

      engine.quarantineAgent('bad-agent', 'Consecutive failures');
      const quarantined = engine.getAgent('bad-agent');
      assert.ok(quarantined.isQuarantined());
    });

    it('Scenario 13: High-risk goal replication', () => {
      const task = new FederatedTask({ taskId: 'critical-crypto-proof', agentId: 'agent-1' });
      const available = [
        new VerificationAgent({ agentId: 'agent-1' }),
        new VerificationAgent({ agentId: 'agent-2' }),
        new VerificationAgent({ agentId: 'agent-3' })
      ];
      const replicas = ReplicationPlanner.planReplication(task, ReplicationPolicy.HIGH_RISK, available);
      assert.equal(replicas.length, 2);
    });

    it('Scenario 14: Evidence reuse across agents', () => {
      engine.registerAgent(new VerificationAgent({ agentId: 'agent-source' }));
      engine.session.recordEvidence({ id: 'ev-reusable', claim: 'ARRAY_BOUNDS', status: 'PROVED' });
      const cached = engine.session.evidence.find(e => e.claim === 'ARRAY_BOUNDS');
      assert.ok(cached);
      assert.equal(cached.status, 'PROVED');
    });

    it('Scenario 15: Duplicate federated task elimination', () => {
      const graph = new FederatedTaskGraph();
      graph.addTask(new FederatedTask({ taskId: 't-dup-1', agentId: 'agent-1', taskKind: 'PROOF', inputPayload: { p: 1 } }));
      graph.addTask(new FederatedTask({ taskId: 't-dup-2', agentId: 'agent-1', taskKind: 'PROOF', inputPayload: { p: 1 } }));
      const removed = graph.eliminateDuplicates();
      assert.equal(removed.length, 1);
      assert.equal(graph.getAllTasks().length, 1);
    });

    it('Scenario 16: Cross-language boundary verification', () => {
      const boundary = new CrossLanguageBoundary({
        callerLanguage: 'JAVASCRIPT',
        calleeLanguage: 'RUST',
        functionName: 'native_verify',
        signature: { params: ['NUMBER'], returns: 'BOOLEAN' }
      });
      const verified = BoundaryVerification.verifyBoundary({
        boundary,
        callerTypes: ['NUMBER']
      });
      assert.ok(verified.isValid);
    });

    it('Scenario 17: Untrusted agent result isolation', () => {
      const untrustedAgent = new VerificationAgent({
        agentId: 'untrusted-ai',
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.UNTRUSTED })
      });
      const isolation = UntrustedResultPolicy.evaluateResult(untrustedAgent, { status: 'PROVED', theorem: 'FERMAT' });
      assert.ok(!isolation.isAccepted);
      assert.equal(isolation.quarantinedEvidence.canSatisfyFormalGoal, false);
    });

    it('Scenario 18: Federated checkpoint and resume', () => {
      engine.session.addTask(new FederatedTask({ taskId: 'task-checkpoint-test' }));
      const cpId = engine.checkpoint('cp-scenario-18');
      engine.session.tasks = [];
      assert.equal(engine.session.tasks.length, 0);

      engine.restoreCheckpoint('cp-scenario-18');
      assert.equal(engine.session.tasks.length, 1);
    });

    it('Scenario 19: Deterministic federation replay', () => {
      engine.session.recordTrace('PLAN_CREATED', { planId: 'p-19' });
      engine.session.recordTrace('AGENT_ASSIGNED', { agentId: 'agent-1' });
      const trace = engine.getTrace();
      const replayed = engine.replayTrace(trace);
      assert.equal(replayed.length, 2);
      assert.equal(replayed[0].event, 'PLAN_CREATED');
      assert.equal(replayed[1].event, 'AGENT_ASSIGNED');
    });

    it('Scenario 20: Full End-to-End Pipeline', async () => {
      // 1. Register agents
      engine.registerAgent(new VerificationAgent({
        agentId: 'static-solver',
        kind: VerificationAgentKind.STATIC_ANALYZER,
        capabilities: new AgentCapability({ propertyKinds: ['SAFETY'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.FORMAL })
      }));
      engine.registerAgent(new VerificationAgent({
        agentId: 'dynamic-tester',
        kind: VerificationAgentKind.TEST_EXECUTOR,
        capabilities: new AgentCapability({ propertyKinds: ['SAFETY'] }),
        trustProfile: new AgentTrustProfile({ trustLevel: AgentTrustLevel.STANDARD })
      }));

      // 2. Create federated plan
      const plan = engine.createFederatedPlan({
        goalId: 'e2e-safety-goal',
        requirements: [
          { taskId: 't-static', taskKind: 'STATIC_PROOF', capabilities: { propertyKind: 'SAFETY' } },
          { taskId: 't-dynamic', taskKind: 'TEST_EXECUTION', capabilities: { propertyKind: 'SAFETY' }, dependencies: ['t-static'] }
        ]
      });

      assert.equal(plan.tasks.length, 2);
      assert.equal(plan.executionOrder.map(t => t.taskId)[0], 't-static');

      // 3. Execute federated plan
      const exec = await engine.executeFederatedPlan(plan);
      assert.equal(exec.results.length, 2);
      assert.ok(exec.consensus.isSatisfied);

      // 4. Verify Evidence Graph Provenance
      const graph = engine.evidenceGraph;
      assert.ok(graph.getNodes().length >= 9);
      assert.ok(graph.getNode('goal-e2e-safety-goal'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. Debugger Integration APIs
  // ─────────────────────────────────────────────────────────────────────────────
  describe('14. Debugger Stage 27 Integration APIs', () => {
    let dbg;

    beforeEach(() => {
      dbg = new Debugger();
    });

    it('14.1 should initialize Stage 27 federation engine on Debugger', () => {
      assert.ok(dbg._federationEngine instanceof FederationEngine);
    });

    it('14.2 should register and retrieve agents through Debugger API', () => {
      const agent = new VerificationAgent({ agentId: 'dbg-agent-1' });
      dbg.registerVerificationAgent(agent);
      const agents = dbg.getVerificationAgents();
      assert.equal(agents.length, 1);
      assert.equal(agents[0].agentId, 'dbg-agent-1');
      assert.ok(dbg.getAgentCapabilities('dbg-agent-1'));
    });

    it('14.3 should delegate tasks through Debugger API', () => {
      dbg.registerVerificationAgent(new VerificationAgent({ agentId: 'dbg-agent-solver' }));
      const dec = dbg.delegateVerificationTask({ taskId: 'dbg-t1' });
      assert.equal(dec.selectedAgentId, 'dbg-agent-solver');
      assert.ok(dbg.getDelegationDecision('dbg-t1'));
    });

    it('14.4 should retrieve solver portfolio and evaluate consensus via Debugger API', () => {
      const portfolio = dbg.getSolverPortfolio();
      assert.ok(portfolio instanceof SolverPortfolio);
      const consensus = dbg.getSolverConsensus({ x: 1 }, [{ status: 'SAT' }]);
      assert.equal(consensus.status, 'UNANIMOUS');
    });

    it('14.5 should cross-validate evidence and report conflicts through Debugger API', () => {
      dbg.registerVerificationAgent(new VerificationAgent({ agentId: 'a1', kind: 'STATIC_ANALYZER' }));
      dbg.registerVerificationAgent(new VerificationAgent({ agentId: 'a2', kind: 'STATIC_ANALYZER' }));

      const val = dbg.crossValidateEvidence({
        sourceAgentId: 'a1',
        validatorAgentId: 'a2',
        evidence: { status: 'PROVED' },
        validatorResult: { status: 'REFUTED' }
      });
      assert.equal(val.status, 'DISAGREEMENT');
      assert.equal(dbg.getFederationConflicts().length, 1);
    });

    it('14.6 should quarantine and restore agents via Debugger API', () => {
      dbg.registerVerificationAgent(new VerificationAgent({ agentId: 'quarantine-target' }));
      dbg.quarantineAgent('quarantine-target', 'Flaky behavior');
      assert.equal(dbg.getFederationResourceUsage().quarantinedAgents, 1);

      dbg.restoreAgent('quarantine-target');
      assert.equal(dbg.getFederationResourceUsage().quarantinedAgents, 0);
    });

    it('14.7 should capture snapshot and replay traces via Debugger API', () => {
      const snap = dbg.getFederationSnapshot();
      assert.ok(snap instanceof FederationSnapshot);

      const cpId = dbg.checkpointFederation('dbg-cp');
      assert.equal(cpId, 'dbg-cp');
      assert.ok(dbg.restoreFederation('dbg-cp'));

      const trace = dbg.getFederationTrace();
      assert.ok(Array.isArray(trace));
      const replayed = dbg.replayFederation(trace);
      assert.ok(Array.isArray(replayed));
    });

    it('14.8 should query federated tasks and health metrics via Debugger API', () => {
      dbg.registerVerificationAgent(new VerificationAgent({ agentId: 'dbg-agent-health' }));
      const health = dbg.getFederationHealth();
      assert.ok(health.isHealthy);
      assert.equal(health.quarantinedCount, 0);
      assert.ok(Array.isArray(dbg.getFederatedTasks()));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. Performance Benchmarks
  // ─────────────────────────────────────────────────────────────────────────────
  describe('15. Performance Benchmarks', () => {
    it('15.1 10,000 agent registrations (<100ms)', () => {
      const reg = new CapabilityRegistry();
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        reg.registerAgent(new VerificationAgent({ agentId: `perf-agent-${i}` }));
      }
      const elapsed = Date.now() - start;
      assert.equal(reg.size, 10000);
      assert.ok(elapsed < 100, `Registration took ${elapsed}ms (target <100ms)`);
    });

    it('15.2 10,000 capability queries (<100ms)', () => {
      const reg = new CapabilityRegistry();
      for (let i = 0; i < 50; i++) {
        reg.registerAgent(new VerificationAgent({
          agentId: `perf-agent-${i}`,
          capabilities: new AgentCapability({ propertyKinds: [i % 2 === 0 ? 'SAFETY' : 'LIVENESS'] })
        }));
      }
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        reg.findCapableAgents({ propertyKind: 'SAFETY' });
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 100, `Queries took ${elapsed}ms (target <100ms)`);
    });

    it('15.3 10,000 delegation decisions (<250ms)', () => {
      const reg = new CapabilityRegistry();
      reg.registerAgent(new VerificationAgent({ agentId: 'solver-a' }));
      reg.registerAgent(new VerificationAgent({ agentId: 'solver-b' }));
      const engine = new DelegationEngine({ registry: reg });
      const req = new DelegationRequest({ taskId: 't-perf' });

      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        engine.delegate(req);
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 250, `Delegation took ${elapsed}ms (target <250ms)`);
    });

    it('15.4 10,000 health queries (<100ms)', () => {
      const monitor = new AgentHealthMonitor();
      monitor.recordExecution('agent-h', { success: true });
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        monitor.getHealth('agent-h');
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 100, `Health queries took ${elapsed}ms (target <100ms)`);
    });

    it('15.5 10,000 evidence attestations (<200ms)', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        new EvidenceAttestation({
          agentIdentity: 'prover-perf',
          taskFingerprint: `task-${i}`,
          inputFingerprint: 'in-1',
          outputFingerprint: 'out-1'
        });
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 200, `Attestations took ${elapsed}ms (target <200ms)`);
    });

    it('15.6 10,000 consensus operations (<250ms)', () => {
      const votes = [
        new EvidenceVote({ agentId: 'a1', resultStatus: 'PROVED', confidence: 0.9 }),
        new EvidenceVote({ agentId: 'a2', resultStatus: 'PROVED', confidence: 0.8 })
      ];
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        EvidenceConsensus.evaluate(votes);
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 250, `Consensus took ${elapsed}ms (target <250ms)`);
    });

    it('15.7 1,000 federated plans (<300ms)', () => {
      const engine = new FederationEngine();
      engine.registerAgent(new VerificationAgent({ agentId: 'solver-1' }));
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        engine.createFederatedPlan({
          goalId: `g-${i}`,
          requirements: [{ taskId: `t-${i}`, taskKind: 'PROOF' }]
        });
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 300, `Plan creation took ${elapsed}ms (target <300ms)`);
    });

    it('15.8 1,000 replay operations (<750ms)', () => {
      const engine = new FederationEngine();
      const trace = [
        { event: 'A', data: {} },
        { event: 'B', data: {} },
        { event: 'C', data: {} }
      ];
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        engine.replayTrace(trace);
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 750, `Replay took ${elapsed}ms (target <750ms)`);
    });

    it('15.9 1,000 federation snapshots (<300ms)', () => {
      const engine = new FederationEngine();
      engine.registerAgent(new VerificationAgent({ agentId: 'a-snap' }));
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        engine.session.createSnapshot();
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 300, `Snapshots took ${elapsed}ms (target <300ms)`);
    });
  });
});
