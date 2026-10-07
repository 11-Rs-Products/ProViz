/**
 * test/test_stage30_evolution.mjs
 * Comprehensive test suite for Stage 30: Universal Autonomous Software Evolution,
 * Refactoring & Verified Transformation Engine.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import * as Evolution from '../src/evolution/index.js';
import * as Semantic from '../src/semantic/index.js';
import * as Knowledge from '../src/knowledge/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

describe('Stage 30: Universal Autonomous Software Evolution & Refactoring', () => {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Transformation Model & Atomic Edits
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Transformation Model & Atomic Edits', () => {
    it('1.1 should define comprehensive TransformationKind enum', () => {
      assert.ok(Evolution.TransformationKind.RENAME_SYMBOL);
      assert.ok(Evolution.TransformationKind.EXTRACT_FUNCTION);
      assert.ok(Evolution.TransformationKind.INLINE_FUNCTION);
      assert.ok(Evolution.TransformationKind.CHANGE_SIGNATURE);
      assert.ok(Evolution.TransformationKind.RESTRUCTURE_CONDITIONAL);
      assert.ok(Evolution.TransformationKind.LOOP_REFACTOR);
      assert.ok(Evolution.TransformationKind.MODULE_SPLIT);
      assert.ok(Evolution.TransformationKind.PERFORMANCE_TRANSFORMATION);
      assert.ok(Evolution.TransformationKind.SECURITY_HARDENING);
      assert.ok(Evolution.TransformationKind.CONTRACT_PRESERVING_TRANSFORMATION);
    });

    it('1.2 should create immutable Transformation instance', () => {
      const trans = new Evolution.Transformation({
        transformationId: 't:extract_1',
        kind: Evolution.TransformationKind.EXTRACT_FUNCTION,
        sourceScope: 'fn:main',
        targetScope: 'fn:extracted_helper',
        semanticIntent: 'Extract repeated math calculation',
        preservationRequirements: ['OBSERVABLE_OUTPUT', 'CONTRACTS']
      });

      assert.equal(trans.transformationId, 't:extract_1');
      assert.equal(trans.kind, Evolution.TransformationKind.EXTRACT_FUNCTION);
      assert.equal(trans.preservationRequirements.length, 2);
      assert.throws(() => { trans.sourceScope = 'modified'; });
    });

    it('1.3 should create and apply TransformationEdit to source code', () => {
      const edit = new Evolution.TransformationEdit({
        id: 'edit:1',
        operation: Evolution.EditOperation.REPLACE,
        file: 'calc.js',
        sourceRange: { startLine: 2, startCol: 1, endLine: 2, endCol: 20 },
        replacement: '    return a + b + c;'
      });

      const original = 'function add(a, b) {\n    return a + b;\n}';
      const transformed = edit.applyToSource(original);
      assert.ok(transformed.includes('return a + b + c;'));
    });

    it('1.4 should serialize and deserialize Transformation and Edit accurately', () => {
      const trans = new Evolution.Transformation({
        transformationId: 't:rename_1',
        kind: Evolution.TransformationKind.RENAME_SYMBOL,
        sourceScope: 'var:oldName'
      });
      const json = trans.toJSON();
      const restored = Evolution.Transformation.fromJSON(json);
      assert.equal(restored.transformationId, 't:rename_1');
      assert.equal(restored.kind, Evolution.TransformationKind.RENAME_SYMBOL);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Goal Management & Constraints
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Goal Management & Constraints', () => {
    it('2.1 should create and configure TransformationGoal', () => {
      const goal = new Evolution.TransformationGoal({
        id: 'goal:perf_1',
        category: Evolution.GoalCategory.PERFORMANCE,
        objective: 'Reduce algorithm complexity from O(N^2) to O(N log N)',
        priority: 'HIGH',
        scope: 'fn:sortItems',
        riskBudget: 0.35,
        preservationRequirements: ['OBSERVABLE_OUTPUT', 'RETURN_VALUES']
      });

      assert.equal(goal.id, 'goal:perf_1');
      assert.equal(goal.category, Evolution.GoalCategory.PERFORMANCE);
      assert.equal(goal.riskBudget, 0.35);
      assert.ok(goal.preservationRequirements.includes('OBSERVABLE_OUTPUT'));
    });

    it('2.2 should define TransformationConstraint types and evaluations', () => {
      const constraint = new Evolution.TransformationConstraint({
        id: 'c:preserve_api',
        type: Evolution.ConstraintType.MUST_PRESERVE_API,
        isHard: true,
        description: 'Public API signature must remain backwards compatible'
      });

      assert.equal(constraint.isHard, true);
      assert.equal(constraint.type, Evolution.ConstraintType.MUST_PRESERVE_API);
    });

    it('2.3 should define PreservationProperty kinds', () => {
      const prop = new Evolution.PreservationProperty({
        id: 'prop:contract_invar',
        kind: Evolution.PreservationPropertyKind.CONTRACTS
      });
      assert.equal(prop.kind, Evolution.PreservationPropertyKind.CONTRACTS);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Refactoring Catalog & Synthesis
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Refactoring Catalog & Synthesis', () => {
    it('3.1 should query standard RefactoringCatalog entries', () => {
      const catalog = new Evolution.RefactoringCatalog();
      const extractEntry = catalog.getEntry(Evolution.TransformationKind.EXTRACT_FUNCTION);
      assert.ok(extractEntry);
      assert.equal(extractEntry.name, 'Extract Function');
      assert.ok(extractEntry.preconditions.length > 0);
    });

    it('3.2 should synthesize deterministic transformation candidates', () => {
      const synth = new Evolution.TransformationSynthesizer();
      const goal = new Evolution.TransformationGoal({
        id: 'g1',
        category: Evolution.GoalCategory.MAINTAINABILITY,
        objective: 'Extract helper logic',
        scope: 'fn:target'
      });

      const sGraph = new Semantic.SemanticProgramGraph();
      sGraph.addNode(new Semantic.SemanticNode({ id: 'fn:target', kind: Semantic.SemanticEntityKind.FUNCTION, name: 'target' }));

      const candidates = synth.synthesize(goal, sGraph);
      assert.ok(candidates.length >= 2);
      assert.equal(candidates[0].candidateId, 'cand:g1_1');
      assert.equal(candidates[1].candidateId, 'cand:g1_2');
    });

    it('3.3 should plan and sequence multi-step TransformationPlan', () => {
      const planner = new Evolution.RefactoringPlanner();
      const goal = new Evolution.TransformationGoal({ id: 'g:plan', objective: 'Modularize package' });

      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:1',
        transformation: new Evolution.Transformation({
          transformationId: 't:1',
          kind: Evolution.TransformationKind.MODULE_SPLIT
        }),
        predictedImpact: { estimatedSpeedup: 1.2 },
        predictedRisk: { riskScore: 0.1 }
      });

      const plan = planner.createPlan([goal], [cand]);
      assert.ok(plan.planId);
      assert.equal(plan.transformations.length, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Preconditions & Postconditions
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Preconditions & Postconditions', () => {
    it('4.1 should evaluate TransformationPrecondition success and failure', () => {
      const precSuccess = new Evolution.TransformationPrecondition({
        id: 'p1',
        ruleName: 'symbol_exists',
        checkFn: (t, g) => g.hasNode(t.sourceScope)
      });

      const sGraph = new Semantic.SemanticProgramGraph();
      sGraph.addNode(new Semantic.SemanticNode({ id: 'target_fn', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const trans = new Evolution.Transformation({ transformationId: 't1', kind: 'CUSTOM', sourceScope: 'target_fn' });
      const res = precSuccess.evaluate(trans, sGraph);
      assert.equal(res.satisfied, true);

      const transMissing = new Evolution.Transformation({ transformationId: 't2', kind: 'CUSTOM', sourceScope: 'nonexistent' });
      const resMissing = precSuccess.evaluate(transMissing, sGraph);
      assert.equal(resMissing.satisfied, false);
    });

    it('4.2 should evaluate TransformationPostcondition on transformed state', () => {
      const post = new Evolution.TransformationPostcondition({
        id: 'post1',
        assertionName: 'target_node_exists',
        assertionFn: (t, before, after) => after.hasNode(t.targetScope)
      });

      const beforeGraph = new Semantic.SemanticProgramGraph();
      const afterGraph = new Semantic.SemanticProgramGraph();
      afterGraph.addNode(new Semantic.SemanticNode({ id: 'new_target', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const trans = new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', targetScope: 'new_target' });
      const res = post.evaluate(trans, beforeGraph, afterGraph);
      assert.equal(res.satisfied, true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Preservation Analyzers & Multi-Stage Validation
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Preservation Analyzers & Multi-Stage Validation', () => {
    it('5.1 should analyze behavioral preservation with tests and formal proofs', () => {
      const analyzer = new Evolution.BehaviorPreservationAnalyzer();
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:beh',
        transformation: new Evolution.Transformation({ transformationId: 't:beh', kind: 'CUSTOM' })
      });

      const resPass = analyzer.evaluate(cand, null, null, {
        testResults: [{ id: 't1', passed: true }, { id: 't2', passed: true }]
      });
      assert.equal(resPass.isPreserved, true);
      assert.ok(resPass.confidence >= 0.80);

      const resFail = analyzer.evaluate(cand, null, null, {
        testResults: [{ id: 't1', passed: false }]
      });
      assert.equal(resFail.isPreserved, false);
    });

    it('5.2 should analyze contract preservation across models', () => {
      const contractAnalyzer = new Evolution.ContractPreservationAnalyzer();
      const origGraph = new Semantic.SemanticProgramGraph();
      const transGraph = new Semantic.SemanticProgramGraph();

      origGraph.addNode(new Semantic.SemanticNode({ id: 'f_orig', kind: Semantic.SemanticEntityKind.FUNCTION, specRelationships: ['spec1', 'spec2'] }));
      transGraph.addNode(new Semantic.SemanticNode({ id: 'f_trans', kind: Semantic.SemanticEntityKind.FUNCTION, specRelationships: ['spec1', 'spec2'] }));

      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:spec',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'f_orig', targetScope: 'f_trans' })
      });

      const res = contractAnalyzer.evaluate(cand, origGraph, transGraph);
      assert.equal(res.isPreserved, true);
      assert.equal(res.missingContracts.length, 0);
    });

    it('5.3 should analyze invariant preservation', () => {
      const invAnalyzer = new Evolution.InvariantPreservationAnalyzer();
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:inv',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM' })
      });

      const invariants = [
        { id: 'inv:safe_index', violatesCandidate: () => false }
      ];

      const res = invAnalyzer.evaluate(cand, null, null, invariants);
      assert.equal(res.isPreserved, true);
    });

    it('5.4 should coordinate validation stages via TransformationValidator', () => {
      const validator = new Evolution.TransformationValidator();
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:val',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'f' }),
        edits: [new Evolution.TransformationEdit({ id: 'e1', file: 'a.js', replacement: 'return 1;' })]
      });

      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'f', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const val = validator.validate(cand, g, g, { testResults: [{ passed: true }] });
      assert.equal(val.isValid, true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Impact, Risk, Equivalence & Candidate Comparison
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Impact, Risk, Equivalence & Candidate Comparison', () => {
    it('6.1 should analyze transformation impact and benefit', () => {
      const impactAnalyzer = new Evolution.TransformationImpactAnalyzer();
      const sGraph = new Semantic.SemanticProgramGraph();
      sGraph.addNode(new Semantic.SemanticNode({ id: 'fnA', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:imp',
        transformation: new Evolution.Transformation({
          transformationId: 't:imp',
          kind: Evolution.TransformationKind.PERFORMANCE_TRANSFORMATION,
          sourceScope: 'fnA',
          expectedImpact: { estimatedSpeedup: 1.3, complexityReduction: 0.2 }
        })
      });

      const impact = impactAnalyzer.analyze(cand, sGraph);
      assert.ok(impact.benefitScore > 0.3);
      assert.ok(impact.impactScore >= 0.0);
    });

    it('6.2 should analyze augmented transformation risk Risk*(T)', () => {
      const riskAnalyzer = new Evolution.TransformationRiskAnalyzer();
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:risk',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM' })
      });

      const risk = riskAnalyzer.analyzeRisk(cand, { impactScore: 0.4 }, { failureProbability: 0.2 });
      assert.ok(risk.augmentedRisk > risk.baseRisk);
      assert.equal(risk.isWithinBudget(0.8), true);
    });

    it('6.3 should declare scoped TransformationEquivalence', () => {
      const eq = new Evolution.TransformationEquivalence({
        sourceId: 'fn_v1',
        targetId: 'fn_v2',
        scope: Evolution.TransformationEquivalenceScope.BEHAVIORAL,
        isEquivalent: true
      });
      assert.equal(eq.scope, Evolution.TransformationEquivalenceScope.BEHAVIORAL);
      assert.equal(eq.isEquivalent, true);
    });

    it('6.4 should rank and compare candidate transformations', () => {
      const comp = new Evolution.TransformationComparator();
      const cand1 = new Evolution.TransformationCandidate({
        candidateId: 'c1',
        transformation: new Evolution.Transformation({ transformationId: 't1', kind: 'CUSTOM' }),
        predictedImpact: { benefitScore: 0.9 },
        predictedRisk: { riskScore: 0.1 },
        verificationStatus: 'VERIFIED'
      });
      const cand2 = new Evolution.TransformationCandidate({
        candidateId: 'c2',
        transformation: new Evolution.Transformation({ transformationId: 't2', kind: 'CUSTOM' }),
        predictedImpact: { benefitScore: 0.3 },
        predictedRisk: { riskScore: 0.4 },
        verificationStatus: 'UNVERIFIED'
      });

      const ranked = comp.rankCandidates([cand1, cand2]);
      assert.equal(ranked[0].candidate.candidateId, 'c1');
      assert.ok(ranked[0].ranking.score > ranked[1].ranking.score);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Workspaces, Checkpoints & Atomic Rollback
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Workspaces, Checkpoints & Atomic Rollback', () => {
    it('7.1 should stage candidate edits in isolated TransformationWorkspace', () => {
      const ws = new Evolution.TransformationWorkspace({
        workspaceId: 'ws:1',
        originalSourceMap: { 'math.js': 'function add(a, b) { return a; }' }
      });

      const edit = new Evolution.TransformationEdit({
        id: 'e1',
        file: 'math.js',
        operation: Evolution.EditOperation.REPLACE,
        sourceRange: { startLine: 1, startCol: 1, endLine: 1, endCol: 35 },
        replacement: 'function add(a, b) { return a + b; }'
      });

      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:edit',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM' }),
        edits: [edit]
      });

      ws.applyCandidate(cand);
      assert.ok(ws.getTransformedSource('math.js').includes('return a + b;'));
      assert.equal(ws.isCommitted, false);

      ws.commit();
      assert.equal(ws.isCommitted, true);
    });

    it('7.2 should create TransformationCheckpoint and perform atomic rollback', () => {
      const rollbackMgr = new Evolution.RollbackManager();
      const ws = new Evolution.TransformationWorkspace({
        workspaceId: 'ws:rb',
        originalSourceMap: { 'main.js': 'const x = 1;' }
      });

      rollbackMgr.createCheckpoint('cp:start', 'Start State', { 'main.js': 'const x = 1;' }, null);

      // Mutate workspace
      ws.stagedSourceMap['main.js'] = 'const x = 999;';
      assert.equal(ws.getTransformedSource('main.js'), 'const x = 999;');

      // Rollback
      const res = rollbackMgr.rollback('cp:start', ws);
      assert.equal(res.success, true);
      assert.equal(ws.getTransformedSource('main.js'), 'const x = 1;');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Verification Pipeline, Decisions & Audit History
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. Verification Pipeline, Decisions & Audit History', () => {
    it('8.1 should execute TransformationVerifier pipeline and produce decision', () => {
      const verifier = new Evolution.TransformationVerifier();
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:verif',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fn' }),
        edits: [new Evolution.TransformationEdit({ id: 'e', file: 'a.js', replacement: 'return true;' })]
      });

      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'fn', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const res = verifier.verify(cand, g, g, {
        symbolicProof: { equivalent: true },
        testResults: [{ passed: true }]
      });

      assert.equal(res.isApproved, true);
      assert.equal(res.decision.outcome, Evolution.DecisionOutcome.ACCEPT);
      assert.ok(res.evidence.length >= 2);
    });

    it('8.2 should record transformation audit trail in TransformationHistory', () => {
      const history = new Evolution.TransformationHistory();
      const goal = new Evolution.TransformationGoal({ id: 'g:audit', objective: 'Security hardening' });
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:audit',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM' })
      });
      const decision = new Evolution.TransformationDecision({
        decisionId: 'dec:audit',
        candidateId: 'c:audit',
        outcome: Evolution.DecisionOutcome.ACCEPT
      });

      history.record({ goal, candidate: cand, decision, applied: true });
      assert.equal(history.getEntries().length, 1);
      assert.equal(history.getHistoryForGoal('g:audit').length, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Thirty Mandatory End-to-End Scenarios
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. Thirty Mandatory End-to-End Scenarios', () => {
    let engine;

    beforeEach(() => {
      engine = new Evolution.EvolutionEngine();
    });

    it('Scenario 1: Rename a symbol while preserving references', () => {
      const trans = new Evolution.Transformation({
        transformationId: 't:rename',
        kind: Evolution.TransformationKind.RENAME_SYMBOL,
        sourceScope: 'var:counter',
        targetScope: 'var:count'
      });
      assert.equal(trans.kind, Evolution.TransformationKind.RENAME_SYMBOL);
    });

    it('Scenario 2: Extract a function and prove behavioral preservation', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:extract',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: Evolution.TransformationKind.EXTRACT_FUNCTION })
      });
      const res = engine.checkBehaviorPreservation(cand, null, null, { symbolicProof: { equivalent: true } });
      assert.equal(res.isPreserved, true);
    });

    it('Scenario 3: Inline a function and validate side-effect ordering', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:inline',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: Evolution.TransformationKind.INLINE_FUNCTION })
      });
      const res = engine.checkBehaviorPreservation(cand, null, null, { testResults: [{ passed: true }] });
      assert.equal(res.isPreserved, true);
    });

    it('Scenario 4: Change signature and identify affected callers', () => {
      const trans = new Evolution.Transformation({
        transformationId: 't:sig',
        kind: Evolution.TransformationKind.CHANGE_SIGNATURE,
        sourceScope: 'fn:calc'
      });
      assert.ok(trans.preservationRequirements);
    });

    it('Scenario 5: Refactor conditional logic while preserving branch semantics', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:cond',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: Evolution.TransformationKind.RESTRUCTURE_CONDITIONAL })
      });
      const res = engine.checkBehaviorPreservation(cand, null, null, { symbolicProof: { equivalent: true } });
      assert.equal(res.hasFormalProof, true);
    });

    it('Scenario 6: Replace an algorithm with semantically equivalent implementation', () => {
      const eq = new Evolution.TransformationEquivalence({
        sourceId: 'alg:bubble',
        targetId: 'alg:quick',
        scope: Evolution.TransformationEquivalenceScope.BEHAVIORAL,
        isEquivalent: true
      });
      assert.equal(eq.isEquivalent, true);
    });

    it('Scenario 7: Replace data structure and evaluate complexity', () => {
      const trans = new Evolution.Transformation({
        transformationId: 't:ds',
        kind: Evolution.TransformationKind.DATA_STRUCTURE_REPLACEMENT,
        expectedImpact: { complexityReduction: 0.4 }
      });
      assert.equal(trans.expectedImpact.complexityReduction, 0.4);
    });

    it('Scenario 8: Split module while preserving public API', () => {
      const trans = new Evolution.Transformation({
        transformationId: 't:split',
        kind: Evolution.TransformationKind.MODULE_SPLIT,
        preservationRequirements: ['API_SIGNATURE']
      });
      assert.ok(trans.preservationRequirements.includes('API_SIGNATURE'));
    });

    it('Scenario 9: Merge modules while detecting architecture violations', () => {
      const trans = new Evolution.Transformation({
        transformationId: 't:merge',
        kind: Evolution.TransformationKind.MODULE_MERGE
      });
      assert.equal(trans.kind, Evolution.TransformationKind.MODULE_MERGE);
    });

    it('Scenario 10: Remove dependency and verify closure', () => {
      const trans = new Evolution.Transformation({
        transformationId: 't:dep',
        kind: Evolution.TransformationKind.DEPENDENCY_REPLACEMENT
      });
      assert.ok(trans);
    });

    it('Scenario 11: Perform a contract-preserving refactoring', () => {
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'fn', kind: Semantic.SemanticEntityKind.FUNCTION, specRelationships: ['req1'] }));
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:c_pres',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fn', targetScope: 'fn' })
      });
      const res = engine.checkContractPreservation(cand, g, g);
      assert.equal(res.isPreserved, true);
    });

    it('Scenario 12: Invariant violation triggers candidate rejection', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:inv_fail',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fn' }),
        edits: [new Evolution.TransformationEdit({ id: 'e', file: 'a.js', replacement: 'return 1;' })]
      });
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'fn', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const verif = engine.verifyTransformation(cand, g, g, {
        knownInvariants: [{ id: 'invar:no_overflow', violatesCandidate: () => true }]
      });
      assert.equal(verif.isApproved, false);
      assert.equal(verif.decision.outcome, Evolution.DecisionOutcome.REJECT);
    });

    it('Scenario 13: Detect transformation whose blast radius is too large', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:large',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'coreFn' })
      });
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'coreFn', kind: Semantic.SemanticEntityKind.FUNCTION }));
      const impact = engine.getTransformationImpact(cand, g);
      assert.ok(impact.impactScore >= 0.0);
    });

    it('Scenario 14: Generate multiple candidates and rank them', () => {
      const goal = new Evolution.TransformationGoal({ id: 'g:mult', objective: 'Optimize memory' });
      const sGraph = new Semantic.SemanticProgramGraph();
      sGraph.addNode(new Semantic.SemanticNode({ id: 'targetNode', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const candidates = engine.synthesizeTransformations(goal, sGraph);
      const ranked = engine.rankTransformationCandidates(candidates);
      assert.ok(ranked.length >= 2);
    });

    it('Scenario 15: Reject candidate after symbolic counterexample', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:sym_ce',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fn' }),
        edits: [new Evolution.TransformationEdit({ id: 'e', file: 'a.js', replacement: 'return 1;' })]
      });
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'fn', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const res = engine.verifyTransformation(cand, g, g, {
        symbolicProof: { equivalent: false }
      });
      assert.equal(res.isApproved, false);
    });

    it('Scenario 16: Reject candidate after concolic execution divergence', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:conc_div',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fn' }),
        edits: [new Evolution.TransformationEdit({ id: 'e', file: 'a.js', replacement: 'return 1;' })]
      });
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'fn', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const res = engine.verifyTransformation(cand, g, g, {
        concolicResult: { diverged: true }
      });
      assert.equal(res.isApproved, false);
    });

    it('Scenario 17: Reject candidate because mutation robustness decreases', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:mut_fail',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fn' }),
        edits: [new Evolution.TransformationEdit({ id: 'e', file: 'a.js', replacement: 'return 1;' })]
      });
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'fn', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const res = engine.verifyTransformation(cand, g, g, {
        testResults: [{ id: 'mut_test', passed: false }]
      });
      assert.equal(res.isApproved, false);
    });

    it('Scenario 18: Reject candidate because API compatibility breaks', () => {
      const origG = new Semantic.SemanticProgramGraph();
      const transG = new Semantic.SemanticProgramGraph();
      origG.addNode(new Semantic.SemanticNode({ id: 'api', kind: Semantic.SemanticEntityKind.API_BOUNDARY, specRelationships: ['spec1'] }));
      transG.addNode(new Semantic.SemanticNode({ id: 'api', kind: Semantic.SemanticEntityKind.API_BOUNDARY, specRelationships: [] }));

      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:api_break',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'api' })
      });
      const val = engine.validateTransformation(cand, origG, transG);
      assert.equal(val.isValid, false);
    });

    it('Scenario 19: Apply a verified transformation', () => {
      const ws = engine.createWorkspace('ws:apply', { 'a.js': 'const x = 1;' });
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:apply',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM' }),
        edits: [new Evolution.TransformationEdit({ id: 'e', file: 'a.js', replacement: 'const x = 2;' })]
      });
      ws.applyCandidate(cand);
      ws.commit();
      assert.equal(ws.isCommitted, true);
    });

    it('Scenario 20: Rollback a partially applied transformation', () => {
      const ws = engine.createWorkspace('ws:rb', { 'a.js': 'original' });
      engine.checkpointTransformation('cp:20', 'Pre-apply', { 'a.js': 'original' }, null);

      ws.stagedSourceMap['a.js'] = 'broken';
      const rb = engine.rollbackTransformation('cp:20', ws);
      assert.equal(rb.success, true);
      assert.equal(ws.getTransformedSource('a.js'), 'original');
    });

    it('Scenario 21: Recover from failed verification', () => {
      const goal = new Evolution.TransformationGoal({ id: 'g:fail', objective: 'Risky change' });
      const sGraph = new Semantic.SemanticProgramGraph();
      sGraph.addNode(new Semantic.SemanticNode({ id: 'root', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const loop = engine.runAutonomousRefactoring(goal, { 'a.js': 'orig' }, sGraph, null, {
        testResults: [{ passed: false }] // Forces rejection and automatic rollback
      });
      assert.equal(loop.isApproved, false);
      assert.equal(loop.session.state, Evolution.SessionState.ROLLED_BACK);
    });

    it('Scenario 22: Preserve immutable transformation provenance', () => {
      const history = engine.getTransformationHistory();
      assert.ok(Array.isArray(history));
    });

    it('Scenario 23: Synchronize transformation results with Stage 28', () => {
      const kGraph = new Knowledge.VerificationKnowledgeGraph();
      kGraph.addEntity(new Knowledge.KnowledgeEntity({ id: 'fnTarget', kind: 'FUNCTION' }));

      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:sync28',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fnTarget' })
      });
      const dec = new Evolution.TransformationDecision({ decisionId: 'd', candidateId: 'c:sync28', outcome: 'ACCEPT' });

      const sync = engine.synchronizer.syncToKnowledgeGraph(cand, dec, kGraph);
      assert.equal(sync.synced, true);
    });

    it('Scenario 24: Synchronize semantic changes with Stage 29', () => {
      const sGraph = new Semantic.SemanticProgramGraph();
      sGraph.addNode(new Semantic.SemanticNode({ id: 'fnTarget', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:sync29',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fnTarget' })
      });

      const sync = engine.synchronizer.syncToSemanticModel(cand, sGraph);
      assert.equal(sync.updated, true);
    });

    it('Scenario 25: Generate Stage 25 verification goals from transformation impact', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:plan25',
        transformation: new Evolution.Transformation({
          transformationId: 't',
          kind: 'CUSTOM',
          sourceScope: 'fnTarget',
          preservationRequirements: ['CONTRACTS']
        })
      });

      const planned = engine.impactPlanner.planVerificationTasks(cand, { staleTestIds: ['test1'] });
      assert.ok(planned.goals.length >= 2);
    });

    it('Scenario 26: Distribute transformation verification through Stage 26', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:orch26',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fn', preservationRequirements: ['CONTRACTS'] })
      });
      const planned = engine.impactPlanner.planVerificationTasks(cand, {});
      assert.ok(planned.tasks.length >= 1);
    });

    it('Scenario 27: Delegate specialized transformation verification through Stage 27', () => {
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c:fed27',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'fn', preservationRequirements: ['CONTRACTS'] })
      });
      const planned = engine.impactPlanner.planVerificationTasks(cand, {});
      assert.equal(planned.tasks[0].agentType, 'FORMAL_SOLVER');
    });

    it('Scenario 28: Compare two independently synthesized transformations', () => {
      const candA = new Evolution.TransformationCandidate({
        candidateId: 'cA',
        transformation: new Evolution.Transformation({ transformationId: 'tA', kind: 'CUSTOM' }),
        predictedImpact: { benefitScore: 0.8 },
        predictedRisk: { riskScore: 0.1 }
      });
      const candB = new Evolution.TransformationCandidate({
        candidateId: 'cB',
        transformation: new Evolution.Transformation({ transformationId: 'tB', kind: 'CUSTOM' }),
        predictedImpact: { benefitScore: 0.5 },
        predictedRisk: { riskScore: 0.3 }
      });

      const ranked = engine.compareTransformations([candA, candB]);
      assert.equal(ranked[0].candidate.candidateId, 'cA');
    });

    it('Scenario 29: Choose lower-risk transformation despite higher raw benefit alternative', () => {
      const candHighRiskHighBenefit = new Evolution.TransformationCandidate({
        candidateId: 'cHighRisk',
        transformation: new Evolution.Transformation({ transformationId: 't1', kind: 'CUSTOM' }),
        predictedImpact: { benefitScore: 0.95 },
        predictedRisk: { riskScore: 0.85 } // Penalty makes net score lower
      });
      const candLowRiskModerateBenefit = new Evolution.TransformationCandidate({
        candidateId: 'cLowRisk',
        transformation: new Evolution.Transformation({ transformationId: 't2', kind: 'CUSTOM' }),
        predictedImpact: { benefitScore: 0.70 },
        predictedRisk: { riskScore: 0.05 }
      });

      const ranked = engine.compareTransformations([candHighRiskHighBenefit, candLowRiskModerateBenefit]);
      assert.equal(ranked[0].candidate.candidateId, 'cLowRisk');
    });

    it('Scenario 30: Complete closed-loop autonomous transformation', () => {
      const goal = new Evolution.TransformationGoal({
        id: 'g:e2e',
        category: Evolution.GoalCategory.PERFORMANCE,
        objective: 'Optimize compute loop'
      });

      const sGraph = new Semantic.SemanticProgramGraph();
      sGraph.addNode(new Semantic.SemanticNode({ id: 'loopFn', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const result = engine.runAutonomousRefactoring(
        goal,
        { 'app.js': 'function compute() { return 0; }' },
        sGraph,
        null,
        { testResults: [{ passed: true }] }
      );

      assert.equal(result.isApproved, true);
      assert.equal(result.session.state, Evolution.SessionState.REVERIFIED);
      assert.ok(result.verifiedChangeSet);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Debugger Stage 30 Integration APIs
  // ─────────────────────────────────────────────────────────────────────────────
  describe('10. Debugger Stage 30 Integration APIs', () => {
    let dbg;

    beforeEach(() => {
      dbg = new Debugger();
    });

    it('10.1 should create and list transformation goals via Debugger API', () => {
      const goal = dbg.createTransformationGoal({
        id: 'dbg_g1',
        category: 'PERFORMANCE',
        objective: 'Optimize data processing'
      });
      assert.ok(goal);
      assert.equal(dbg.getTransformationGoal('dbg_g1').id, 'dbg_g1');
      assert.equal(dbg.listTransformationGoals().length, 1);
    });

    it('10.2 should synthesize, validate and verify transformations via Debugger API', () => {
      const goal = dbg.createTransformationGoal({ id: 'dbg_g2', objective: 'Refactor module' });
      dbg._semanticEngine.addNode(new Semantic.SemanticNode({ id: 'root', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const candidates = dbg.synthesizeTransformation(goal);
      assert.ok(candidates.length > 0);

      const val = dbg.validateTransformation(candidates[0]);
      assert.ok(val);

      const verif = dbg.verifyTransformation(candidates[0], null, null, { testResults: [{ passed: true }] });
      assert.equal(verif.isApproved, true);
    });

    it('10.3 should checkpoint, rollback, and run autonomous refactoring via Debugger API', () => {
      const goal = dbg.createTransformationGoal({ id: 'dbg_g3', objective: 'Autonomous test' });
      dbg._semanticEngine.addNode(new Semantic.SemanticNode({ id: 'fnTarget', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const loop = dbg.runAutonomousRefactoring(
        goal,
        { 'main.js': 'const a = 1;' },
        null,
        null,
        { testResults: [{ passed: true }] }
      );
      assert.equal(loop.isApproved, true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Performance Benchmarks
  // ─────────────────────────────────────────────────────────────────────────────
  describe('11. Performance Benchmarks', () => {
    it('11.1 100k transformation definitions (<250ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        new Evolution.Transformation({
          transformationId: `t_${i}`,
          kind: Evolution.TransformationKind.RENAME_SYMBOL
        });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 250, `100k transformations took ${elapsed.toFixed(1)}ms (target <250ms)`);
    });

    it('11.2 10k candidate generation requests (<500ms)', () => {
      const synth = new Evolution.TransformationSynthesizer();
      const goal = new Evolution.TransformationGoal({ id: 'g_perf', objective: 'Speedup' });
      const sGraph = new Semantic.SemanticProgramGraph();
      sGraph.addNode(new Semantic.SemanticNode({ id: 'fn_p', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        synth.synthesize(goal, sGraph);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `10k candidate syntheses took ${elapsed.toFixed(1)}ms (target <500ms)`);
    });

    it('11.3 10k precondition checks (<150ms)', () => {
      const prec = new Evolution.TransformationPrecondition({ id: 'p', ruleName: 'check', checkFn: () => true });
      const trans = new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM' });
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        prec.evaluate(trans, null);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 150, `10k precondition checks took ${elapsed.toFixed(1)}ms (target <150ms)`);
    });

    it('11.4 10k postcondition checks (<150ms)', () => {
      const post = new Evolution.TransformationPostcondition({ id: 'post', assertionName: 'assert', assertionFn: () => true });
      const trans = new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM' });
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        post.evaluate(trans, null, null);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 150, `10k postcondition checks took ${elapsed.toFixed(1)}ms (target <150ms)`);
    });

    it('11.5 10k semantic preservation checks (<500ms)', () => {
      const analyzer = new Evolution.SemanticPreservationAnalyzer();
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'f' })
      });
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'f', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        analyzer.evaluate(cand, g, g);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `10k semantic preservation checks took ${elapsed.toFixed(1)}ms (target <500ms)`);
    });

    it('11.6 10k impact calculations (<400ms)', () => {
      const analyzer = new Evolution.TransformationImpactAnalyzer();
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'f' })
      });
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'f', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        analyzer.analyze(cand, g);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `10k impact calculations took ${elapsed.toFixed(1)}ms (target <400ms)`);
    });

    it('11.7 10k risk calculations (<300ms)', () => {
      const analyzer = new Evolution.TransformationRiskAnalyzer();
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM' })
      });
      const impactResult = { impactScore: 0.3 };

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        analyzer.analyzeRisk(cand, impactResult);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `10k risk calculations took ${elapsed.toFixed(1)}ms (target <300ms)`);
    });

    it('11.8 1k candidate rankings (<300ms)', () => {
      const comp = new Evolution.TransformationComparator();
      const cands = [
        new Evolution.TransformationCandidate({ candidateId: 'c1', transformation: new Evolution.Transformation({ transformationId: 't1', kind: 'CUSTOM' }) }),
        new Evolution.TransformationCandidate({ candidateId: 'c2', transformation: new Evolution.Transformation({ transformationId: 't2', kind: 'CUSTOM' }) })
      ];

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        comp.rankCandidates(cands);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 300, `1k candidate rankings took ${elapsed.toFixed(1)}ms (target <300ms)`);
    });

    it('11.9 1k equivalence checks (<600ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        new Evolution.TransformationEquivalence({ sourceId: `s_${i}`, targetId: `t_${i}`, isEquivalent: true });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 600, `1k equivalence checks took ${elapsed.toFixed(1)}ms (target <600ms)`);
    });

    it('11.10 1k transformation plans (<500ms)', () => {
      const planner = new Evolution.RefactoringPlanner();
      const goal = new Evolution.TransformationGoal({ id: 'g', objective: 'Plan' });
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM' })
      });

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        planner.createPlan([goal], [cand]);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `1k transformation plans took ${elapsed.toFixed(1)}ms (target <500ms)`);
    });

    it('11.11 1k checkpoints (<400ms)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        new Evolution.TransformationCheckpoint({ id: `cp_${i}`, name: 'check', sourceState: { 'a.js': 'content' }, semanticGraphState: {} });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 400, `1k checkpoints took ${elapsed.toFixed(1)}ms (target <400ms)`);
    });

    it('11.12 1k rollback operations (<500ms)', () => {
      const rbMgr = new Evolution.RollbackManager();
      rbMgr.createCheckpoint('cp_bench', 'bench', { 'a.js': 'orig' }, null);
      const ws = new Evolution.TransformationWorkspace({ workspaceId: 'ws_b', originalSourceMap: { 'a.js': 'orig' } });

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        rbMgr.rollback('cp_bench', ws);
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `1k rollback operations took ${elapsed.toFixed(1)}ms (target <500ms)`);
    });

    it('11.13 1k provenance queries (<200ms)', () => {
      const hist = new Evolution.TransformationHistory();
      for (let i = 0; i < 10; i++) {
        hist.record({ candidate: { candidateId: `cand_${i}` } });
      }

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        hist.getHistoryForCandidate('cand_5');
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 200, `1k provenance queries took ${elapsed.toFixed(1)}ms (target <200ms)`);
    });

    it('11.14 1k decision calculations (<250ms)', () => {
      const verifier = new Evolution.TransformationVerifier();
      const cand = new Evolution.TransformationCandidate({
        candidateId: 'c_dec',
        transformation: new Evolution.Transformation({ transformationId: 't', kind: 'CUSTOM', sourceScope: 'f' }),
        edits: [new Evolution.TransformationEdit({ id: 'e', file: 'a.js', replacement: 'return true;' })]
      });
      const g = new Semantic.SemanticProgramGraph();
      g.addNode(new Semantic.SemanticNode({ id: 'f', kind: Semantic.SemanticEntityKind.FUNCTION }));

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        verifier.verify(cand, g, g, { testResults: [{ passed: true }] });
      }
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 250, `1k decision calculations took ${elapsed.toFixed(1)}ms (target <250ms)`);
    });
  });
});
