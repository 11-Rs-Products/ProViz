/**
 * test/test_stage29_semantic.mjs
 * Comprehensive test suite for Stage 29: Universal Semantic Program Model,
 * Dependency Intelligence & Whole-System Impact Reasoning Engine.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import * as Semantic from '../src/semantic/index.js';
import * as Knowledge from '../src/knowledge/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

describe('Stage 29: Universal Semantic Program Model & Impact Reasoning', () => {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Semantic Entity Model
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Semantic Entity Model', () => {
    it('1.1 should define comprehensive SemanticEntityKind enum', () => {
      assert.ok(Semantic.SemanticEntityKind.PROGRAM);
      assert.ok(Semantic.SemanticEntityKind.FUNCTION);
      assert.ok(Semantic.SemanticEntityKind.STATEMENT);
      assert.ok(Semantic.SemanticEntityKind.EXPRESSION);
      assert.ok(Semantic.SemanticEntityKind.BRANCH);
      assert.ok(Semantic.SemanticEntityKind.HEAP_REGION);
      assert.ok(Semantic.SemanticEntityKind.CONTRACT);
      assert.ok(Semantic.SemanticEntityKind.INVARIANT);
      assert.ok(Semantic.SemanticEntityKind.TEST);
      assert.ok(Semantic.SemanticEntityKind.PROOF);
      assert.ok(Semantic.SemanticEntityKind.API_BOUNDARY);
      assert.ok(Semantic.SemanticEntityKind.VERIFICATION_GOAL);
    });

    it('1.2 should instantiate immutable SemanticNode with all fields', () => {
      const node = new Semantic.SemanticNode({
        id: 'fn:auth:login',
        kind: Semantic.SemanticEntityKind.FUNCTION,
        name: 'login',
        sourceRange: { file: 'auth.js', startLine: 10, startCol: 1, endLine: 35, endCol: 1 },
        owningScope: 'file:auth.js',
        typeInfo: { returnType: 'boolean', params: ['string', 'string'] },
        verificationState: 'VERIFIED',
        specRelationships: ['contract:auth_req_1'],
        provenanceRefs: ['prov:commit_a123']
      });

      assert.equal(node.id, 'fn:auth:login');
      assert.equal(node.kind, Semantic.SemanticEntityKind.FUNCTION);
      assert.equal(node.name, 'login');
      assert.equal(node.verificationState, 'VERIFIED');
      assert.equal(node.specRelationships.length, 1);
      assert.throws(() => { node.name = 'modified'; });
    });

    it('1.3 should support immutable copy modifiers (withAttribute, withVerificationState, withTypeInfo)', () => {
      const node = new Semantic.SemanticNode({
        id: 'var:x',
        kind: Semantic.SemanticEntityKind.VARIABLE,
        name: 'x'
      });

      const updated = node.withVerificationState('STALE').withAttribute('version', 2);
      assert.equal(node.verificationState, 'UNVERIFIED');
      assert.equal(updated.verificationState, 'STALE');
      assert.equal(updated.attributes.version, 2);
    });

    it('1.4 should serialize and deserialize SemanticNode correctly', () => {
      const node = new Semantic.SemanticNode({
        id: 'fn:calc',
        kind: Semantic.SemanticEntityKind.FUNCTION,
        name: 'calc',
        typeInfo: { returnType: 'number' }
      });
      const json = node.toJSON();
      const restored = Semantic.SemanticNode.fromJSON(json);
      assert.equal(restored.id, 'fn:calc');
      assert.equal(restored.kind, Semantic.SemanticEntityKind.FUNCTION);
      assert.equal(restored.typeInfo.returnType, 'number');
    });

    it('1.5 should reject invalid node configurations', () => {
      assert.throws(() => new Semantic.SemanticNode({ id: '' }));
      assert.throws(() => new Semantic.SemanticNode({ id: 'valid', kind: null }));
    });

    it('1.6 should record control flow and data flow contexts immutably', () => {
      const node = new Semantic.SemanticNode({
        id: 'stmt:1',
        kind: Semantic.SemanticEntityKind.STATEMENT,
        cfgContext: { blockId: 'b1', branchCondition: 'x > 0' },
        dfgContext: { defs: ['y'], uses: ['x', 'z'] }
      });
      assert.equal(node.cfgContext.blockId, 'b1');
      assert.equal(node.dfgContext.defs[0], 'y');
      assert.throws(() => { node.cfgContext.blockId = 'b2'; });
    });

    it('1.7 should record memory relationships and environment constraints', () => {
      const node = new Semantic.SemanticNode({
        id: 'heap:obj1',
        kind: Semantic.SemanticEntityKind.MEMORY_OBJECT,
        memoryRelationships: { region: 'heap_main', escapes: false },
        environmentConstraints: { arch: 'x64', os: 'linux' }
      });
      assert.equal(node.memoryRelationships.region, 'heap_main');
      assert.equal(node.environmentConstraints.arch, 'x64');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Semantic Relationships & Edges
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Semantic Relationships & Edges', () => {
    it('2.1 should define all semantic relation kinds', () => {
      assert.ok(Semantic.SemanticRelationKind.DECLARES);
      assert.ok(Semantic.SemanticRelationKind.DEFINES);
      assert.ok(Semantic.SemanticRelationKind.READS);
      assert.ok(Semantic.SemanticRelationKind.WRITES);
      assert.ok(Semantic.SemanticRelationKind.CALLS);
      assert.ok(Semantic.SemanticRelationKind.OVERRIDES);
      assert.ok(Semantic.SemanticRelationKind.IMPLEMENTS);
      assert.ok(Semantic.SemanticRelationKind.EXTENDS);
      assert.ok(Semantic.SemanticRelationKind.FLOWS_TO);
      assert.ok(Semantic.SemanticRelationKind.ALLOCATES);
      assert.ok(Semantic.SemanticRelationKind.ALIASES);
      assert.ok(Semantic.SemanticRelationKind.THROWS);
      assert.ok(Semantic.SemanticRelationKind.AFFECTS_PROOF);
      assert.ok(Semantic.SemanticRelationKind.REFINES);
      assert.ok(Semantic.SemanticRelationKind.EQUIVALENT_TO);
    });

    it('2.2 should instantiate SemanticEdge and clamp strength and confidence', () => {
      const edge = new Semantic.SemanticEdge({
        id: 'e:rel',
        sourceId: 'n1',
        targetId: 'n2',
        relation: Semantic.SemanticRelationKind.CALLS,
        strength: 1.5,
        confidence: -0.5
      });
      assert.equal(edge.strength, 1.0);
      assert.equal(edge.confidence, 0.0);
      assert.equal(edge.scope, 'GLOBAL');
    });

    it('2.3 should serialize and deserialize SemanticEdge accurately', () => {
      const edge = new Semantic.SemanticEdge({
        id: 'e:ser',
        sourceId: 'src1',
        targetId: 'tgt1',
        relation: Semantic.SemanticRelationKind.FLOWS_TO,
        scope: 'MODULE',
        provenance: ['prov:1']
      });
      const json = edge.toJSON();
      const restored = Semantic.SemanticEdge.fromJSON(json);
      assert.equal(restored.id, 'e:ser');
      assert.equal(restored.scope, 'MODULE');
      assert.equal(restored.provenance[0], 'prov:1');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Semantic Program Graph & Indexing
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Semantic Program Graph & Indexing', () => {
    let graph;

    beforeEach(() => {
      graph = new Semantic.SemanticProgramGraph();
    });

    it('3.1 should add nodes and edges and maintain graph connectivity', () => {
      const nodeA = new Semantic.SemanticNode({ id: 'nodeA', kind: Semantic.SemanticEntityKind.FUNCTION, name: 'caller' });
      const nodeB = new Semantic.SemanticNode({ id: 'nodeB', kind: Semantic.SemanticEntityKind.FUNCTION, name: 'callee' });
      const edge = new Semantic.SemanticEdge({
        id: 'edge:A->calls->B',
        sourceId: 'nodeA',
        targetId: 'nodeB',
        relation: Semantic.SemanticRelationKind.CALLS
      });

      graph.addNode(nodeA);
      graph.addNode(nodeB);
      graph.addEdge(edge);

      assert.equal(graph.nodeCount, 2);
      assert.equal(graph.edgeCount, 1);
      assert.equal(graph.getOutgoingEdges('nodeA').length, 1);
      assert.equal(graph.getIncomingEdges('nodeB').length, 1);
    });

    it('3.2 should query nodes by kind, file, scope, and name index', () => {
      graph.addNode(new Semantic.SemanticNode({
        id: 'fn:1',
        kind: Semantic.SemanticEntityKind.FUNCTION,
        name: 'process',
        sourceRange: { file: 'main.js' },
        owningScope: 'mod:main'
      }));
      graph.addNode(new Semantic.SemanticNode({
        id: 'test:1',
        kind: Semantic.SemanticEntityKind.TEST,
        name: 'test_process',
        sourceRange: { file: 'test.js' }
      }));

      const fns = graph.queryNodes({ kind: Semantic.SemanticEntityKind.FUNCTION });
      assert.equal(fns.length, 1);
      assert.equal(fns[0].name, 'process');

      const byFile = graph.queryNodes({ file: 'main.js' });
      assert.equal(byFile.length, 1);

      const byName = graph.queryNodes({ name: 'test_process' });
      assert.equal(byName.length, 1);
    });

    it('3.3 should compute ancestors, descendants, and shortest path', () => {
      graph.addNode(new Semantic.SemanticNode({ id: 'n1', kind: Semantic.SemanticEntityKind.STATEMENT }));
      graph.addNode(new Semantic.SemanticNode({ id: 'n2', kind: Semantic.SemanticEntityKind.STATEMENT }));
      graph.addNode(new Semantic.SemanticNode({ id: 'n3', kind: Semantic.SemanticEntityKind.STATEMENT }));

      graph.addEdge(new Semantic.SemanticEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', relation: Semantic.SemanticRelationKind.FLOWS_TO }));
      graph.addEdge(new Semantic.SemanticEdge({ id: 'e2', sourceId: 'n2', targetId: 'n3', relation: Semantic.SemanticRelationKind.FLOWS_TO }));

      const descendants = graph.getDescendants('n1');
      assert.equal(descendants.length, 2);

      const ancestors = graph.getAncestors('n3');
      assert.equal(ancestors.length, 2);

      const path = graph.findPath('n1', 'n3');
      assert.deepEqual(path, ['n1', 'n2', 'n3']);
    });

    it('3.4 should clean up edges when removing a node', () => {
      graph.addNode(new Semantic.SemanticNode({ id: 'A', kind: Semantic.SemanticEntityKind.FUNCTION }));
      graph.addNode(new Semantic.SemanticNode({ id: 'B', kind: Semantic.SemanticEntityKind.FUNCTION }));
      graph.addEdge(new Semantic.SemanticEdge({ id: 'eAB', sourceId: 'A', targetId: 'B', relation: Semantic.SemanticRelationKind.CALLS }));

      assert.equal(graph.edgeCount, 1);
      graph.removeNode('A');
      assert.equal(graph.nodeCount, 1);
      assert.equal(graph.edgeCount, 0);
    });

    it('3.5 should serialize and restore SemanticProgramGraph completely', () => {
      graph.addNode(new Semantic.SemanticNode({ id: 'X', kind: Semantic.SemanticEntityKind.VARIABLE }));
      graph.addNode(new Semantic.SemanticNode({ id: 'Y', kind: Semantic.SemanticEntityKind.VARIABLE }));
      graph.addEdge(new Semantic.SemanticEdge({ id: 'eXY', sourceId: 'X', targetId: 'Y', relation: Semantic.SemanticRelationKind.FLOWS_TO }));

      const json = graph.toJSON();
      const restored = Semantic.SemanticProgramGraph.fromJSON(json);
      assert.equal(restored.nodeCount, 2);
      assert.equal(restored.edgeCount, 1);
      assert.ok(restored.hasNode('X'));
      assert.ok(restored.hasNode('Y'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Multi-Dimensional Dependencies & Closure
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Multi-Dimensional Dependencies & Closure', () => {
    let closure;

    beforeEach(() => {
      closure = new Semantic.DependencyClosure();
    });

    it('3.1 should record multi-dimensional dependency edges', () => {
      closure.addDependency(new Semantic.DependencyEdge({
        id: 'dep1',
        sourceId: 'fnA',
        targetId: 'fnB',
        kind: Semantic.DependencyKind.CALL
      }));
      closure.addDependency(new Semantic.DependencyEdge({
        id: 'dep2',
        sourceId: 'fnB',
        targetId: 'db1',
        kind: Semantic.DependencyKind.DATA_FLOW
      }));

      const outA = closure.getDependencies('fnA');
      assert.equal(outA.length, 1);
      assert.equal(outA[0].kind, Semantic.DependencyKind.CALL);
    });

    it('3.2 should compute forward transitive closure', () => {
      closure.addDependency(new Semantic.DependencyEdge({ id: 'd1', sourceId: 'A', targetId: 'B' }));
      closure.addDependency(new Semantic.DependencyEdge({ id: 'd2', sourceId: 'B', targetId: 'C' }));
      closure.addDependency(new Semantic.DependencyEdge({ id: 'd3', sourceId: 'C', targetId: 'D' }));

      const trans = closure.getTransitiveClosure('A');
      assert.deepEqual(trans, ['B', 'C', 'D']);
    });

    it('3.3 should compute reverse dependency closure', () => {
      closure.addDependency(new Semantic.DependencyEdge({ id: 'd1', sourceId: 'A', targetId: 'B' }));
      closure.addDependency(new Semantic.DependencyEdge({ id: 'd2', sourceId: 'B', targetId: 'C' }));

      const rev = closure.getReverseClosure('C');
      assert.deepEqual(rev, ['B', 'A']);
    });

    it('3.4 should build dependencies from SemanticProgramGraph automatically', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'fn1', kind: Semantic.SemanticEntityKind.FUNCTION }));
      graph.addNode(new Semantic.SemanticNode({ id: 'fn2', kind: Semantic.SemanticEntityKind.FUNCTION }));
      graph.addEdge(new Semantic.SemanticEdge({
        id: 'edge1',
        sourceId: 'fn1',
        targetId: 'fn2',
        relation: Semantic.SemanticRelationKind.CALLS
      }));

      const builtClosure = Semantic.DependencyClosure.buildFromProgramGraph(graph);
      const deps = builtClosure.getDependencies('fn1', Semantic.DependencyKind.CALL);
      assert.equal(deps.length, 1);
      assert.equal(deps[0].targetId, 'fn2');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Change Impact & Blast Radius
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Change Impact & Blast Radius', () => {
    let graph;
    let analyzer;

    beforeEach(() => {
      graph = new Semantic.SemanticProgramGraph();
      analyzer = new Semantic.ImpactAnalyzer();

      graph.addNode(new Semantic.SemanticNode({ id: 'fn:core', kind: Semantic.SemanticEntityKind.FUNCTION, name: 'coreCalc' }));
      graph.addNode(new Semantic.SemanticNode({ id: 'fn:api', kind: Semantic.SemanticEntityKind.API_BOUNDARY, name: 'apiHandler' }));
      graph.addNode(new Semantic.SemanticNode({ id: 'test:core', kind: Semantic.SemanticEntityKind.TEST, name: 'testCore' }));
      graph.addNode(new Semantic.SemanticNode({ id: 'proof:invar', kind: Semantic.SemanticEntityKind.PROOF, name: 'proofInvar' }));

      graph.addEdge(new Semantic.SemanticEdge({ id: 'e1', sourceId: 'fn:api', targetId: 'fn:core', relation: Semantic.SemanticRelationKind.CALLS }));
      graph.addEdge(new Semantic.SemanticEdge({ id: 'e2', sourceId: 'test:core', targetId: 'fn:core', relation: Semantic.SemanticRelationKind.AFFECTS_TEST }));
      graph.addEdge(new Semantic.SemanticEdge({ id: 'e3', sourceId: 'proof:invar', targetId: 'fn:core', relation: Semantic.SemanticRelationKind.AFFECTS_PROOF }));
    });

    it('4.1 should compute multi-factor impact score: Impact(C) = αD + βB + γS + δV + εE + ζR', () => {
      const change = new Semantic.SemanticChange({
        id: 'c1',
        type: Semantic.SemanticChangeType.DATA_FLOW_CHANGED,
        targetId: 'fn:core'
      });

      const impact = analyzer.analyze(change, graph);
      assert.ok(impact.impactScore > 0.0 && impact.impactScore <= 1.0);
      assert.ok(impact.breakdown.dependencyImpact > 0);
      assert.ok(impact.breakdown.behavioralImpact > 0);
      assert.ok(impact.invalidatedProofIds.includes('proof:invar'));
      assert.ok(impact.staleTestIds.includes('test:core'));
    });

    it('4.2 should compute blast radius and categorize scope and severity', () => {
      const change = new Semantic.SemanticChange({
        id: 'c2',
        type: Semantic.SemanticChangeType.TYPE_CHANGED,
        targetId: 'fn:core'
      });

      const impact = analyzer.analyze(change, graph);
      assert.equal(impact.blastRadius.scope, Semantic.BlastRadiusScope.EXTERNAL);
      assert.ok(impact.blastRadius.severity === Semantic.BlastRadiusSeverity.HIGH || impact.blastRadius.severity === Semantic.BlastRadiusSeverity.CRITICAL);
      assert.ok(impact.blastRadius.totalAffectedEntities >= 3);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Conditional & Behavioral Impact
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Conditional & Behavioral Impact', () => {
    it('5.1 should evaluate conditional dependency reachability under context', () => {
      const condAnalyzer = new Semantic.ConditionalImpactAnalyzer();
      condAnalyzer.addConditionalDependency(new Semantic.ConditionalDependency({
        id: 'cond1',
        sourceId: 'srcA',
        targetId: 'targetB',
        condition: { type: 'ENV', expression: 'NODE_ENV', value: 'production' }
      }));

      const devReachable = condAnalyzer.filterReachableDependents('srcA', { env: { NODE_ENV: 'development' } });
      assert.equal(devReachable.length, 0);

      const prodReachable = condAnalyzer.filterReachableDependents('srcA', { env: { NODE_ENV: 'production' } });
      assert.deepEqual(prodReachable, ['targetB']);
    });

    it('5.2 should predict behavioral shift dimensions using BehaviorImpactAnalyzer', () => {
      const behAnalyzer = new Semantic.BehaviorImpactAnalyzer();
      const change = new Semantic.SemanticChange({
        id: 'c_mem',
        type: Semantic.SemanticChangeType.MEMORY_BEHAVIOR_CHANGED,
        targetId: 'fn:alloc'
      });

      const impact = behAnalyzer.analyze(change, new Semantic.SemanticProgramGraph());
      assert.ok(impact.affectedDimensions.includes(Semantic.BehaviorImpactDimension.HEAP));
      assert.ok(impact.affectedDimensions.includes(Semantic.BehaviorImpactDimension.SIDE_EFFECT));
      assert.ok(impact.divergenceProbability >= 0.7);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Test Impact & Regression Selection
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Test Impact & Regression Selection', () => {
    it('6.1 should rank tests by TestValue score', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'fn:target', kind: Semantic.SemanticEntityKind.FUNCTION }));
      graph.addNode(new Semantic.SemanticNode({ id: 'test:relevant', kind: Semantic.SemanticEntityKind.TEST, name: 'testRel' }));
      graph.addNode(new Semantic.SemanticNode({ id: 'test:unrelated', kind: Semantic.SemanticEntityKind.TEST, name: 'testUnrel' }));

      graph.addEdge(new Semantic.SemanticEdge({
        id: 'e:t1',
        sourceId: 'test:relevant',
        targetId: 'fn:target',
        relation: Semantic.SemanticRelationKind.AFFECTS_TEST
      }));

      const testAnalyzer = new Semantic.TestImpactAnalyzer();
      const change = new Semantic.SemanticChange({ id: 'c1', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fn:target' });

      const ranked = testAnalyzer.rankTests(change, graph);
      assert.ok(ranked.length === 2);
      assert.equal(ranked[0].testId, 'test:relevant');
      assert.ok(ranked[0].score > ranked[1].score);
    });

    it('6.2 should select optimal regression test set', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'fn:1', kind: Semantic.SemanticEntityKind.FUNCTION }));
      graph.addNode(new Semantic.SemanticNode({ id: 't1', kind: Semantic.SemanticEntityKind.TEST }));
      graph.addEdge(new Semantic.SemanticEdge({
        id: 'e_t1',
        sourceId: 't1',
        targetId: 'fn:1',
        relation: Semantic.SemanticRelationKind.AFFECTS_TEST
      }));

      const selector = new Semantic.RegressionSelector();
      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fn:1' });

      const selection = selector.selectTests(change, graph);
      assert.equal(selection.selectedTestIds.length, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. API Compatibility & Semantic Versioning
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. API Compatibility & Semantic Versioning', () => {
    it('7.1 should detect breaking API changes (removed param, changed return type)', () => {
      const oldContract = new Semantic.APIContract({
        id: 'api:v1',
        name: 'getUser',
        inputTypes: [{ name: 'id', type: 'string', required: true }],
        outputType: { type: 'User' }
      });

      const newContract = new Semantic.APIContract({
        id: 'api:v2',
        name: 'getUser',
        inputTypes: [{ name: 'id', type: 'number', required: true }], // type changed
        outputType: { type: 'User' }
      });

      const compatAnalyzer = new Semantic.APICompatibilityAnalyzer();
      const result = compatAnalyzer.compare(oldContract, newContract);

      assert.equal(result.status, Semantic.CompatibilityStatus.BREAKING);
      assert.equal(result.isCompatible, false);
    });

    it('7.2 should infer SemVer level based on compatibility and changes', () => {
      const breakingCompat = { status: Semantic.CompatibilityStatus.BREAKING };
      const resMajor = Semantic.SemanticVersionImpact.evaluate(breakingCompat);
      assert.equal(resMajor.level, Semantic.SemVerLevel.MAJOR);

      const compatible = { status: Semantic.CompatibilityStatus.COMPATIBLE };
      const resMinor = Semantic.SemanticVersionImpact.evaluate(compatible, [
        new Semantic.SemanticChange({ id: 'c_add', type: Semantic.SemanticChangeType.ADDED, targetId: 'fn:new' })
      ]);
      assert.equal(resMinor.level, Semantic.SemVerLevel.MINOR);

      const resPatch = Semantic.SemanticVersionImpact.evaluate(compatible, [
        new Semantic.SemanticChange({ id: 'c_fix', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fn:fix' })
      ]);
      assert.equal(resPatch.level, Semantic.SemVerLevel.PATCH);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Architecture & Coupling / Cohesion
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. Architecture & Coupling / Cohesion', () => {
    it('8.1 should detect forbidden architectural layering violations', () => {
      const arch = new Semantic.ArchitectureGraph();
      arch.addNode(new Semantic.ArchitectureNode({ id: 'infra:db', name: 'Database', layer: Semantic.ArchitectureLayer.INFRASTRUCTURE }));
      arch.addNode(new Semantic.ArchitectureNode({ id: 'domain:user', name: 'UserEntity', layer: Semantic.ArchitectureLayer.DOMAIN }));

      arch.addDependency('infra:db', 'domain:user'); // Forbidden: Infrastructure -> Domain

      const analyzer = new Semantic.ArchitectureAnalyzer();
      const result = analyzer.analyze(arch);

      assert.equal(result.isClean, false);
      assert.equal(result.totalViolations, 1);
    });

    it('8.2 should calculate coupling metrics (Ca, Ce, Instability, Fan-In/Out)', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'modA', kind: Semantic.SemanticEntityKind.MODULE }));
      graph.addNode(new Semantic.SemanticNode({ id: 'modB', kind: Semantic.SemanticEntityKind.MODULE }));
      graph.addNode(new Semantic.SemanticNode({ id: 'modC', kind: Semantic.SemanticEntityKind.MODULE }));

      graph.addEdge(new Semantic.SemanticEdge({ id: 'e1', sourceId: 'modA', targetId: 'modB', relation: Semantic.SemanticRelationKind.DEPENDS_ON }));
      graph.addEdge(new Semantic.SemanticEdge({ id: 'e2', sourceId: 'modC', targetId: 'modB', relation: Semantic.SemanticRelationKind.DEPENDS_ON }));

      const metricsB = Semantic.CouplingMetrics.calculate('modB', graph);
      assert.equal(metricsB.afferentCoupling, 2); // 2 callers
      assert.equal(metricsB.efferentCoupling, 0); // 0 outgoing
      assert.equal(metricsB.instability, 0.0); // Completely stable
    });

    it('8.3 should measure module cohesion and detect cycles', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'fn1', kind: Semantic.SemanticEntityKind.FUNCTION, owningScope: 'class:A' }));
      graph.addNode(new Semantic.SemanticNode({ id: 'fn2', kind: Semantic.SemanticEntityKind.FUNCTION, owningScope: 'class:A' }));
      graph.addEdge(new Semantic.SemanticEdge({ id: 'e12', sourceId: 'fn1', targetId: 'fn2', relation: Semantic.SemanticRelationKind.CALLS }));
      graph.addEdge(new Semantic.SemanticEdge({ id: 'e21', sourceId: 'fn2', targetId: 'fn1', relation: Semantic.SemanticRelationKind.CALLS }));

      const cohesionAnalyzer = new Semantic.CohesionAnalyzer();
      const cohesion = cohesionAnalyzer.analyze('class:A', graph);
      assert.ok(cohesion.isCohesive);

      const cycleAnalyzer = new Semantic.CycleAnalyzer();
      const cycles = cycleAnalyzer.detectCycles(graph);
      assert.ok(cycles.length >= 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Semantic Refactoring, Equivalence & Diff
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. Semantic Refactoring, Equivalence & Diff', () => {
    it('9.1 should validate semantic refactorings', () => {
      const bGraph = new Semantic.SemanticProgramGraph();
      const aGraph = new Semantic.SemanticProgramGraph();

      bGraph.addNode(new Semantic.SemanticNode({ id: 'fn:orig', kind: Semantic.SemanticEntityKind.FUNCTION, specRelationships: ['spec1'] }));
      aGraph.addNode(new Semantic.SemanticNode({ id: 'fn:orig', kind: Semantic.SemanticEntityKind.FUNCTION, specRelationships: ['spec1'] }));

      const refactoring = new Semantic.SemanticRefactoring({
        id: 'ref1',
        type: Semantic.RefactoringType.RESTRUCTURE_CONTROL_FLOW,
        targetId: 'fn:orig'
      });

      const validator = new Semantic.RefactoringValidator();
      const result = validator.validate(refactoring, bGraph, aGraph, { testPassRate: 1.0 });
      assert.equal(result.isValid, true);
    });

    it('9.2 should check semantic equivalence across models', () => {
      const nodeA = new Semantic.SemanticNode({ id: 'fn1', kind: Semantic.SemanticEntityKind.FUNCTION, specRelationships: ['s1', 's2'] });
      const nodeB = new Semantic.SemanticNode({ id: 'fn2', kind: Semantic.SemanticEntityKind.FUNCTION, specRelationships: ['s1', 's2'] });

      const eqAnalyzer = new Semantic.EquivalenceAnalyzer();
      const eq = eqAnalyzer.checkEquivalence(nodeA, nodeB);
      assert.equal(eq.kind, Semantic.EquivalenceKind.CONTRACT_EQUIVALENCE);
      assert.ok(eq.confidence >= 0.90);
    });

    it('9.3 should compute SemanticDiff distinguishing AST, behavior, and verification impact', () => {
      const g1 = new Semantic.SemanticProgramGraph();
      const g2 = new Semantic.SemanticProgramGraph();

      g1.addNode(new Semantic.SemanticNode({ id: 'f1', kind: Semantic.SemanticEntityKind.FUNCTION }));
      g2.addNode(new Semantic.SemanticNode({ id: 'f1', kind: Semantic.SemanticEntityKind.FUNCTION, verificationState: 'STALE' }));
      g2.addNode(new Semantic.SemanticNode({ id: 'f2', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const diff = Semantic.SemanticDiff.compareGraphs(g1, g2);
      assert.equal(diff.astChanged, true);
      assert.equal(diff.modifiedNodes.length, 1);
      assert.equal(diff.addedNodes.length, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Twenty-Eight Mandatory End-to-End Scenarios
  // ─────────────────────────────────────────────────────────────────────────────
  describe('10. Twenty-Eight Mandatory End-to-End Scenarios', () => {
    let engine;

    beforeEach(() => {
      engine = new Semantic.SemanticEngine();
    });

    it('Scenario 1: Build semantic model from source', () => {
      const graph = engine.buildFromSource('math.js', 'function add(a, b) { return a + b; }', {
        functions: [{ name: 'add', returnType: 'number' }]
      });
      assert.ok(graph.hasNode('fn:math.js:add'));
    });

    it('Scenario 2: Integrate AST/CFG/SSA/PDG', () => {
      const ast = { type: 'FunctionDeclaration', name: 'process' };
      engine.builder.integrateAST(ast, engine.graph, 'proc.js');
      const cfg = { nodes: [{ id: 'cfg:1', condition: 'x > 0' }], edges: [] };
      engine.builder.integrateCFG(cfg, engine.graph, 'proc.js');
      assert.ok(engine.hasNode('cfg:1'));
    });

    it('Scenario 3: Integrate call and type graphs', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fA', kind: Semantic.SemanticEntityKind.FUNCTION, typeInfo: { type: '() => void' } }));
      engine.addNode(new Semantic.SemanticNode({ id: 'fB', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'eAB', sourceId: 'fA', targetId: 'fB', relation: Semantic.SemanticRelationKind.CALLS }));
      assert.equal(engine.getDependencies('fA', Semantic.DependencyKind.CALL).length, 1);
    });

    it('Scenario 4: Integrate runtime execution data', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'exec:1', kind: Semantic.SemanticEntityKind.EXECUTION, attributes: { status: 'SUCCESS' } }));
      assert.ok(engine.hasNode('exec:1'));
    });

    it('Scenario 5: Integrate Stage 28 knowledge graph', () => {
      const kGraph = new Knowledge.VerificationKnowledgeGraph();
      kGraph.addEntity(new Knowledge.KnowledgeEntity({ id: 'ent:1', kind: 'PROOF', creationStage: 28 }));
      engine.builder.integrateKnowledgeGraph(kGraph, engine.graph);
      assert.ok(engine.hasNode('ent:1'));
    });

    it('Scenario 6: Direct dependency resolution', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'A', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'B', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'e', sourceId: 'A', targetId: 'B', relation: Semantic.SemanticRelationKind.CALLS }));
      const deps = engine.getDependencies('A');
      assert.equal(deps.length, 1);
      assert.equal(deps[0].targetId, 'B');
    });

    it('Scenario 7: Transitive dependency closure', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'A', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'B', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'C', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'e1', sourceId: 'A', targetId: 'B', relation: Semantic.SemanticRelationKind.CALLS }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'e2', sourceId: 'B', targetId: 'C', relation: Semantic.SemanticRelationKind.CALLS }));
      const closure = engine.getTransitiveClosure('A');
      assert.deepEqual(closure, ['B', 'C']);
    });

    it('Scenario 8: Reverse dependency analysis', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'A', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'B', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'e1', sourceId: 'A', targetId: 'B', relation: Semantic.SemanticRelationKind.CALLS }));
      const rev = engine.getReverseClosure('B');
      assert.deepEqual(rev, ['A']);
    });

    it('Scenario 9: Conditional dependency', () => {
      engine.conditionalAnalyzer.addConditionalDependency(new Semantic.ConditionalDependency({
        id: 'c1',
        sourceId: 'root',
        targetId: 'child',
        condition: { type: 'BRANCH', expression: 'isSecure', value: true }
      }));
      assert.equal(engine.getConditionalImpact('root', { branchState: { isSecure: true } }).length, 1);
    });

    it('Scenario 10: Cross-module dependency', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'modA:fn', kind: Semantic.SemanticEntityKind.FUNCTION, owningScope: 'modA' }));
      engine.addNode(new Semantic.SemanticNode({ id: 'modB:fn', kind: Semantic.SemanticEntityKind.FUNCTION, owningScope: 'modB' }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'eCross', sourceId: 'modA:fn', targetId: 'modB:fn', relation: Semantic.SemanticRelationKind.IMPORTS }));
      assert.ok(engine.getDependencies('modA:fn').length > 0);
    });

    it('Scenario 11: Dependency cycle detection', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'c1', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'c2', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'e1', sourceId: 'c1', targetId: 'c2', relation: Semantic.SemanticRelationKind.CALLS }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'e2', sourceId: 'c2', targetId: 'c1', relation: Semantic.SemanticRelationKind.CALLS }));
      const cycles = engine.detectCycles();
      assert.ok(cycles.length >= 1);
    });

    it('Scenario 12: Local source change', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnLocal', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const change = new Semantic.SemanticChange({ id: 'c_loc', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnLocal' });
      const res = engine.analyzeSemanticChange(change);
      assert.ok(res.impactScore > 0);
    });

    it('Scenario 13: API signature change', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'apiFn', kind: Semantic.SemanticEntityKind.API_BOUNDARY }));
      const change = new Semantic.SemanticChange({ id: 'c_api', type: Semantic.SemanticChangeType.TYPE_CHANGED, targetId: 'apiFn' });
      const res = engine.analyzeSemanticChange(change);
      assert.equal(res.blastRadius.scope, Semantic.BlastRadiusScope.EXTERNAL);
    });

    it('Scenario 14: Type change', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnTyped', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const change = new Semantic.SemanticChange({ id: 'c_typ', type: Semantic.SemanticChangeType.TYPE_CHANGED, targetId: 'fnTyped' });
      const beh = engine.behaviorAnalyzer.analyze(change, engine.graph);
      assert.ok(beh.affectedDimensions.includes(Semantic.BehaviorImpactDimension.EXCEPTION));
    });

    it('Scenario 15: Control-flow change', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnCFG', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const change = new Semantic.SemanticChange({ id: 'c_cfg', type: Semantic.SemanticChangeType.CONTROL_FLOW_CHANGED, targetId: 'fnCFG' });
      const beh = engine.behaviorAnalyzer.analyze(change, engine.graph);
      assert.ok(beh.affectedDimensions.includes(Semantic.BehaviorImpactDimension.ORDER));
    });

    it('Scenario 16: Behavior-affecting change', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnBeh', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const change = new Semantic.SemanticChange({ id: 'c_beh', type: Semantic.SemanticChangeType.DATA_FLOW_CHANGED, targetId: 'fnBeh' });
      const res = engine.analyzeSemanticChange(change);
      assert.ok(res.breakdown.behavioralImpact > 0.5);
    });

    it('Scenario 17: Specification change', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'spec1', kind: Semantic.SemanticEntityKind.SPECIFICATION }));
      const change = new Semantic.SemanticChange({ id: 'c_spec', type: Semantic.SemanticChangeType.SPECIFICATION_CHANGED, targetId: 'spec1' });
      const specImpact = engine.specAnalyzer.analyze(change, engine.graph);
      assert.equal(specImpact.specDriftDetected, true);
    });

    it('Scenario 18: Environment change', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'envNode', kind: Semantic.SemanticEntityKind.ENVIRONMENT }));
      const change = new Semantic.SemanticChange({ id: 'c_env', type: Semantic.SemanticChangeType.ENVIRONMENT_CHANGED, targetId: 'envNode' });
      const beh = engine.behaviorAnalyzer.analyze(change, engine.graph);
      assert.ok(beh.affectedDimensions.includes(Semantic.BehaviorImpactDimension.IO));
    });

    it('Scenario 19: Proof invalidation', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnTarget', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'proof1', kind: Semantic.SemanticEntityKind.PROOF }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'eP', sourceId: 'proof1', targetId: 'fnTarget', relation: Semantic.SemanticRelationKind.AFFECTS_PROOF }));

      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnTarget' });
      const verif = engine.verificationAnalyzer.analyze(change, engine.graph);
      assert.ok(verif.invalidatedProofs.includes('proof1'));
      assert.equal(verif.needsFormalReverification, true);
    });

    it('Scenario 20: Evidence staleness propagation', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnTarget', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'ev1', kind: Semantic.SemanticEntityKind.EVIDENCE }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'eEv', sourceId: 'ev1', targetId: 'fnTarget', relation: Semantic.SemanticRelationKind.DEPENDS_ON }));

      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnTarget' });
      const verif = engine.verificationAnalyzer.analyze(change, engine.graph);
      assert.ok(verif.staleEvidence.includes('ev1'));
    });

    it('Scenario 21: Affected-test selection', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnTarget', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'test1', kind: Semantic.SemanticEntityKind.TEST, name: 't1' }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'eT', sourceId: 'test1', targetId: 'fnTarget', relation: Semantic.SemanticRelationKind.AFFECTS_TEST }));

      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnTarget' });
      const selection = engine.selectRegressionTests(change);
      assert.ok(selection.selectedTestIds.includes('test1'));
    });

    it('Scenario 22: Mutation campaign impact', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnTarget', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'mut1', kind: Semantic.SemanticEntityKind.MUTANT }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'eM', sourceId: 'mut1', targetId: 'fnTarget', relation: Semantic.SemanticRelationKind.AFFECTS_TEST }));

      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnTarget' });
      const verif = engine.verificationAnalyzer.analyze(change, engine.graph);
      assert.ok(verif.affectedMutants.includes('mut1'));
    });

    it('Scenario 23: Repair validation impact', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnTarget', kind: Semantic.SemanticEntityKind.FUNCTION }));
      engine.addNode(new Semantic.SemanticNode({ id: 'rep1', kind: Semantic.SemanticEntityKind.REPAIR }));
      engine.addEdge(new Semantic.SemanticEdge({ id: 'eR', sourceId: 'rep1', targetId: 'fnTarget', relation: Semantic.SemanticRelationKind.DEPENDS_ON }));

      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnTarget' });
      const verif = engine.verificationAnalyzer.analyze(change, engine.graph);
      assert.ok(verif.affectedRepairs.includes('rep1'));
    });

    it('Scenario 24: Behavioral equivalence check', () => {
      const n1 = new Semantic.SemanticNode({ id: 'v1', kind: Semantic.SemanticEntityKind.FUNCTION, specRelationships: ['specA'] });
      const n2 = new Semantic.SemanticNode({ id: 'v2', kind: Semantic.SemanticEntityKind.FUNCTION, specRelationships: ['specA'] });
      const eq = engine.checkSemanticEquivalence(n1, n2);
      assert.equal(eq.kind, Semantic.EquivalenceKind.CONTRACT_EQUIVALENCE);
    });

    it('Scenario 25: Semantic refactoring validation', () => {
      const g1 = new Semantic.SemanticProgramGraph();
      const g2 = new Semantic.SemanticProgramGraph();
      g1.addNode(new Semantic.SemanticNode({ id: 'f', kind: Semantic.SemanticEntityKind.FUNCTION }));
      g2.addNode(new Semantic.SemanticNode({ id: 'f', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const ref = new Semantic.SemanticRefactoring({ id: 'ref', type: Semantic.RefactoringType.RENAME_SYMBOL, targetId: 'f' });
      const val = engine.validateSemanticRefactoring(ref, g1, g2);
      assert.equal(val.isValid, true);
    });

    it('Scenario 26: Architecture violation detection', () => {
      const arch = engine.getArchitectureGraph();
      arch.addNode(new Semantic.ArchitectureNode({ id: 'data', layer: Semantic.ArchitectureLayer.DATA }));
      arch.addNode(new Semantic.ArchitectureNode({ id: 'api', layer: Semantic.ArchitectureLayer.API }));
      arch.addDependency('data', 'api'); // Data -> API violation
      const res = engine.analyzeArchitecture(arch);
      assert.equal(res.isClean, false);
    });

    it('Scenario 27: Change-risk prediction', () => {
      engine.addNode(new Semantic.SemanticNode({ id: 'fnTarget', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnTarget' });
      const res = engine.analyzeSemanticChange(change);
      assert.ok(res.riskModel.riskScore >= 0.0);
    });

    it('Scenario 28: Complete autonomous closed loop', () => {
      // 1. Ingest code
      engine.buildFromSource('core.js', 'function run() {}', { functions: [{ name: 'run' }] });

      // 2. Change
      const change = new Semantic.SemanticChange({
        id: 'c_auto',
        type: Semantic.SemanticChangeType.TYPE_CHANGED,
        targetId: 'fn:core.js:run'
      });

      // 3. Analyze impact & risk
      const analysis = engine.analyzeSemanticChange(change);
      assert.ok(analysis.impactScore > 0);
      assert.ok(analysis.plan.plannedGoals.length >= 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Debugger Stage 29 Integration APIs
  // ─────────────────────────────────────────────────────────────────────────────
  describe('11. Debugger Stage 29 Integration APIs', () => {
    let dbg;

    beforeEach(() => {
      dbg = new Debugger();
    });

    it('11.1 should create and expose semantic model through Debugger API', () => {
      const model = dbg.createSemanticModel();
      assert.ok(model);
      assert.ok(dbg._semanticEngine);
    });

    it('11.2 should query nodes, neighbors, and dependencies through Debugger API', () => {
      dbg._semanticEngine.addNode(new Semantic.SemanticNode({ id: 'node1', kind: Semantic.SemanticEntityKind.FUNCTION }));
      dbg._semanticEngine.addNode(new Semantic.SemanticNode({ id: 'node2', kind: Semantic.SemanticEntityKind.FUNCTION }));
      dbg._semanticEngine.addEdge(new Semantic.SemanticEdge({ id: 'e12', sourceId: 'node1', targetId: 'node2', relation: Semantic.SemanticRelationKind.CALLS }));

      assert.equal(dbg.getSemanticNode('node1').id, 'node1');
      assert.equal(dbg.getSemanticNodes().length, 2);
      assert.equal(dbg.getSemanticNeighbors('node1').length, 1);
      assert.equal(dbg.getSemanticDependencies('node1').length, 1);
    });

    it('11.3 should analyze semantic change and retrieve blast radius via Debugger API', () => {
      dbg._semanticEngine.addNode(new Semantic.SemanticNode({ id: 'fnTarget', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnTarget' });

      const impact = dbg.getSemanticImpact(change);
      assert.ok(impact > 0.0);

      const blast = dbg.getBlastRadius(change);
      assert.ok(blast);
    });

    it('11.4 should checkpoint, restore, diff and replay semantic model via Debugger API', () => {
      dbg._semanticEngine.addNode(new Semantic.SemanticNode({ id: 'A', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const snap = dbg.checkpointSemanticModel('cp1');
      assert.ok(snap);

      dbg._semanticEngine.addNode(new Semantic.SemanticNode({ id: 'B', kind: Semantic.SemanticEntityKind.FUNCTION }));
      dbg.checkpointSemanticModel('cp2');

      const diff = dbg.diffSemanticModels(dbg.getSemanticSnapshot('cp1'), dbg.getSemanticSnapshot('cp2'));
      assert.equal(diff.addedNodes.length, 1);

      dbg.restoreSemanticModel('cp1');
      assert.equal(dbg.getSemanticNodes().length, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Performance Benchmarks
  // ─────────────────────────────────────────────────────────────────────────────
  describe('12. Performance Benchmarks', () => {
    it('12.1 100k semantic nodes (<300ms)', () => {
      const graph = new Semantic.SemanticProgramGraph();
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        graph.addNode(new Semantic.SemanticNode({ id: `node_${i}`, kind: Semantic.SemanticEntityKind.VARIABLE }));
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `100k node insertions took ${elapsed.toFixed(1)}ms (target <300ms)`);
    });

    it('12.2 200k semantic edges (<400ms)', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'root', kind: Semantic.SemanticEntityKind.MODULE }));
      for (let i = 0; i < 1000; i++) {
        graph.addNode(new Semantic.SemanticNode({ id: `target_${i}`, kind: Semantic.SemanticEntityKind.FUNCTION }));
      }

      const start = performance.now();
      for (let i = 0; i < 200000; i++) {
        const targetId = `target_${i % 1000}`;
        graph.addEdge(new Semantic.SemanticEdge({
          id: `e_${i}`,
          sourceId: 'root',
          targetId,
          relation: Semantic.SemanticRelationKind.CALLS
        }));
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `200k edge insertions took ${elapsed.toFixed(1)}ms (target <400ms)`);
    });

    it('12.3 10k dependency queries (<150ms)', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'root', kind: Semantic.SemanticEntityKind.FUNCTION }));
      graph.addNode(new Semantic.SemanticNode({ id: 'leaf', kind: Semantic.SemanticEntityKind.FUNCTION }));
      graph.addEdge(new Semantic.SemanticEdge({ id: 'e', sourceId: 'root', targetId: 'leaf', relation: Semantic.SemanticRelationKind.CALLS }));

      const closure = Semantic.DependencyClosure.buildFromProgramGraph(graph);
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        closure.getDependencies('root');
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 150, `10k dependency queries took ${elapsed.toFixed(1)}ms (target <150ms)`);
    });

    it('12.4 10k transitive closures (<300ms)', () => {
      const closure = new Semantic.DependencyClosure();
      closure.addDependency(new Semantic.DependencyEdge({ id: 'd1', sourceId: 'A', targetId: 'B' }));
      closure.addDependency(new Semantic.DependencyEdge({ id: 'd2', sourceId: 'B', targetId: 'C' }));

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        closure.getTransitiveClosure('A', 10);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `10k transitive closures took ${elapsed.toFixed(1)}ms (target <300ms)`);
    });

    it('12.5 10k impact analyses (<400ms)', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'fnCore', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const analyzer = new Semantic.ImpactAnalyzer();
      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnCore' });

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        analyzer.analyze(change, graph);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `10k impact analyses took ${elapsed.toFixed(1)}ms (target <400ms)`);
    });

    it('12.6 10k blast-radius queries (<250ms)', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'fnCore', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const analyzer = new Semantic.ImpactAnalyzer();
      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnCore' });

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        analyzer.analyze(change, graph).blastRadius;
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 250, `10k blast-radius queries took ${elapsed.toFixed(1)}ms (target <250ms)`);
    });

    it('12.7 10k test selections (<300ms)', () => {
      const graph = new Semantic.SemanticProgramGraph();
      graph.addNode(new Semantic.SemanticNode({ id: 'fnCore', kind: Semantic.SemanticEntityKind.FUNCTION }));
      graph.addNode(new Semantic.SemanticNode({ id: 'test1', kind: Semantic.SemanticEntityKind.TEST }));
      const selector = new Semantic.RegressionSelector();
      const change = new Semantic.SemanticChange({ id: 'c', type: Semantic.SemanticChangeType.MODIFIED, targetId: 'fnCore' });

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        selector.selectTests(change, graph);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `10k test selections took ${elapsed.toFixed(1)}ms (target <300ms)`);
    });

    it('12.8 1k architecture analyses (<400ms)', () => {
      const arch = new Semantic.ArchitectureGraph();
      arch.addNode(new Semantic.ArchitectureNode({ id: 'n1', layer: Semantic.ArchitectureLayer.DOMAIN }));
      const analyzer = new Semantic.ArchitectureAnalyzer();

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        analyzer.analyze(arch);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `1k architecture analyses took ${elapsed.toFixed(1)}ms (target <400ms)`);
    });

    it('12.9 1k semantic diffs (<300ms)', () => {
      const g1 = new Semantic.SemanticProgramGraph();
      const g2 = new Semantic.SemanticProgramGraph();
      g1.addNode(new Semantic.SemanticNode({ id: 'n1', kind: Semantic.SemanticEntityKind.FUNCTION }));
      g2.addNode(new Semantic.SemanticNode({ id: 'n1', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        Semantic.SemanticDiff.compareGraphs(g1, g2);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `1k semantic diffs took ${elapsed.toFixed(1)}ms (target <300ms)`);
    });

    it('12.10 1k equivalence checks (<500ms)', () => {
      const n1 = new Semantic.SemanticNode({ id: 'n1', kind: Semantic.SemanticEntityKind.FUNCTION });
      const n2 = new Semantic.SemanticNode({ id: 'n2', kind: Semantic.SemanticEntityKind.FUNCTION });
      const analyzer = new Semantic.EquivalenceAnalyzer();

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        analyzer.checkEquivalence(n1, n2);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `1k equivalence checks took ${elapsed.toFixed(1)}ms (target <500ms)`);
    });

    it('12.11 1k refactoring validations (<500ms)', () => {
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'fn', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const ref = new Semantic.SemanticRefactoring({ id: 'r', type: Semantic.RefactoringType.RENAME_SYMBOL, targetId: 'fn' });
      const validator = new Semantic.RefactoringValidator();

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        validator.validate(ref, g, g);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `1k refactoring validations took ${elapsed.toFixed(1)}ms (target <500ms)`);
    });

    it('12.12 1k semantic snapshots (<400ms)', () => {
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'fn', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        new Semantic.SemanticSnapshot({ id: `snap_${i}`, graphData: g.toJSON() });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `1k snapshots took ${elapsed.toFixed(1)}ms (target <400ms)`);
    });
  });
});
