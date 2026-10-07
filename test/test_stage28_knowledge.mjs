import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  KnowledgeEntityKind,
  KnowledgeEntity,
  KnowledgeRelationKind,
  KnowledgeEdge,
  KnowledgeGraphIndex,
  VerificationKnowledgeGraph,
  ProvenanceArtifact,
  ProvenanceChain,
  ProvenanceResolver,
  CausalRelationKind,
  CausalLink,
  CausalGraph,
  RootCauseCandidate,
  RootCauseAnalyzer,
  Counterfactual,
  CounterfactualEngine,
  EvidenceDependency,
  EvidenceDependencyGraph,
  KnowledgeChangeKind,
  ImpactStatus,
  KnowledgeChange,
  ImpactPropagation,
  StalenessPropagator,
  SemanticDependency,
  SemanticDependencyAnalyzer,
  KnowledgeConflictKind,
  KnowledgeConflict,
  ConflictExplanation,
  SpecificationLink,
  TraceabilityAnalyzer,
  BehaviorKnowledge,
  BehaviorRelationAnalyzer,
  RegressionKnowledge,
  RegressionKnowledgeAnalyzer,
  VerificationExplanation,
  KnowledgeExplanationEngine,
  KnowledgeQuery,
  KnowledgeQueryEngine,
  KnowledgeGapAnalyzer,
  KnowledgeTaskPlanner,
  KnowledgeMaintenanceEngine,
  KnowledgeSnapshot,
  KnowledgeDiff,
  KnowledgeEngine
} from '../src/knowledge/index.js';

import { Debugger } from '../src/debugger/Debugger.js';

describe('Stage 28: Universal Verification Knowledge Graph, Causal Reasoning & Provenance Engine', () => {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Universal Verification Knowledge Model
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Knowledge Entity Model', () => {
    it('1.1 should define comprehensive KnowledgeEntityKind enums across Stages 1–27', () => {
      assert.equal(KnowledgeEntityKind.PROGRAM, 'PROGRAM');
      assert.equal(KnowledgeEntityKind.STATEMENT, 'STATEMENT');
      assert.equal(KnowledgeEntityKind.PROVING_TASK || KnowledgeEntityKind.VERIFICATION_TASK, 'VERIFICATION_TASK');
      assert.equal(KnowledgeEntityKind.PROOF, 'PROOF');
      assert.equal(KnowledgeEntityKind.COUNTEREXAMPLE, 'COUNTEREXAMPLE');
      assert.equal(KnowledgeEntityKind.MUTANT, 'MUTANT');
      assert.equal(KnowledgeEntityKind.REPAIR, 'REPAIR');
      assert.equal(KnowledgeEntityKind.EVIDENCE, 'EVIDENCE');
      assert.ok(Object.keys(KnowledgeEntityKind).length >= 40);
    });

    it('1.2 should create immutable KnowledgeEntity with complete fields', () => {
      const entity = new KnowledgeEntity({
        id: 'func-sort',
        kind: KnowledgeEntityKind.FUNCTION,
        name: 'quickSort',
        sourceArtifact: 'sort.js',
        sourceLocation: { file: 'sort.js', line: 10, column: 1 },
        creationStage: 1,
        attributes: { pure: true }
      });
      assert.equal(entity.id, 'func-sort');
      assert.equal(entity.kind, 'FUNCTION');
      assert.equal(entity.name, 'quickSort');
      assert.equal(entity.creationStage, 1);
      assert.ok(entity.semanticFingerprint.includes('FUNCTION:quickSort:func-sort'));
      assert.throws(() => { entity.name = 'modified'; });
    });

    it('1.3 should update KnowledgeEntity immutably with withAttribute and withParent', () => {
      const entity = new KnowledgeEntity({ id: 'stmt-1', kind: KnowledgeEntityKind.STATEMENT });
      const updatedAttr = entity.withAttribute('complexity', 5);
      const updatedParent = updatedAttr.withParent('func-main');

      assert.equal(updatedAttr.attributes.complexity, 5);
      assert.equal(entity.attributes.complexity, undefined);
      assert.ok(updatedParent.parentEntities.includes('func-main'));
    });

    it('1.4 should serialize and deserialize KnowledgeEntity accurately', () => {
      const entity = new KnowledgeEntity({
        id: 'proof-101',
        kind: KnowledgeEntityKind.PROOF,
        attributes: { solver: 'Z3', timeMs: 15 }
      });
      const json = entity.toJSON();
      const restored = KnowledgeEntity.fromJSON(json);
      assert.equal(restored.id, entity.id);
      assert.equal(restored.kind, entity.kind);
      assert.deepEqual(restored.attributes, entity.attributes);
    });

    it('1.5 should handle parent entity relationships immutably', () => {
      const e = new KnowledgeEntity({ id: 'child-1', parentEntities: ['parent-a', 'parent-b'] });
      assert.equal(e.parentEntities.length, 2);
      assert.ok(e.parentEntities.includes('parent-a'));
    });

    it('1.6 should record timestamps and creation stage accurately', () => {
      const e = new KnowledgeEntity({ id: 'e-time', creationStage: 24 });
      assert.equal(e.creationStage, 24);
      assert.ok(e.timestamps.created > 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Knowledge Relationships & Edges
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Knowledge Relationship Model & Edges', () => {
    it('2.1 should define semantic KnowledgeRelationKind enums', () => {
      assert.equal(KnowledgeRelationKind.CONTAINS, 'CONTAINS');
      assert.equal(KnowledgeRelationKind.CALLS, 'CALLS');
      assert.equal(KnowledgeRelationKind.DEPENDS_ON, 'DEPENDS_ON');
      assert.equal(KnowledgeRelationKind.DERIVES_FROM, 'DERIVES_FROM');
      assert.equal(KnowledgeRelationKind.PROVES, 'PROVES');
      assert.equal(KnowledgeRelationKind.CAUSES, 'CAUSES');
      assert.equal(KnowledgeRelationKind.INVALIDATES, 'INVALIDATES');
      assert.ok(Object.keys(KnowledgeRelationKind).length >= 30);
    });

    it('2.2 should instantiate KnowledgeEdge and verify temporal validity', () => {
      const edge = new KnowledgeEdge({
        source: 'stmt-1',
        target: 'expr-2',
        relation: KnowledgeRelationKind.CONTAINS,
        confidence: 0.95,
        temporalValidity: { validFrom: Date.now() - 1000, validUntil: Date.now() + 10000 }
      });
      assert.equal(edge.source, 'stmt-1');
      assert.equal(edge.target, 'expr-2');
      assert.ok(edge.isCurrentlyValid());
      assert.equal(edge.confidence, 0.95);
    });

    it('2.3 should serialize and deserialize KnowledgeEdge', () => {
      const edge = new KnowledgeEdge({
        source: 'proof-1',
        target: 'prop-safety',
        relation: KnowledgeRelationKind.PROVES,
        evidenceReferences: ['ev-1', 'ev-2']
      });
      const json = edge.toJSON();
      const restored = KnowledgeEdge.fromJSON(json);
      assert.equal(restored.source, edge.source);
      assert.equal(restored.target, edge.target);
      assert.deepEqual(restored.evidenceReferences, edge.evidenceReferences);
    });

    it('2.4 should detect expired temporal validity on edges', () => {
      const edge = new KnowledgeEdge({
        source: 's',
        target: 't',
        temporalValidity: { validFrom: Date.now() - 5000, validUntil: Date.now() - 1000 }
      });
      assert.equal(edge.isCurrentlyValid(), false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Knowledge Graph Construction & Indexing
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Knowledge Graph Construction & Indexing', () => {
    let graph;

    beforeEach(() => {
      graph = new VerificationKnowledgeGraph();
      graph.addEntity(new KnowledgeEntity({ id: 'file-main', kind: KnowledgeEntityKind.FILE, name: 'main.js' }));
      graph.addEntity(new KnowledgeEntity({ id: 'func-compute', kind: KnowledgeEntityKind.FUNCTION, name: 'compute', sourceArtifact: 'main.js' }));
      graph.addEntity(new KnowledgeEntity({ id: 'stmt-1', kind: KnowledgeEntityKind.STATEMENT, name: 'x = y + 1', sourceArtifact: 'main.js' }));
      graph.addEdge(new KnowledgeEdge({ source: 'file-main', target: 'func-compute', relation: KnowledgeRelationKind.CONTAINS }));
      graph.addEdge(new KnowledgeEdge({ source: 'func-compute', target: 'stmt-1', relation: KnowledgeRelationKind.CONTAINS }));
    });

    it('3.1 should add entities and edges and query neighbors', () => {
      assert.equal(graph.size.entities, 3);
      assert.equal(graph.size.edges, 2);
      const neighbors = graph.getNeighbors('func-compute');
      assert.equal(neighbors.length, 2);
    });

    it('3.2 should compute ancestors and descendants across graph DAG', () => {
      const ancestors = graph.getAncestors('stmt-1');
      assert.equal(ancestors.length, 2);
      assert.ok(ancestors.some(a => a.id === 'func-compute'));
      assert.ok(ancestors.some(a => a.id === 'file-main'));

      const descendants = graph.getDescendants('file-main');
      assert.equal(descendants.length, 2);
      assert.ok(descendants.some(d => d.id === 'stmt-1'));
    });

    it('3.3 should find shortest path between entities', () => {
      const path = graph.findPath('file-main', 'stmt-1');
      assert.deepEqual(path, ['file-main', 'func-compute', 'stmt-1']);
    });

    it('3.4 should query entities and edges by index (kind, file, symbol, relation)', () => {
      const funcs = graph.getEntitiesByKind(KnowledgeEntityKind.FUNCTION);
      assert.equal(funcs.length, 1);
      assert.equal(funcs[0].id, 'func-compute');

      const byFile = graph.getEntitiesByFile('main.js');
      assert.equal(byFile.length, 2);

      const containsEdges = graph.getEdgesByRelation(KnowledgeRelationKind.CONTAINS);
      assert.equal(containsEdges.length, 2);
    });

    it('3.5 should serialize and restore graph completely', () => {
      const json = graph.toJSON();
      const restored = VerificationKnowledgeGraph.fromJSON(json);
      assert.equal(restored.size.entities, 3);
      assert.equal(restored.size.edges, 2);
      assert.ok(restored.getEntity('func-compute'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Cross-Stage Provenance Intelligence
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Cross-Stage Provenance Intelligence', () => {
    let graph, resolver;

    beforeEach(() => {
      graph = new VerificationKnowledgeGraph();
      // Setup complete derivation chain
      graph.addEntity(new KnowledgeEntity({ id: 'stmt-alloc', kind: KnowledgeEntityKind.STATEMENT, creationStage: 1 }));
      graph.addEntity(new KnowledgeEntity({ id: 'cfg-node-5', kind: KnowledgeEntityKind.CONTROL_FLOW_NODE, creationStage: 2 }));
      graph.addEntity(new KnowledgeEntity({ id: 'sym-constraint-1', kind: KnowledgeEntityKind.CONSTRAINT, creationStage: 16 }));
      graph.addEntity(new KnowledgeEntity({ id: 'counterexample-9', kind: KnowledgeEntityKind.COUNTEREXAMPLE, creationStage: 17 }));
      graph.addEntity(new KnowledgeEntity({ id: 'proof-final', kind: KnowledgeEntityKind.PROOF, creationStage: 27 }));

      graph.addEdge(new KnowledgeEdge({ source: 'stmt-alloc', target: 'cfg-node-5', relation: KnowledgeRelationKind.DERIVES_FROM }));
      graph.addEdge(new KnowledgeEdge({ source: 'cfg-node-5', target: 'sym-constraint-1', relation: KnowledgeRelationKind.DERIVES_FROM }));
      graph.addEdge(new KnowledgeEdge({ source: 'sym-constraint-1', target: 'counterexample-9', relation: KnowledgeRelationKind.DERIVES_FROM }));
      graph.addEdge(new KnowledgeEdge({ source: 'counterexample-9', target: 'proof-final', relation: KnowledgeRelationKind.VALIDATES }));

      resolver = new ProvenanceResolver(graph);
    });

    it('4.1 should resolve full cross-stage provenance chain', () => {
      const chain = resolver.resolveChain('proof-final');
      assert.ok(chain instanceof ProvenanceChain);
      assert.equal(chain.targetArtifact.artifactId, 'proof-final');
      assert.equal(chain.links.length, 4);
    });

    it('4.2 should find true origin artifact at earliest stage', () => {
      const chain = resolver.resolveChain('proof-final');
      const origin = chain.getOrigin();
      assert.equal(origin.artifactId, 'stmt-alloc');
      assert.equal(origin.stage, 1);
    });

    it('4.3 should return chronological derivation path', () => {
      const chain = resolver.resolveChain('proof-final');
      const path = chain.getDerivationPath();
      assert.deepEqual(path, ['stmt-alloc', 'cfg-node-5', 'sym-constraint-1', 'counterexample-9', 'proof-final']);
    });

    it('4.4 should filter supporting evidence from provenance chain', () => {
      const chain = resolver.resolveChain('proof-final');
      const evidence = chain.getSupportingEvidence();
      assert.ok(Array.isArray(evidence));
    });

    it('4.5 should compute ancestors and descendants within ProvenanceChain', () => {
      const chain = resolver.resolveChain('proof-final');
      const ancestors = chain.getAncestors();
      assert.equal(ancestors.length, 4);
      assert.equal(chain.getDescendants().length, 0);
    });

    it('4.6 should handle single-entity provenance gracefully', () => {
      const g = new VerificationKnowledgeGraph();
      g.addEntity(new KnowledgeEntity({ id: 'isolated-node' }));
      const r = new ProvenanceResolver(g);
      const chain = r.resolveChain('isolated-node');
      assert.equal(chain.getOrigin().artifactId, 'isolated-node');
      assert.equal(chain.links.length, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Causal Reasoning & Root Cause Analysis
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Causal Reasoning & Root Cause Analysis', () => {
    let causalGraph, analyzer;

    beforeEach(() => {
      causalGraph = new CausalGraph();
      // Multi-step causal chain:
      // spec_gap -> unvalidated_precondition -> unexpected_input -> branch_skipped -> missing_init -> null_deref
      causalGraph.addLink(new CausalLink({ causeId: 'spec_gap', effectId: 'unvalidated_precondition', causalStrength: 1.0 }));
      causalGraph.addLink(new CausalLink({ causeId: 'unvalidated_precondition', effectId: 'unexpected_input', causalStrength: 0.95 }));
      causalGraph.addLink(new CausalLink({ causeId: 'unexpected_input', effectId: 'branch_skipped', causalStrength: 0.90 }));
      causalGraph.addLink(new CausalLink({ causeId: 'branch_skipped', effectId: 'missing_init', causalStrength: 0.85 }));
      causalGraph.addLink(new CausalLink({ causeId: 'missing_init', effectId: 'null_deref', causalStrength: 0.90 }));

      analyzer = new RootCauseAnalyzer(causalGraph);
    });

    it('5.1 should traverse multi-step causal chain backwards', () => {
      const chain = causalGraph.getCausalChain('null_deref');
      assert.deepEqual(chain, ['spec_gap', 'unvalidated_precondition', 'unexpected_input', 'branch_skipped', 'missing_init', 'null_deref']);
    });

    it('5.2 should analyze root cause and rank primary candidate trigger', () => {
      const analysis = analyzer.analyze('null_deref');
      assert.equal(analysis.targetEffect, 'null_deref');
      assert.ok(analysis.candidates.length >= 4);
      assert.ok(analysis.primaryCause);
      assert.ok(analysis.explanation.includes('spec_gap') || analysis.explanation.includes('null_deref'));
    });

    it('5.3 should calculate candidate score accurately with confounding risk penalty', () => {
      const candidate = new RootCauseCandidate({
        entityId: 'unvalidated_input',
        causalStrength: 0.9,
        evidenceSupport: 0.9,
        coverage: 1.0,
        temporalConsistency: 1.0,
        confoundingRisk: 0.1
      });
      assert.ok(candidate.score > 0.7);
      assert.equal(candidate.toJSON().entityId, 'unvalidated_input');
    });

    it('5.4 should serialize and deserialize CausalGraph accurately', () => {
      const json = causalGraph.toJSON();
      const restored = CausalGraph.fromJSON(json);
      assert.equal(restored.getCauses('null_deref').length, 1);
    });

    it('5.5 should handle root-cause analysis on effects with no causes', () => {
      const emptyAnalyzer = new RootCauseAnalyzer(new CausalGraph());
      const res = emptyAnalyzer.analyze('unlinked_effect');
      assert.equal(res.candidates.length, 0);
      assert.equal(res.primaryCause, null);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Counterfactual Reasoning
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Counterfactual Reasoning Engine', () => {
    let cfEngine;

    beforeEach(() => {
      cfEngine = new CounterfactualEngine();
    });

    it('6.1 should simulate branch condition counterfactual', () => {
      const cf = cfEngine.simulateCounterfactual({
        targetEntityId: 'branch-stmt-10',
        changedAssumption: 'input != null',
        baselineOutcome: { crashed: true, error: 'NullPointerException' }
      });
      assert.ok(cf instanceof Counterfactual);
      assert.equal(cf.changedAssumption, 'input != null');
      assert.equal(cf.counterfactualOutcome.findingResolved, true);
      assert.ok(cf.confidence >= 0.9);
    });

    it('6.2 should support custom simulation functions for repair hypotheses', () => {
      const cf = cfEngine.simulateCounterfactual({
        targetEntityId: 'patch-candidate-1',
        changedAssumption: 'repaired_with_bounds_check',
        simulationFn: ({ changedAssumption }) => ({
          synthesizedResult: 'PASS',
          testsPassed: 10,
          hypothesis: changedAssumption
        })
      });
      assert.equal(cf.counterfactualOutcome.synthesizedResult, 'PASS');
      assert.equal(cf.counterfactualOutcome.testsPassed, 10);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Evidence Dependency & Invalidation Propagation
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Evidence Dependencies & Invalidation Propagation', () => {
    let depGraph, stalenessPropagator;

    beforeEach(() => {
      depGraph = new EvidenceDependencyGraph();
      // ev-spec -> ev-test -> ev-proof -> ev-goal
      depGraph.addDependency(new EvidenceDependency({ sourceEvidenceId: 'ev-spec', targetEvidenceId: 'ev-test', dependencyType: 'SUPPORTS' }));
      depGraph.addDependency(new EvidenceDependency({ sourceEvidenceId: 'ev-test', targetEvidenceId: 'ev-proof', dependencyType: 'SUPPORTS' }));
      depGraph.addDependency(new EvidenceDependency({ sourceEvidenceId: 'ev-proof', targetEvidenceId: 'ev-goal', dependencyType: 'SUPPORTS' }));

      stalenessPropagator = new StalenessPropagator(depGraph);
    });

    it('7.1 should compute evidence dependency closure', () => {
      const closure = depGraph.getDependencyClosure('ev-goal');
      assert.equal(closure.length, 3);
      assert.ok(closure.includes('ev-proof'));
      assert.ok(closure.includes('ev-test'));
      assert.ok(closure.includes('ev-spec'));
    });

    it('7.2 should propagate invalidation downstream monotonically', () => {
      const impact = stalenessPropagator.markChanged('ev-spec');
      assert.ok(stalenessPropagator.isInvalid('ev-spec'));
      assert.ok(stalenessPropagator.isStale('ev-test'));
      assert.ok(stalenessPropagator.isStale('ev-proof'));
      assert.ok(stalenessPropagator.isStale('ev-goal'));
    });

    it('7.3 should restore validity upon reverification', () => {
      stalenessPropagator.markChanged('ev-spec');
      stalenessPropagator.reverify('ev-test');
      assert.ok(!stalenessPropagator.isStale('ev-test'));
    });

    it('7.4 should compute ImpactPropagation across knowledge graph', () => {
      const kg = new VerificationKnowledgeGraph();
      kg.addEntity(new KnowledgeEntity({ id: 'src-file', kind: 'FILE' }));
      kg.addEntity(new KnowledgeEntity({ id: 'proof-a', kind: 'PROOF' }));
      kg.addEdge(new KnowledgeEdge({ source: 'src-file', target: 'proof-a', relation: KnowledgeRelationKind.PROVES }));

      const change = new KnowledgeChange({ changeKind: KnowledgeChangeKind.SOURCE_CHANGED, targetEntityId: 'src-file' });
      const impact = ImpactPropagation.propagateImpact(change, kg);
      assert.equal(impact.impactedEntities.get('proof-a'), ImpactStatus.INVALID);
    });

    it('7.5 should retrieve contradictions from EvidenceDependencyGraph', () => {
      const g = new EvidenceDependencyGraph();
      g.addDependency(new EvidenceDependency({ sourceEvidenceId: 'ev-a', targetEvidenceId: 'ev-b', dependencyType: 'CONTRADICTS' }));
      const contradictions = g.getContradictions('ev-a');
      assert.equal(contradictions.length, 1);
      assert.equal(contradictions[0], 'ev-b');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Semantic Dependencies & Specification Traceability
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. Semantic Dependencies & Specification Traceability', () => {
    let kg, traceAnalyzer;

    beforeEach(() => {
      kg = new VerificationKnowledgeGraph();
      kg.addEntity(new KnowledgeEntity({ id: 'spec-login', kind: KnowledgeEntityKind.SPECIFICATION, name: 'User Authentication' }));
      kg.addEntity(new KnowledgeEntity({ id: 'func-auth', kind: KnowledgeEntityKind.FUNCTION, name: 'authenticate' }));
      kg.addEntity(new KnowledgeEntity({ id: 'test-auth', kind: KnowledgeEntityKind.TEST, name: 'testAuthSuccess' }));
      kg.addEntity(new KnowledgeEntity({ id: 'ev-auth-proof', kind: KnowledgeEntityKind.EVIDENCE, name: 'authProof' }));

      kg.addEdge(new KnowledgeEdge({ source: 'spec-login', target: 'func-auth', relation: KnowledgeRelationKind.CONTAINS }));
      kg.addEdge(new KnowledgeEdge({ source: 'func-auth', target: 'test-auth', relation: KnowledgeRelationKind.COVERS }));
      kg.addEdge(new KnowledgeEdge({ source: 'test-auth', target: 'ev-auth-proof', relation: KnowledgeRelationKind.VALIDATES }));

      traceAnalyzer = new TraceabilityAnalyzer(kg);
    });

    it('8.1 should perform forward traceability from specification to code, tests and evidence', () => {
      const trace = traceAnalyzer.getTraceability('spec-login');
      assert.equal(trace.specificationId, 'spec-login');
      assert.equal(trace.implementationArtifacts.length, 1);
      assert.equal(trace.tests.length, 1);
      assert.equal(trace.evidence.length, 1);
    });

    it('8.2 should perform backward traceability from implementation to specifications', () => {
      const specs = traceAnalyzer.getAffectedSpecifications('func-auth');
      assert.equal(specs.length, 1);
      assert.equal(specs[0].id, 'spec-login');
    });

    it('8.3 should analyze semantic proof assumptions using SemanticDependencyAnalyzer', () => {
      kg.addEntity(new KnowledgeEntity({ id: 'inv-bound', kind: KnowledgeEntityKind.INVARIANT }));
      kg.addEntity(new KnowledgeEntity({ id: 'proof-safe', kind: KnowledgeEntityKind.PROOF }));
      kg.addEdge(new KnowledgeEdge({ source: 'inv-bound', target: 'proof-safe', relation: KnowledgeRelationKind.SUPPORTS }));

      const analyzer = new SemanticDependencyAnalyzer(kg);
      const assumptions = analyzer.getProofAssumptions('proof-safe');
      assert.equal(assumptions.length, 1);
      assert.equal(assumptions[0].id, 'inv-bound');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Behavioral Knowledge & Conflict Analysis
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. Behavioral Knowledge & Conflict Analysis', () => {
    it('9.1 should compare behavior knowledge for equivalence or divergence', () => {
      const behA = new BehaviorKnowledge({
        behaviorId: 'b1',
        outputSignature: { status: 200 },
        stateTransitions: [1, 2]
      });
      const behB = new BehaviorKnowledge({
        behaviorId: 'b2',
        outputSignature: { status: 200 },
        stateTransitions: [1, 2]
      });
      const behC = new BehaviorKnowledge({
        behaviorId: 'b3',
        outputSignature: { status: 500 }
      });

      assert.equal(BehaviorRelationAnalyzer.compareBehaviors(behA, behB).relation, 'EQUIVALENT');
      assert.equal(BehaviorRelationAnalyzer.compareBehaviors(behA, behC).relation, 'BEHAVIORAL_DIVERGENCE');
    });

    it('9.2 should analyze and explain knowledge conflicts', () => {
      const conflict = new KnowledgeConflict({
        conflictKind: KnowledgeConflictKind.SCOPE_CONFLICT,
        entityAId: 'proof-local',
        entityBId: 'test-global',
        claim: 'NO_OVERFLOW',
        scopeA: 'FUNCTION_LOCAL',
        scopeB: 'GLOBAL_SYSTEM'
      });
      const explanation = ConflictExplanation.explain(conflict);
      assert.equal(explanation.kind, 'SCOPE_CONFLICT');
      assert.ok(explanation.summary.includes('Scope proof boundaries'));
    });

    it('9.3 should compute regression knowledge impact score', () => {
      const regr = RegressionKnowledgeAnalyzer.analyzeRegression({
        changedBehaviors: ['b1'],
        brokenDependencies: ['d1'],
        invalidatedEvidence: ['e1'],
        specificationDrift: ['s1'],
        riskIncrease: 0.2
      });
      assert.ok(regr.impactScore > 5.0);
      assert.equal(regr.toJSON().changedBehaviors.length, 1);
    });

    it('9.4 should detect behavioral refinement when transitions expand cleanly', () => {
      const beh1 = new BehaviorKnowledge({ outputSignature: { res: 1 }, stateTransitions: [1] });
      const beh2 = new BehaviorKnowledge({ outputSignature: { res: 1 }, stateTransitions: [1, 2] });
      const res = BehaviorRelationAnalyzer.compareBehaviors(beh1, beh2);
      assert.equal(res.relation, 'REFINEMENT');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Verification Explanations & Query Engine
  // ─────────────────────────────────────────────────────────────────────────────
  describe('10. Verification Explanations & Query Engine', () => {
    let engine;

    beforeEach(() => {
      engine = new KnowledgeEngine();
      engine.addEntity(new KnowledgeEntity({ id: 'prop-safety', kind: KnowledgeEntityKind.PROPERTY, name: 'Memory Safety' }));
      engine.addEntity(new KnowledgeEntity({ id: 'ev-proof-1', kind: KnowledgeEntityKind.EVIDENCE, name: 'SMT Proof #1' }));
      engine.addEdge(new KnowledgeEdge({ source: 'ev-proof-1', target: 'prop-safety', relation: KnowledgeRelationKind.PROVES }));
    });

    it('10.1 should generate explanations in multiple styles (SUMMARY, CAUSAL, EVIDENCE, DEBUGGER, DETAILED)', () => {
      const expSummary = engine.explain('prop-safety', 'SUMMARY');
      const expCausal = engine.explain('prop-safety', 'CAUSAL');
      const expEvidence = engine.explain('prop-safety', 'EVIDENCE');
      const expDebugger = engine.explain('prop-safety', 'DEBUGGER');

      assert.ok(expSummary.text.includes('Memory Safety'));
      assert.ok(expCausal.text.includes('causally derived'));
      assert.ok(expEvidence.text.includes('Evidence basis'));
      assert.ok(expDebugger.text.includes('[ProViz Knowledge Debugger]'));
    });

    it('10.2 should execute declarative KnowledgeQueryEngine queries', () => {
      const query = new KnowledgeQuery({
        queryKind: 'FIND_EVIDENCE',
        targetEntityId: 'prop-safety'
      });
      const results = engine.query(query);
      assert.equal(results.length, 1);
      assert.equal(results[0].id, 'ev-proof-1');
    });

    it('10.3 should detect knowledge gaps (unsupported claims, orphan evidence)', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'prop-unproved', kind: KnowledgeEntityKind.PROPERTY }));
      const gaps = engine.findGaps();
      assert.ok(gaps.some(g => g.gapKind === 'UNSUPPORTED_CLAIM' && g.entityId === 'prop-unproved'));
    });

    it('10.4 should plan verification tasks from knowledge gaps', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'prop-unproved-2', kind: KnowledgeEntityKind.PROPERTY }));
      const goals = engine.planTasksFromGaps();
      assert.ok(goals.length > 0);
      assert.ok(goals.some(g => g.targetEntityId === 'prop-unproved-2'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Twenty-Four Mandatory End-to-End Scenarios
  // ─────────────────────────────────────────────────────────────────────────────
  describe('11. Twenty-Four Mandatory End-to-End Scenarios', () => {
    let engine;

    beforeEach(() => {
      engine = new KnowledgeEngine();
    });

    it('Scenario 1: Build graph from source program', () => {
      const prog = engine.addEntity(new KnowledgeEntity({ id: 'prog-1', kind: KnowledgeEntityKind.PROGRAM }));
      const file = engine.addEntity(new KnowledgeEntity({ id: 'file-1', kind: KnowledgeEntityKind.FILE }));
      engine.addEdge(new KnowledgeEdge({ source: 'prog-1', target: 'file-1', relation: KnowledgeRelationKind.CONTAINS }));
      assert.equal(engine.getNeighbors('prog-1').length, 1);
    });

    it('Scenario 2: Link execution trace to source', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'stmt-1', kind: KnowledgeEntityKind.STATEMENT }));
      engine.addEntity(new KnowledgeEntity({ id: 'trace-step-4', kind: KnowledgeEntityKind.TRACE }));
      engine.addEdge(new KnowledgeEdge({ source: 'stmt-1', target: 'trace-step-4', relation: KnowledgeRelationKind.EXECUTES }));
      assert.equal(engine.findPath('stmt-1', 'trace-step-4').length, 2);
    });

    it('Scenario 3: Link symbolic proof to constraints', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'constraint-1', kind: KnowledgeEntityKind.CONSTRAINT }));
      engine.addEntity(new KnowledgeEntity({ id: 'proof-z3', kind: KnowledgeEntityKind.PROOF }));
      engine.addEdge(new KnowledgeEdge({ source: 'constraint-1', target: 'proof-z3', relation: KnowledgeRelationKind.DERIVES_FROM }));
      assert.equal(engine.getNeighbors('constraint-1').length, 1);
    });

    it('Scenario 4: Link generated test to counterexample', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'cx-1', kind: KnowledgeEntityKind.COUNTEREXAMPLE }));
      engine.addEntity(new KnowledgeEntity({ id: 'test-gen-1', kind: KnowledgeEntityKind.TEST }));
      engine.addEdge(new KnowledgeEdge({ source: 'cx-1', target: 'test-gen-1', relation: KnowledgeRelationKind.DERIVES_FROM }));
      assert.equal(engine.getNeighbors('cx-1').length, 1);
    });

    it('Scenario 5: Link mutation to surviving behavior', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'mutant-1', kind: KnowledgeEntityKind.MUTANT }));
      engine.addEntity(new KnowledgeEntity({ id: 'beh-survivor', kind: KnowledgeEntityKind.BEHAVIOR }));
      engine.addEdge(new KnowledgeEdge({ source: 'mutant-1', target: 'beh-survivor', relation: KnowledgeRelationKind.OBSERVES }));
      assert.equal(engine.getNeighbors('mutant-1').length, 1);
    });

    it('Scenario 6: Link repair to affected evidence', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'repair-1', kind: KnowledgeEntityKind.REPAIR }));
      engine.addEntity(new KnowledgeEntity({ id: 'ev-repaired', kind: KnowledgeEntityKind.EVIDENCE }));
      engine.addEdge(new KnowledgeEdge({ source: 'repair-1', target: 'ev-repaired', relation: KnowledgeRelationKind.VALIDATES }));
      assert.equal(engine.getNeighbors('repair-1').length, 1);
    });

    it('Scenario 7: Trace evidence back to source', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'src-stmt', kind: KnowledgeEntityKind.STATEMENT, creationStage: 1 }));
      engine.addEntity(new KnowledgeEntity({ id: 'ev-final', kind: KnowledgeEntityKind.EVIDENCE, creationStage: 24 }));
      engine.addEdge(new KnowledgeEdge({ source: 'src-stmt', target: 'ev-final', relation: KnowledgeRelationKind.DERIVES_FROM }));
      const chain = engine.resolveProvenance('ev-final');
      assert.equal(chain.getOrigin().artifactId, 'src-stmt');
    });

    it('Scenario 8: Trace a finding to its root inputs', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'input-raw', kind: KnowledgeEntityKind.TEST_INPUT, creationStage: 18 }));
      engine.addEntity(new KnowledgeEntity({ id: 'find-null', kind: KnowledgeEntityKind.FINDING, creationStage: 19 }));
      engine.addEdge(new KnowledgeEdge({ source: 'input-raw', target: 'find-null', relation: KnowledgeRelationKind.CAUSES }));
      const chain = engine.resolveProvenance('find-null');
      assert.equal(chain.getOrigin().artifactId, 'input-raw');
    });

    it('Scenario 9: Trace specification -> implementation -> test -> evidence', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'spec-1', kind: KnowledgeEntityKind.SPECIFICATION }));
      engine.addEntity(new KnowledgeEntity({ id: 'func-impl', kind: KnowledgeEntityKind.FUNCTION }));
      engine.addEntity(new KnowledgeEntity({ id: 'test-unit', kind: KnowledgeEntityKind.TEST }));
      engine.addEntity(new KnowledgeEntity({ id: 'ev-cert', kind: KnowledgeEntityKind.EVIDENCE }));

      engine.addEdge(new KnowledgeEdge({ source: 'spec-1', target: 'func-impl', relation: KnowledgeRelationKind.CONTAINS }));
      engine.addEdge(new KnowledgeEdge({ source: 'func-impl', target: 'test-unit', relation: KnowledgeRelationKind.COVERS }));
      engine.addEdge(new KnowledgeEdge({ source: 'test-unit', target: 'ev-cert', relation: KnowledgeRelationKind.VALIDATES }));

      const trace = engine.traceabilityAnalyzer.getTraceability('spec-1');
      assert.equal(trace.implementationArtifacts.length, 1);
      assert.equal(trace.tests.length, 1);
      assert.equal(trace.evidence.length, 1);
    });

    it('Scenario 10: Detect orphan evidence', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'ev-orphan', kind: KnowledgeEntityKind.EVIDENCE }));
      const gaps = engine.findGaps();
      assert.ok(gaps.some(g => g.gapKind === 'ORPHAN_EVIDENCE' && g.entityId === 'ev-orphan'));
    });

    it('Scenario 11: Root-cause analysis', () => {
      engine.addCausalLink(new CausalLink({ causeId: 'missing_check', effectId: 'buffer_overflow' }));
      const res = engine.analyzeRootCause('buffer_overflow');
      assert.equal(res.primaryCause.entityId, 'missing_check');
    });

    it('Scenario 12: Multi-step causal chain', () => {
      engine.addCausalLink(new CausalLink({ causeId: 'c1', effectId: 'c2' }));
      engine.addCausalLink(new CausalLink({ causeId: 'c2', effectId: 'c3' }));
      const chain = engine.getCausalChain('c3');
      assert.deepEqual(chain, ['c1', 'c2', 'c3']);
    });

    it('Scenario 13: Conflicting causal hypotheses', () => {
      engine.addCausalLink(new CausalLink({ causeId: 'hypo-a', effectId: 'crash', causalStrength: 0.9 }));
      engine.addCausalLink(new CausalLink({ causeId: 'hypo-b', effectId: 'crash', causalStrength: 0.4 }));
      const res = engine.analyzeRootCause('crash');
      assert.equal(res.primaryCause.entityId, 'hypo-a');
    });

    it('Scenario 14: Necessary vs contributing condition analysis', () => {
      const link = new CausalLink({
        causeId: 'mutex_unlocked',
        effectId: 'data_race',
        causalKind: CausalRelationKind.NECESSARY_CONDITION
      });
      assert.equal(link.causalKind, 'NECESSARY_CONDITION');
    });

    it('Scenario 15: Branch-condition counterfactual', () => {
      const cf = engine.simulateCounterfactual({
        targetEntityId: 'branch-1',
        changedAssumption: 'index < length'
      });
      assert.ok(cf.counterfactualOutcome.findingResolved);
    });

    it('Scenario 16: Repair counterfactual', () => {
      const cf = engine.simulateCounterfactual({
        targetEntityId: 'patch-1',
        changedAssumption: 'without_patch_1'
      });
      assert.ok(cf.hypothesisId);
    });

    it('Scenario 17: Mutation counterfactual', () => {
      const cf = engine.simulateCounterfactual({
        targetEntityId: 'mutant-1',
        changedAssumption: 'mutant_killed'
      });
      assert.ok(cf.hypothesisId);
    });

    it('Scenario 18: Specification counterfactual', () => {
      const cf = engine.simulateCounterfactual({
        targetEntityId: 'spec-contract',
        changedAssumption: 'strengthened_postcondition'
      });
      assert.ok(cf.hypothesisId);
    });

    it('Scenario 19: Source change invalidates proof', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'src-code', kind: 'STATEMENT' }));
      engine.addEntity(new KnowledgeEntity({ id: 'proof-target', kind: 'PROOF' }));
      engine.addEdge(new KnowledgeEdge({ source: 'src-code', target: 'proof-target', relation: KnowledgeRelationKind.PROVES }));

      const change = new KnowledgeChange({ changeKind: KnowledgeChangeKind.SOURCE_CHANGED, targetEntityId: 'src-code' });
      const impact = engine.propagateChange(change);
      assert.equal(impact.impactedEntities.get('proof-target'), ImpactStatus.INVALID);
    });

    it('Scenario 20: Specification change invalidates tests', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'spec-req', kind: 'SPECIFICATION' }));
      engine.addEntity(new KnowledgeEntity({ id: 'test-case', kind: 'TEST' }));
      engine.addEdge(new KnowledgeEdge({ source: 'spec-req', target: 'test-case', relation: KnowledgeRelationKind.DEPENDS_ON }));

      const change = new KnowledgeChange({ changeKind: KnowledgeChangeKind.SPECIFICATION_CHANGED, targetEntityId: 'spec-req' });
      const impact = engine.propagateChange(change);
      assert.equal(impact.impactedEntities.get('test-case'), ImpactStatus.STALE);
    });

    it('Scenario 21: Environment change invalidates runtime evidence', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'env-node-18', kind: 'ENVIRONMENT' }));
      engine.addEntity(new KnowledgeEntity({ id: 'ev-perf', kind: 'EVIDENCE' }));
      engine.addEdge(new KnowledgeEdge({ source: 'env-node-18', target: 'ev-perf', relation: KnowledgeRelationKind.DEPENDS_ON }));

      const change = new KnowledgeChange({ changeKind: KnowledgeChangeKind.ENVIRONMENT_CHANGED, targetEntityId: 'env-node-18' });
      const impact = engine.propagateChange(change);
      assert.equal(impact.impactedEntities.get('ev-perf'), ImpactStatus.STALE);
    });

    it('Scenario 22: Repair invalidates previous behavioral evidence', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'patch-applied', kind: 'PATCH' }));
      engine.addEntity(new KnowledgeEntity({ id: 'beh-old', kind: 'BEHAVIOR' }));
      engine.addEdge(new KnowledgeEdge({ source: 'patch-applied', target: 'beh-old', relation: KnowledgeRelationKind.DERIVES_FROM }));

      const change = new KnowledgeChange({ changeKind: KnowledgeChangeKind.PATCH_APPLIED, targetEntityId: 'patch-applied' });
      const impact = engine.propagateChange(change);
      assert.equal(impact.impactedEntities.get('beh-old'), ImpactStatus.INVALID);
    });

    it('Scenario 23: Stage 25 planning from a knowledge gap', () => {
      engine.addEntity(new KnowledgeEntity({ id: 'prop-target-gap', kind: KnowledgeEntityKind.PROPERTY }));
      const goals = engine.planTasksFromGaps();
      assert.ok(goals.some(g => g.targetEntityId === 'prop-target-gap'));
    });

    it('Scenario 24: Complete autonomous knowledge cycle', () => {
      // 1. Add program entities
      engine.addEntity(new KnowledgeEntity({ id: 'prog-full', kind: KnowledgeEntityKind.PROGRAM }));
      engine.addEntity(new KnowledgeEntity({ id: 'prop-full', kind: KnowledgeEntityKind.PROPERTY }));

      // 2. Discover gap
      const gaps = engine.findGaps();
      assert.ok(gaps.length > 0);

      // 3. Plan task
      const plannedGoals = engine.planTasksFromGaps();
      assert.ok(plannedGoals.length > 0);

      // 4. Resolve proof and update knowledge
      engine.addEntity(new KnowledgeEntity({ id: 'proof-solved', kind: KnowledgeEntityKind.PROOF }));
      engine.addEdge(new KnowledgeEdge({ source: 'proof-solved', target: 'prop-full', relation: KnowledgeRelationKind.PROVES }));

      // 5. Verify explanation
      const exp = engine.explain('prop-full', 'EVIDENCE');
      assert.ok(exp.text.includes('Evidence basis'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Debugger API Extensions
  // ─────────────────────────────────────────────────────────────────────────────
  describe('12. Debugger Stage 28 Integration APIs', () => {
    let dbg;

    beforeEach(() => {
      dbg = new Debugger();
    });

    it('12.1 should initialize Stage 28 KnowledgeEngine on Debugger', () => {
      assert.ok(dbg._knowledgeEngine instanceof KnowledgeEngine);
    });

    it('12.2 should add entities, edges and query neighbors via Debugger API', () => {
      dbg.addKnowledgeEntity(new KnowledgeEntity({ id: 'dbg-node-1', kind: 'FUNCTION' }));
      dbg.addKnowledgeEntity(new KnowledgeEntity({ id: 'dbg-node-2', kind: 'STATEMENT' }));
      dbg.addKnowledgeEdge(new KnowledgeEdge({ source: 'dbg-node-1', target: 'dbg-node-2', relation: 'CONTAINS' }));

      assert.equal(dbg.getKnowledgeEntities().length, 2);
      assert.equal(dbg.getKnowledgeNeighbors('dbg-node-1').length, 1);
    });

    it('12.3 should resolve provenance and origin through Debugger API', () => {
      dbg.addKnowledgeEntity(new KnowledgeEntity({ id: 'src-origin', creationStage: 1 }));
      dbg.addKnowledgeEntity(new KnowledgeEntity({ id: 'ev-target', creationStage: 25 }));
      dbg.addKnowledgeEdge(new KnowledgeEdge({ source: 'src-origin', target: 'ev-target', relation: 'DERIVES_FROM' }));

      const origin = dbg.getArtifactOrigin('ev-target');
      assert.equal(origin.artifactId, 'src-origin');
    });

    it('12.4 should query causal graph and root cause candidates via Debugger API', () => {
      dbg.addCausalLink(new CausalLink({ causeId: 'init_failed', effectId: 'null_pointer' }));
      const chain = dbg.getCausalChain('null_pointer');
      assert.deepEqual(chain, ['init_failed', 'null_pointer']);

      const candidates = dbg.getRootCauseCandidates('null_pointer');
      assert.equal(candidates.length, 1);
    });

    it('12.5 should execute counterfactual and retrieve results via Debugger API', () => {
      const cf = dbg.runCounterfactual({ targetEntityId: 'branch-4', changedAssumption: 'x > 0' });
      assert.ok(cf.hypothesisId);
      const retrieved = dbg.getCounterfactualResult(cf.hypothesisId);
      assert.equal(retrieved.hypothesisId, cf.hypothesisId);
    });

    it('12.6 should capture snapshot, checkpoint, restore and diff via Debugger API', () => {
      dbg.addKnowledgeEntity(new KnowledgeEntity({ id: 'snap-target' }));
      const snap1 = dbg.getKnowledgeSnapshot();
      assert.ok(snap1 instanceof KnowledgeSnapshot);

      const cpId = dbg.checkpointKnowledge('dbg-know-cp');
      dbg._knowledgeEngine.graph.clear();
      assert.equal(dbg.getKnowledgeEntities().length, 0);

      dbg.restoreKnowledge('dbg-know-cp');
      assert.equal(dbg.getKnowledgeEntities().length, 1);

      const snap2 = dbg.getKnowledgeSnapshot();
      const diff = dbg.diffKnowledgeSnapshots(snap1, snap2);
      assert.ok(!diff.hasChanges);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. Performance Benchmarks
  // ─────────────────────────────────────────────────────────────────────────────
  describe('13. Performance Benchmarks', () => {
    it('13.1 100k entity insertions (<250ms)', () => {
      const graph = new VerificationKnowledgeGraph();
      const start = Date.now();
      for (let i = 0; i < 100000; i++) {
        graph.addEntity(new KnowledgeEntity({ id: `entity-perf-${i}` }));
      }
      const elapsed = Date.now() - start;
      assert.equal(graph.size.entities, 100000);
      assert.ok(elapsed < 250, `100k entity insertions took ${elapsed}ms (target <250ms)`);
    });

    it('13.2 100k edge insertions (<300ms)', () => {
      const graph = new VerificationKnowledgeGraph();
      for (let i = 0; i < 100; i++) {
        graph.addEntity(new KnowledgeEntity({ id: `node-${i}` }));
      }
      const start = Date.now();
      for (let i = 0; i < 100000; i++) {
        graph.addEdge(new KnowledgeEdge({
          id: `edge-${i}`,
          source: `node-${i % 100}`,
          target: `node-${(i + 1) % 100}`,
          relation: 'DEPENDS_ON'
        }));
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 300, `100k edge insertions took ${elapsed}ms (target <300ms)`);
    });

    it('13.3 10k graph queries (<150ms)', () => {
      const graph = new VerificationKnowledgeGraph();
      for (let i = 0; i < 100; i++) {
        graph.addEntity(new KnowledgeEntity({ id: `query-node-${i}`, kind: i % 2 === 0 ? 'FUNCTION' : 'TEST' }));
      }
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        graph.getEntitiesByKind('FUNCTION');
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 150, `10k graph queries took ${elapsed}ms (target <150ms)`);
    });

    it('13.4 10k provenance queries (<150ms)', () => {
      const graph = new VerificationKnowledgeGraph();
      graph.addEntity(new KnowledgeEntity({ id: 'root', creationStage: 1 }));
      graph.addEntity(new KnowledgeEntity({ id: 'leaf', creationStage: 20 }));
      graph.addEdge(new KnowledgeEdge({ source: 'root', target: 'leaf', relation: 'DERIVES_FROM' }));
      const resolver = new ProvenanceResolver(graph);

      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        resolver.resolveChain('leaf');
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 150, `10k provenance queries took ${elapsed}ms (target <150ms)`);
    });

    it('13.5 10k causal queries (<200ms)', () => {
      const cg = new CausalGraph();
      cg.addLink(new CausalLink({ causeId: 'cause-1', effectId: 'effect-1' }));
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        cg.getCausalChain('effect-1');
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 200, `10k causal queries took ${elapsed}ms (target <200ms)`);
    });

    it('13.6 10k dependency queries (<150ms)', () => {
      const dg = new EvidenceDependencyGraph();
      dg.addDependency(new EvidenceDependency({ sourceEvidenceId: 'ev-1', targetEvidenceId: 'ev-2' }));
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        dg.getDependencyClosure('ev-2');
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 150, `10k dependency queries took ${elapsed}ms (target <150ms)`);
    });

    it('13.7 10k invalidation propagations (<250ms)', () => {
      const kg = new VerificationKnowledgeGraph();
      kg.addEntity(new KnowledgeEntity({ id: 'src' }));
      kg.addEntity(new KnowledgeEntity({ id: 'dst' }));
      kg.addEdge(new KnowledgeEdge({ source: 'src', target: 'dst', relation: 'PROVES' }));
      const change = new KnowledgeChange({ targetEntityId: 'src' });

      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        ImpactPropagation.propagateImpact(change, kg);
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 250, `10k invalidations took ${elapsed}ms (target <250ms)`);
    });

    it('13.8 1k root-cause analyses (<300ms)', () => {
      const cg = new CausalGraph();
      cg.addLink(new CausalLink({ causeId: 'root', effectId: 'mid' }));
      cg.addLink(new CausalLink({ causeId: 'mid', effectId: 'leaf' }));
      const analyzer = new RootCauseAnalyzer(cg);

      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        analyzer.analyze('leaf');
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 300, `1k root-cause analyses took ${elapsed}ms (target <300ms)`);
    });

    it('13.9 1k counterfactual plans (<500ms)', () => {
      const engine = new CounterfactualEngine();
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        engine.simulateCounterfactual({ targetEntityId: 'node-1', changedAssumption: 'x != null' });
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 500, `1k counterfactuals took ${elapsed}ms (target <500ms)`);
    });

    it('13.10 1k explanations (<250ms)', () => {
      const kg = new VerificationKnowledgeGraph();
      kg.addEntity(new KnowledgeEntity({ id: 'exp-target', name: 'target' }));
      const explainer = new KnowledgeExplanationEngine(kg);

      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        explainer.explain('exp-target', 'SUMMARY');
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 250, `1k explanations took ${elapsed}ms (target <250ms)`);
    });

    it('13.11 1k snapshots (<350ms)', () => {
      const kg = new VerificationKnowledgeGraph();
      kg.addEntity(new KnowledgeEntity({ id: 'node-1' }));
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        new KnowledgeSnapshot({ entities: kg.getEntities(), edges: kg.getEdges() });
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 350, `1k snapshots took ${elapsed}ms (target <350ms)`);
    });

    it('13.12 1k graph replays (<750ms)', () => {
      const engine = new KnowledgeEngine();
      const trace = [
        { event: 'A', data: {} },
        { event: 'B', data: {} }
      ];
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        engine.replayTrace(trace);
      }
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 750, `1k graph replays took ${elapsed}ms (target <750ms)`);
    });
  });
});
