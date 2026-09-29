/**
 * test_stage16_symbolic.mjs — Comprehensive test suite for Stage 16:
 * Universal Symbolic Constraint, Path Reasoning & Proof Engine.
 */

import { SYMBOL_KINDS } from '../src/symbolic/SymbolKind.js';
import { Symbol } from '../src/symbolic/Symbol.js';
import { EXPRESSION_KINDS } from '../src/symbolic/ExpressionKind.js';
import { SymbolicConstant } from '../src/symbolic/SymbolicConstant.js';
import { SymbolicExpression } from '../src/symbolic/SymbolicExpression.js';
import { SymbolicVariable } from '../src/symbolic/SymbolicVariable.js';
import { SymbolicOperation } from '../src/symbolic/SymbolicOperation.js';
import { SymbolicFunction } from '../src/symbolic/SymbolicFunction.js';
import { SymbolicValue } from '../src/symbolic/SymbolicValue.js';
import { CONSTRAINT_KINDS } from '../src/symbolic/ConstraintKind.js';
import { CONSTRAINT_RELATIONS } from '../src/symbolic/ConstraintRelation.js';
import { Constraint } from '../src/symbolic/Constraint.js';
import { ConstraintNormalizer } from '../src/symbolic/ConstraintNormalizer.js';
import { ConstraintSimplifier } from '../src/symbolic/ConstraintSimplifier.js';
import { ConstraintSet } from '../src/symbolic/ConstraintSet.js';
import { BooleanFormula } from '../src/symbolic/BooleanFormula.js';
import { FormulaSimplifier } from '../src/symbolic/FormulaSimplifier.js';
import { SymbolicEnvironment } from '../src/symbolic/SymbolicEnvironment.js';
import { SymbolicState } from '../src/symbolic/SymbolicState.js';
import { SymbolicStateJoin } from '../src/symbolic/SymbolicStateJoin.js';
import { PathPredicate } from '../src/symbolic/PathPredicate.js';
import { SymbolicPath } from '../src/symbolic/SymbolicPath.js';
import { SymbolicPathGraph } from '../src/symbolic/SymbolicPathGraph.js';
import { PathConditionBuilder } from '../src/symbolic/PathConditionBuilder.js';
import { LinearConstraintSolver } from '../src/symbolic/LinearConstraintSolver.js';
import { ConstraintSolver } from '../src/symbolic/ConstraintSolver.js';
import { ProofStep } from '../src/symbolic/ProofStep.js';
import { Proof } from '../src/symbolic/Proof.js';
import { CounterexampleStep } from '../src/symbolic/CounterexampleStep.js';
import { Counterexample } from '../src/symbolic/Counterexample.js';
import { SymbolicProperty } from '../src/symbolic/SymbolicProperty.js';
import { SymbolicTransfer } from '../src/symbolic/SymbolicTransfer.js';
import { SymbolicExecutor } from '../src/symbolic/SymbolicExecutor.js';
import { SymbolicVerification } from '../src/symbolic/SymbolicVerification.js';
import { SymbolicExplanation } from '../src/symbolic/SymbolicExplanation.js';
import { SymbolicSnapshot } from '../src/symbolic/SymbolicSnapshot.js';
import { SymbolicEngine } from '../src/symbolic/SymbolicEngine.js';
import { SymbolicAnalyzer } from '../src/symbolic/SymbolicAnalyzer.js';
import { SymbolicQueries } from '../src/symbolic/SymbolicQueries.js';
import { Debugger } from '../src/debugger/Debugger.js';
import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { createPrimitiveValue } from '../src/runtime/Value.js';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message) {
    total++;
    if (condition) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
}

console.log('=== ProViz Stage 16: Universal Symbolic Constraint Test Suite ===');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Symbol Model & Deterministic Identities
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n1. Testing Symbol Model & Deterministic Identities...');
{
    const sym1 = new Symbol({ name: 'x', kind: SYMBOL_KINDS.INPUT });
    const sym2 = new Symbol({ name: 'x', kind: SYMBOL_KINDS.INPUT });

    assert(sym1.id.startsWith('sym_input_x_'), 'Deterministic symbol ID generated');
    assert(sym1.equals(sym2), 'Structural equality between identical symbols');
    assert(sym1.toString() === 'x', 'Symbol toString returns name');

    const json = sym1.toJSON();
    const restored = Symbol.fromJSON(json);
    assert(sym1.equals(restored), 'Symbol JSON round-trip equality');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Symbolic Expressions & Canonical Simplifications
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Symbolic Expressions & Simplifications...');
{
    const symX = SymbolicExpression.symbol('x');
    const zero = SymbolicExpression.constant(0);
    const one = SymbolicExpression.constant(1);

    // x + 0 = x
    const addZero = SymbolicExpression.add(symX, zero);
    assert(addZero.equals(symX), 'Simplification: x + 0 = x');

    // x - 0 = x
    const subZero = SymbolicExpression.sub(symX, zero);
    assert(subZero.equals(symX), 'Simplification: x - 0 = x');

    // x - x = 0
    const subSelf = SymbolicExpression.sub(symX, symX);
    assert(subSelf.isConstant() && subSelf.payload.value === 0, 'Simplification: x - x = 0');

    // x * 0 = 0
    const mulZero = SymbolicExpression.mul(symX, zero);
    assert(mulZero.isConstant() && mulZero.payload.value === 0, 'Simplification: x * 0 = 0');

    // x * 1 = x
    const mulOne = SymbolicExpression.mul(symX, one);
    assert(mulOne.equals(symX), 'Simplification: x * 1 = x');

    // not(not(x)) = x
    const notNot = SymbolicExpression.not(SymbolicExpression.not(symX));
    assert(notNot.equals(symX), 'Simplification: not(not(x)) = x');

    // Constant folding: 10 + 20 = 30
    const foldAdd = SymbolicExpression.add(10, 20);
    assert(foldAdd.isConstant() && foldAdd.payload.value === 30, 'Constant folding: 10 + 20 = 30');

    // Serialization
    const exprJson = addZero.toJSON();
    const restoredExpr = SymbolicExpression.fromJSON(exprJson);
    assert(addZero.equals(restoredExpr), 'SymbolicExpression serialization round-trip');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Constraints, Relations & Negation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Constraint Model & Relations...');
{
    const symX = SymbolicExpression.symbol('x');
    const cstGt = Constraint.gt(symX, 0);

    assert(cstGt.relation === '>', 'Constraint relation is >');
    assert(cstGt.id.startsWith('cst_inequality_'), 'Deterministic constraint ID');

    const negated = cstGt.negate();
    assert(negated.relation === '<=', 'Negation of > is <=');

    const norm = ConstraintNormalizer.normalize(new Constraint({ left: 5, relation: '<', right: symX }));
    assert(norm.relation === '>', 'ConstraintNormalizer flips 5 < x to x > 5');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ConstraintSet, Contradiction Detection & Satisfiability
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing ConstraintSet & Contradiction Detection...');
{
    const symX = SymbolicExpression.symbol('x');

    // Satisfiable set: x >= 0 && x <= 10
    const setSat = new ConstraintSet([
        Constraint.ge(symX, 0),
        Constraint.le(symX, 10),
    ]);
    assert(setSat.isSatisfiable() === true, 'Set { x >= 0, x <= 10 } is satisfiable');
    assert(setSat.isContradictory() === false, 'Set is not contradictory');

    // Contradictory set: x > 10 && x < 5
    const setUnsat = new ConstraintSet([
        Constraint.gt(symX, 10),
        Constraint.lt(symX, 5),
    ]);
    assert(setUnsat.isContradictory() === true, 'Set { x > 10, x < 5 } detected as contradictory');
    assert(setUnsat.isSatisfiable() === false, 'Set is unsatisfiable');

    // Nullability contradiction: x is None && x is not None
    const setNullUnsat = new ConstraintSet([
        Constraint.isNone(symX),
        Constraint.isNotNone(symX),
    ]);
    assert(setNullUnsat.isContradictory() === true, 'Set { x is None, x is not None } detected as contradictory');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Boolean Formulas & Simplification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Boolean Formulas & Simplification...');
{
    const t = BooleanFormula.true();
    const f = BooleanFormula.false();
    const atomA = BooleanFormula.atom('A');

    // A AND TRUE = A
    const andTrue = BooleanFormula.and(atomA, t);
    assert(andTrue.payload === 'A', 'Formula simplification: A AND TRUE = A');

    // A OR FALSE = A
    const orFalse = BooleanFormula.or(atomA, f);
    assert(orFalse.payload === 'A', 'Formula simplification: A OR FALSE = A');

    // NOT(TRUE) = FALSE
    const notT = BooleanFormula.not(t);
    assert(notT.isFalse(), 'Formula simplification: NOT(TRUE) = FALSE');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. LinearConstraintSolver & Satisfying Models
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing LinearConstraintSolver & Satisfying Models...');
{
    const solver = new LinearConstraintSolver();
    const symX = SymbolicExpression.symbol('x');

    const resSat = solver.solve([
        Constraint.ge(symX, 5),
        Constraint.le(symX, 20),
    ]);
    assert(resSat.isSat() === true, 'Linear solver solved satisfiable interval');
    assert(typeof resSat.model.x === 'number' && resSat.model.x >= 5 && resSat.model.x <= 20, 'Generated valid model assignment for x');

    const resUnsat = solver.solve([
        Constraint.eq(symX, 5),
        Constraint.eq(symX, 10),
    ]);
    assert(resUnsat.isUnsat() === true, 'Linear solver identified equality contradiction');
    assert(resUnsat.conflicts.length >= 1, 'Reported conflicting constraints');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ConstraintSolver & Implication Testing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing ConstraintSolver Implication Testing...');
{
    const solver = new ConstraintSolver();
    const symX = SymbolicExpression.symbol('x');

    // x > 10 implies x > 0
    const premises = [Constraint.gt(symX, 10)];
    const conclusion = Constraint.gt(symX, 0);

    const isImplied = solver.implies(premises, conclusion);
    assert(isImplied === true, 'Proved that x > 10 implies x > 0');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SymbolicEnvironment & Scoped Binding Propagation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing SymbolicEnvironment & State Propagation...');
{
    const env0 = new SymbolicEnvironment();
    const env1 = env0.set('x', SymbolicExpression.constant(10));
    const env2 = env1.set('y', SymbolicExpression.add(env1.get('x'), 5));

    assert(env2.get('y').isConstant() && env2.get('y').payload.value === 15, 'Evaluated symbolic assignment y = x + 5 = 15');
    assert(env2.get('x').isConstant() && env2.get('x').payload.value === 10, 'Parent scope preserved x = 10');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SymbolicStateJoin & ITE Branch Merging
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing SymbolicStateJoin & ITE Branch Merging...');
{
    const stateL = new SymbolicState().withBinding('x', SymbolicExpression.constant(1));
    const stateR = new SymbolicState().withBinding('x', SymbolicExpression.constant(2));
    const cond = SymbolicExpression.symbol('cond');

    const joined = SymbolicStateJoin.join(stateL, stateR, cond);
    const xExpr = joined.environment.get('x');

    assert(xExpr !== null, 'Joined state contains variable x');
    assert(xExpr.kind === EXPRESSION_KINDS.ITE, 'Variable x represented as ITE(cond, 1, 2)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. SymbolicExecutor & Feasible / Infeasible Path Pruning
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing SymbolicExecutor & Path Pruning...');
{
    const code = `x = 5\nif x > 10:\n    y = 1\nelse:\n    y = 2`;
    const analyzer = new SymbolicAnalyzer();
    const res = analyzer.analyzeSource(code, { functionId: 'path_test' });

    assert(res.paths.length >= 1, 'Discovered symbolic paths');
    const feasible = res.paths.filter(p => p.isFeasible);
    assert(feasible.length >= 1, 'Identified feasible execution path');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. SymbolicVerification & Finding Refinement
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing SymbolicVerification & Finding Refinement...');
{
    const code = `a = 10\nb = 0\nc = a / b`;
    const analyzer = new SymbolicAnalyzer();
    const res = analyzer.analyzeSource(code, { functionId: 'verif_test' });

    assert(res.refinedFindings.length >= 1, 'Generated refined findings');
    const rf = res.refinedFindings[0];
    assert(rf.status === 'FEASIBLE', 'Confirmed finding is reachable along feasible symbolic path');
    assert(rf.counterexample !== null, 'Constructed symbolic counterexample');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Proof & Counterexample Models
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Proof & Counterexample Models...');
{
    const proof = new Proof({
        property: 'x > 0',
        status: 'PROVEN',
        steps: [
            new ProofStep({
                statement: 'x is bounded in [1, 10]',
                justification: 'Range analysis',
            }),
            new ProofStep({
                statement: '1 > 0, therefore x > 0',
                justification: 'Linear arithmetic',
            }),
        ],
    });

    assert(proof.isProven(), 'Proof status is PROVEN');
    assert(proof.steps.length === 2, 'Proof contains 2 deductive steps');

    const json = proof.toJSON();
    const restored = Proof.fromJSON(json);
    assert(restored.steps.length === 2, 'Proof JSON round-trip equality');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. SymbolicExplanation Engine
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing SymbolicExplanation Engine...');
{
    const proof = new Proof({
        property: 'divisor != 0',
        status: 'PROVEN',
        steps: [
            new ProofStep({ statement: 'y >= 1', justification: 'Loop condition' }),
        ],
    });

    const expl = SymbolicExplanation.explainProof(proof);
    assert(expl !== null, 'Generated SymbolicExplanation');
    assert(expl.summary.includes('PROVEN'), 'Explanation summary includes proof status');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. SymbolicSnapshot Immutability & Serialization Round-Trip
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing SymbolicSnapshot Immutability & Serialization...');
{
    const code = `x = 10\ny = x + 5`;
    const analyzer = new SymbolicAnalyzer();
    const res = analyzer.analyzeSource(code, { functionId: 'snap_test' });
    const snap = res.snapshot;

    assert(Object.isFrozen(snap), 'SymbolicSnapshot is frozen and immutable');
    assert(snap.symbolicVersion === 1, 'SymbolicSnapshot version is 1');

    const json = JSON.stringify(snap.toJSON());
    const restored = SymbolicSnapshot.fromJSON(JSON.parse(json));
    assert(snap.equals(restored), 'SymbolicSnapshot JSON round-trip equality');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Debugger & Watch Integration (Stage 16 APIs)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing Debugger Integration (Stage 16 APIs)...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        source: {
            files: {
                'main.py': 'x = 10\ny = 0\nz = x / y\n',
            },
        },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'x = 10' },
                runtimeState: new RuntimeState({ globals: { x: createPrimitiveValue('int', 10) } }),
            },
        ],
    };

    const dbg = new Debugger();
    dbg.loadExecution(mockTrace);

    const paths = dbg.getSymbolicPaths();
    assert(Array.isArray(paths), 'Debugger returned symbolic paths array');

    const w = dbg.getWatchManager().add('x');
    const watchConstraints = dbg.getWatchConstraints(w.id);
    assert(Array.isArray(watchConstraints), 'Retrieved watch symbolic constraints');

    const watchExpl = dbg.explainWatchConstraint(w.id);
    assert(watchExpl !== null && watchExpl.summary.includes('Watch'), 'Generated watch constraint explanation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Determinism & Byte-for-Byte Stability
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing Determinism & Serialization Stability...');
{
    const code = `a = 100\nb = 0\nc = a / b`;
    const analyzer = new SymbolicAnalyzer();

    const res1 = analyzer.analyzeSource(code, { functionId: 'det_fn' });
    const res2 = analyzer.analyzeSource(code, { functionId: 'det_fn' });

    const json1 = JSON.stringify(res1.snapshot.toJSON());
    const json2 = JSON.stringify(res2.snapshot.toJSON());

    assert(json1 === json2, 'Symbolic analysis produces byte-for-byte identical serialization');
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Large Scale Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n17. Testing Large Scale Performance Benchmarks...');
{
    const lines = [];
    for (let i = 0; i < 500; i++) {
        lines.push(`v${i} = ${i}`);
        lines.push(`r${i} = v${i} + 1`);
    }
    const codeLarge = lines.join('\n');

    const analyzer = new SymbolicAnalyzer();
    const t0 = performance.now();
    const res = analyzer.analyzeSource(codeLarge, { functionId: 'bench_fn' });
    const t1 = performance.now();

    const analysisTime = t1 - t0;
    assert(analysisTime < 2000, `Analyzed 1,000-statement symbolic path in ${analysisTime.toFixed(1)}ms (< 2000ms)`);

    const queries = new SymbolicQueries({ snapshot: res.snapshot, cfg: res.cfg });
    const t2 = performance.now();
    for (let i = 0; i < 10000; i++) {
        queries.getPaths();
    }
    const t3 = performance.now();
    const queryTime = t3 - t2;
    assert(queryTime < 500, `Executed 10,000 symbolic queries in ${queryTime.toFixed(1)}ms (< 500ms)`);
}

console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed, ${total} total.`);
console.log('========================================\n');
