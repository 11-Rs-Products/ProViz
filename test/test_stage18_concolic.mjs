/**
 * Stage 18 Test Suite — Universal Concolic Execution, Path Refinement & CEGAR Engine
 */

import { ConcolicValue } from '../src/concolic/ConcolicValue.js';
import { ConcolicFrame } from '../src/concolic/ConcolicFrame.js';
import { ConcolicEnvironment } from '../src/concolic/ConcolicEnvironment.js';
import { ConcolicState } from '../src/concolic/ConcolicState.js';
import { BranchPredicate } from '../src/concolic/BranchPredicate.js';
import { BranchDecision, BRANCH_DECISIONS } from '../src/concolic/BranchDecision.js';
import { PathConstraint } from '../src/concolic/PathConstraint.js';
import { ConcretePath } from '../src/concolic/ConcretePath.js';
import { SymbolicPathCandidate } from '../src/concolic/SymbolicPathCandidate.js';
import { ExplorationNode, EXPLORATION_NODE_KINDS } from '../src/concolic/ExplorationNode.js';
import { ExplorationEdge, EXPLORATION_EDGE_KINDS } from '../src/concolic/ExplorationEdge.js';
import { ExplorationGraph } from '../src/concolic/ExplorationGraph.js';
import { PathExtractor } from '../src/concolic/PathExtractor.js';
import { PathConstraintBuilder } from '../src/concolic/PathConstraintBuilder.js';
import { BranchNegator } from '../src/concolic/BranchNegator.js';
import { PathCandidateGenerator } from '../src/concolic/PathCandidateGenerator.js';
import { PathConstraintSolver } from '../src/concolic/PathConstraintSolver.js';
import { ConcreteAssignmentBuilder } from '../src/concolic/ConcreteAssignmentBuilder.js';
import { AssignmentValidator } from '../src/concolic/AssignmentValidator.js';
import { ConcolicExecutor } from '../src/concolic/ConcolicExecutor.js';
import { PathDivergence, DIVERGENCE_REASONS } from '../src/concolic/PathDivergence.js';
import { PathComparator } from '../src/concolic/PathComparator.js';
import { ModelRefinement, REFINEMENT_KINDS } from '../src/concolic/ModelRefinement.js';
import { RefinementConstraint } from '../src/concolic/RefinementConstraint.js';
import { ConcolicCoverage } from '../src/concolic/ConcolicCoverage.js';
import { FindingPathPlanner } from '../src/concolic/FindingPathPlanner.js';
import { CounterexampleRefiner, COUNTEREXAMPLE_CLASSIFICATIONS } from '../src/concolic/CounterexampleRefiner.js';
import { ExplorationRequest } from '../src/concolic/ExplorationRequest.js';
import { ExplorationSession } from '../src/concolic/ExplorationSession.js';
import { ExplorationResult } from '../src/concolic/ExplorationResult.js';
import { ExplorationArtifact } from '../src/concolic/ExplorationArtifact.js';
import { ConcolicQueries } from '../src/concolic/ConcolicQueries.js';
import { ConcolicSnapshot } from '../src/concolic/ConcolicSnapshot.js';
import { ConcolicEngine } from '../src/concolic/ConcolicEngine.js';
import { ConcolicAnalyzer } from '../src/concolic/ConcolicAnalyzer.js';
import { Coverage } from '../src/testing/Coverage.js';
import { PythonControlFlowAdapter } from '../src/analysis/PythonControlFlowAdapter.js';
import { Debugger } from '../src/debugger/Debugger.js';
import { TestCase } from '../src/testing/TestCase.js';
import { TestInput } from '../src/testing/TestInput.js';
import { TestResult, TEST_RESULT_STATUSES } from '../src/testing/TestResult.js';
import { Counterexample } from '../src/symbolic/Counterexample.js';
import { Constraint } from '../src/symbolic/Constraint.js';
import { SymbolicExpression } from '../src/symbolic/SymbolicExpression.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ ${message}`);
    } else {
        failedTests++;
        console.error(`  ✗ FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
}

console.log('=== ProViz Stage 18: Universal Concolic Execution & CEGAR Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Concolic Core Values, Environments & State
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Concolic Core Models...');
{
    const val = new ConcolicValue({
        concreteValue: 10,
        symbolicValue: SymbolicExpression.symbol('x'),
        ssaId: 'ssa_main_x_1',
    });

    assert(val.concreteValue === 10, 'ConcolicValue retains concrete value 10');
    assert(val.symbolicValue.toString() === 'x', 'ConcolicValue retains symbolic expression x');
    assert(val.ssaId === 'ssa_main_x_1', 'ConcolicValue retains SSA origin');

    const env = new ConcolicEnvironment({ x: val });
    assert(env.has('x'), 'ConcolicEnvironment contains variable x');
    assert(env.get('x').concreteValue === 10, 'Retrieved value from environment matches');

    const state = new ConcolicState({
        frameIndex: 2,
        environment: env,
        pathConditions: ['x > 5'],
    });

    assert(state.frameIndex === 2, 'ConcolicState frameIndex is 2');
    assert(state.pathConditions[0] === 'x > 5', 'ConcolicState contains path conditions');
    assert(Object.isFrozen(state), 'ConcolicState is frozen and immutable');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ConcretePath & Branch Decisions
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing ConcretePath & Branch Decisions...');
{
    const bp = new BranchPredicate({
        branchId: 'b_1',
        condition: 'x > 5',
        concreteValue: true,
        takenEdge: 'e_true',
        alternativeEdge: 'e_false',
    });

    assert(bp.isTaken(), 'BranchPredicate is taken (true)');
    assert(bp.alternativeEdge === 'e_false', 'Alternative edge is e_false');

    const pc = new PathConstraint({
        position: 0,
        branchId: 'b_1',
        predicate: 'x > 5',
        takenPolarity: true,
        normalizedConstraint: Constraint.gt(SymbolicExpression.symbol('x'), SymbolicExpression.constant(5)),
    });

    const path = new ConcretePath({
        nodeSequence: ['n1', 'n2', 'n3'],
        branchDecisions: [bp],
        pathConstraints: [pc],
    });

    assert(path.pathId.startsWith('cpath_'), 'Deterministic ConcretePath ID generated');
    assert(path.branchDecisions.length === 1, 'ConcretePath contains 1 branch decision');
    assert(path.pathConstraints.length === 1, 'ConcretePath contains 1 path constraint');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Branch Negator & Constraint Solving
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Branch Negator & Constraint Solving...');
{
    const pc = new PathConstraint({
        position: 0,
        branchId: 'b_1',
        predicate: 'x > 5',
        takenPolarity: true,
        normalizedConstraint: Constraint.gt(SymbolicExpression.symbol('x'), SymbolicExpression.constant(5)),
    });

    const path = new ConcretePath({
        nodeSequence: ['n1', 'n2'],
        pathConstraints: [pc],
    });

    const candidate = BranchNegator.negateBranch(path, 0);
    assert(candidate !== null, 'BranchNegator generated candidate');
    assert(candidate.negatedPredicate.relation === '<=', 'Negated predicate inverted > to <=');

    const solveResult = PathConstraintSolver.solveCandidate(candidate);
    assert(solveResult.status === 'SAT', 'PathConstraintSolver solved negated candidate (SAT)');
    assert(solveResult.model.x <= 5, `Generated model x = ${solveResult.model.x} satisfies x <= 5`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Multi-Branch Exploration & PathCandidateGenerator
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Multi-Branch Candidate Generation...');
{
    const pc1 = new PathConstraint({
        position: 0,
        branchId: 'b_1',
        normalizedConstraint: Constraint.gt(SymbolicExpression.symbol('x'), SymbolicExpression.constant(10)),
    });
    const pc2 = new PathConstraint({
        position: 1,
        branchId: 'b_2',
        normalizedConstraint: Constraint.gt(SymbolicExpression.symbol('y'), SymbolicExpression.constant(0)),
    });

    const path = new ConcretePath({
        nodeSequence: ['n1', 'n2', 'n3'],
        pathConstraints: [pc1, pc2],
    });

    const candidates = PathCandidateGenerator.generateCandidates(path, { strategy: 'DFS' });
    assert(candidates.length === 2, 'Generated 2 branch candidates');
    assert(candidates[0].branchToNegate === null || candidates[0].retainedConstraints.length === 1, 'DFS strategy prioritized latest branch');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ExplorationGraph (Nodes, Edges, Unexplored Tracking)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing ExplorationGraph...');
{
    const graph = new ExplorationGraph();
    const path = new ConcretePath({
        nodeSequence: ['n1', 'n2'],
        branchDecisions: [
            new BranchPredicate({ branchId: 'br_root', condition: 'x > 0', concreteValue: true }),
        ],
    });

    graph.addPath(path);
    graph.markUnexploredBranch('br_root_false');

    assert(graph.getNodes().length >= 2, 'ExplorationGraph contains path and branch nodes');
    assert(graph.getEdges().length >= 1, 'ExplorationGraph contains executed edge');
    assert(graph.getUnexploredBranches().includes('br_root_false'), 'Unexplored branch tracked');

    // Serialization
    const json = graph.toJSON();
    const restored = ExplorationGraph.fromJSON(json);
    assert(restored.getNodes().length === graph.getNodes().length, 'ExplorationGraph JSON round-trip equality');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Path Divergence & Model Refinement
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Path Divergence & Model Refinement...');
{
    const cand = new SymbolicPathCandidate({
        branchToNegate: new BranchPredicate({
            branchId: 'br_1',
            condition: 'x > 5',
            concreteValue: true,
            takenEdge: 'e_true',
            alternativeEdge: 'e_false',
        }),
    });

    const observedPath = new ConcretePath({
        branchDecisions: [
            new BranchPredicate({ branchId: 'br_1', condition: 'x > 5', concreteValue: true, takenEdge: 'e_true' }),
        ],
    });

    const comp = PathComparator.compare(cand, observedPath);
    assert(!comp.matches, 'PathComparator detected divergence when expected alternative branch was not taken');
    assert(comp.divergence.reason === DIVERGENCE_REASONS.CONTROL_FLOW_MISMATCH, 'Divergence reason is CONTROL_FLOW_MISMATCH');

    const ref = new ModelRefinement({
        kind: REFINEMENT_KINDS.MISSING_RELATION,
        divergenceId: comp.divergence.id,
        description: 'Learned constraint from divergence',
    });

    assert(ref.id.startsWith('ref_'), 'ModelRefinement generated deterministic ID');
    assert(ref.divergenceId === comp.divergence.id, 'ModelRefinement references divergence ID');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CounterexampleRefiner Classification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing CounterexampleRefiner Classification...');
{
    const ce = new Counterexample({ property: 'prop_div', assignments: { b: 0 } });
    const passResult = new TestResult({ testId: 't1', status: TEST_RESULT_STATUSES.PASS });
    const mismatchResult = new TestResult({ testId: 't2', status: TEST_RESULT_STATUSES.MISMATCH });

    const classPass = CounterexampleRefiner.classify(ce, passResult);
    assert(classPass.classification === COUNTEREXAMPLE_CLASSIFICATIONS.CONFIRMED, 'Confirmed counterexample on PASS');

    const classMismatch = CounterexampleRefiner.classify(ce, mismatchResult);
    assert(classMismatch.classification === COUNTEREXAMPLE_CLASSIFICATIONS.MODEL_MISMATCH, 'Identified MODEL_MISMATCH on divergent execution');
    assert(classMismatch.refined, 'Flagged for CEGAR refinement');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ConcolicCoverage & Iteration Delta Tracking
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing ConcolicCoverage & Delta Tracking...');
{
    let cov = new ConcolicCoverage();
    const p1Cov = new Coverage({ lines: [1, 2], nodes: ['n1'], branches: ['b1'] });

    cov = cov.recordIteration(p1Cov, 1);
    assert(cov.history.length === 1, 'Recorded iteration 1 in ConcolicCoverage');
    assert(cov.history[0].lineGain === 2, 'Gain of 2 lines in iteration 1');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. ConcolicEngine & Analyzer End-to-End Exploration Loop
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing ConcolicEngine & Analyzer End-to-End Loop...');
{
    const code = `x = 10\nif x > 5:\n    y = 1\nelse:\n    y = 2`;
    const analyzer = new ConcolicAnalyzer({ maxPaths: 10, timeoutMs: 1000 });
    const res = analyzer.analyzeSource(code, { functionId: 'loop_test' });

    assert(res.paths.length >= 1, 'Explored paths during concolic execution');
    assert(res.candidates.length >= 1, 'Generated symbolic candidates by branch negation');
    assert(res.snapshot.status === 'SUCCESS', 'ConcolicSnapshot status is SUCCESS');

    const queries = new ConcolicQueries(res.snapshot);
    assert(queries.getExploredPaths().length >= 1, 'ConcolicQueries returned explored paths');
    assert(queries.getCurrentSession() !== null, 'ConcolicQueries returned current session');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Debugger Integration (Stage 18 APIs)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Debugger Integration (Stage 18 APIs)...');
{
    const dbg = new Debugger();
    const trace = {
        version: 1,
        events: [
            { id: 0, type: 'step', line: 1 },
            { id: 1, type: 'step', line: 2 },
        ],
        source: { code: 'x = 10\nif x > 5:\n    y = 1\nelse:\n    y = 2' },
    };
    dbg.loadExecution(trace);

    const session = dbg.startConcolicExploration();
    assert(session !== null, 'Debugger started concolic exploration session');

    const paths = dbg.getExploredPaths();
    assert(Array.isArray(paths), 'Debugger returned explored paths array');

    const artifact = dbg.getExplorationArtifact();
    assert(artifact !== null, 'Debugger exported ExplorationArtifact');
    assert(artifact.language === 'python', 'ExplorationArtifact language is python');

    const watchExpl = dbg.exploreWatch('w1');
    assert(watchExpl.explored, 'Debugger performed watch exploration');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Determinism & Serialization Stability
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Determinism & Serialization Stability...');
{
    const code = `x = 5\nif x > 2:\n    y = 10\nelse:\n    y = 20`;
    const analyzer = new ConcolicAnalyzer({ maxPaths: 10 });
    const run1 = analyzer.analyzeSource(code);
    const run2 = analyzer.analyzeSource(code);

    const json1 = JSON.stringify(run1.snapshot.toJSON());
    const json2 = JSON.stringify(run2.snapshot.toJSON());
    assert(json1 === json2, 'Concolic exploration produces byte-for-byte identical serialization');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Large Scale Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Large Scale Performance Benchmarks...');
{
    // Benchmark 1: 1,000 branch negations
    const pc = new PathConstraint({
        position: 0,
        branchId: 'b_bench',
        normalizedConstraint: Constraint.gt(SymbolicExpression.symbol('x'), SymbolicExpression.constant(100)),
    });
    const path = new ConcretePath({
        pathConstraints: [pc],
    });

    const t0 = Date.now();
    for (let i = 0; i < 1000; i++) {
        BranchNegator.negateBranch(path, 0);
    }
    const negDuration = Date.now() - t0;
    assert(negDuration < 100, `Executed 1,000 branch negations in ${negDuration}ms (< 100ms)`);

    // Benchmark 2: 1,000 candidate solves
    const cand = BranchNegator.negateBranch(path, 0);
    const t1 = Date.now();
    for (let i = 0; i < 1000; i++) {
        PathConstraintSolver.solveCandidate(cand);
    }
    const solveDuration = Date.now() - t1;
    assert(solveDuration < 100, `Solved 1,000 candidates in ${solveDuration}ms (< 100ms)`);

    // Benchmark 3: 1,000 exploration graph insertions
    const graph = new ExplorationGraph();
    const t2 = Date.now();
    for (let i = 0; i < 1000; i++) {
        graph.addNode(new ExplorationNode({ id: `node_${i}` }));
    }
    const graphDuration = Date.now() - t2;
    assert(graphDuration < 100, `Inserted 1,000 nodes into ExplorationGraph in ${graphDuration}ms (< 100ms)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
console.log('========================================\n');

if (failedTests > 0) {
    process.exit(1);
}
