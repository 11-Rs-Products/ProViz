/**
 * test_stage15_verification.mjs — Comprehensive test suite for Stage 15:
 * Universal Static Verification, Bug Detection & Program Property Analysis Engine.
 */

import { PROPERTY_KINDS } from '../src/verification/PropertyKind.js';
import { PROPERTY_STATES, PropertyState } from '../src/verification/PropertyState.js';
import { PropertyValue } from '../src/verification/PropertyValue.js';
import { PropertyConstraint } from '../src/verification/PropertyConstraint.js';
import { Property } from '../src/verification/Property.js';
import { FINDING_KINDS } from '../src/verification/FindingKind.js';
import { FINDING_SEVERITIES } from '../src/verification/FindingSeverity.js';
import { FINDING_STATUSES } from '../src/verification/FindingStatus.js';
import { FindingLocation } from '../src/verification/FindingLocation.js';
import { FindingEvidence } from '../src/verification/FindingEvidence.js';
import { Finding } from '../src/verification/Finding.js';
import { PathCondition } from '../src/verification/PathCondition.js';
import { PathState } from '../src/verification/PathState.js';
import { PathExplorer } from '../src/verification/PathExplorer.js';
import { RangeValue } from '../src/verification/RangeValue.js';
import { RangeAnalyzer } from '../src/verification/RangeAnalyzer.js';
import { Invariant } from '../src/verification/Invariant.js';
import { InvariantAnalyzer } from '../src/verification/InvariantAnalyzer.js';
import { Contract } from '../src/verification/Contract.js';
import { ContractAnalyzer } from '../src/verification/ContractAnalyzer.js';
import { VerificationRule } from '../src/verification/VerificationRule.js';
import { VerificationRuleSet } from '../src/verification/VerificationRuleSet.js';
import { createBuiltinRuleSet } from '../src/verification/BuiltinRules.js';
import { VerificationNode, VERIFICATION_NODE_KINDS } from '../src/verification/VerificationNode.js';
import { VerificationEdge, VERIFICATION_EDGE_KINDS } from '../src/verification/VerificationEdge.js';
import { VerificationGraph } from '../src/verification/VerificationGraph.js';
import { VerificationExplanation } from '../src/verification/VerificationExplanation.js';
import { VerificationSnapshot } from '../src/verification/VerificationSnapshot.js';
import { VerificationEngine } from '../src/verification/VerificationEngine.js';
import { VerificationAnalyzer } from '../src/verification/VerificationAnalyzer.js';
import { VerificationQueries } from '../src/verification/VerificationQueries.js';
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

console.log('=== ProViz Stage 15: Universal Static Verification Test Suite ===');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Property Model, Proof Lattice & Constraints
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n1. Testing Property Model, Proof Lattice & Constraints...');
{
    const propVal = PropertyValue.range(0, 100);
    const prop = new Property({
        kind: PROPERTY_KINDS.VALUE_IN_RANGE,
        target: 'x',
        value: propVal,
        state: PROPERTY_STATES.PROVEN,
    });

    assert(prop.isProven(), 'Property state is PROVEN');
    assert(prop.id.startsWith('prop_value_in_range_x_'), 'Deterministic property ID generated');
    assert(PropertyState.join(PROPERTY_STATES.PROVEN, PROPERTY_STATES.PROVEN) === PROPERTY_STATES.PROVEN, 'Lattice join identical proven');
    assert(PropertyState.join(PROPERTY_STATES.PROVEN, PROPERTY_STATES.DISPROVEN) === PROPERTY_STATES.POSSIBLE, 'Lattice join proven + disproven = possible');

    const constraint = PropertyConstraint.greaterOrEqual('x', 0);
    assert(constraint.kind === 'greaterOrEqual', 'Constraint kind is greaterOrEqual');
    assert(constraint.subject === 'x', 'Constraint subject is x');

    const json = prop.toJSON();
    const restored = Property.fromJSON(json);
    assert(prop.equals(restored), 'Property JSON serialization round-trip');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RangeValue Abstract Interpretation & Interval Arithmetic
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing RangeValue Abstract Interpretation & Arithmetic...');
{
    const r1 = RangeValue.exact(10);
    const r2 = RangeValue.fromInterval(0, 5);

    const sum = r1.add(r2);
    assert(sum.min === 10 && sum.max === 15, 'Interval addition [10, 10] + [0, 5] = [10, 15]');

    const diff = r1.sub(r2);
    assert(diff.min === 5 && diff.max === 10, 'Interval subtraction [10, 10] - [0, 5] = [5, 10]');

    const mul = r1.mul(r2);
    assert(mul.min === 0 && mul.max === 50, 'Interval multiplication [10, 10] * [0, 5] = [0, 50]');

    assert(r2.containsZero() === true, '[0, 5] contains zero');
    assert(r1.containsZero() === false, '[10, 10] does not contain zero');

    const rNeg = RangeValue.fromInterval(-10, -1);
    assert(rNeg.isStrictlyNegative() === true, '[-10, -1] is strictly negative');

    const widened = r2.widen(RangeValue.fromInterval(0, 100));
    assert(widened.max === Infinity, 'Widening unbounded upper interval produces +Infinity');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PathCondition & Range Refinement
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing PathCondition & Range Refinement...');
{
    const cond = PathCondition.comparison('x', '>', 0);
    const initialRange = RangeValue.unknown();
    const refined = cond.applyToRange(initialRange);

    assert(refined.min === 1, 'PathCondition x > 0 refines range lower bound to 1');
    assert(refined.containsZero() === false, 'Refined range excludes zero');

    const negated = cond.negate();
    assert(negated.operator === '<=', 'Negation of > is <=');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Null-Safety Verification (Definite & Possible None Access)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Null-Safety Verification...');
{
    const codeDefinite = `user = None\nname = user.name`;
    const analyzer = new VerificationAnalyzer();
    const resDefinite = analyzer.analyzeSource(codeDefinite, { functionId: 'null_def_test' });

    const defFinding = resDefinite.findings.find(f => f.kind === FINDING_KINDS.DEFINITE_NONE_ACCESS);
    assert(defFinding !== undefined, 'Detected DEFINITE_NONE_ACCESS finding');
    assert(defFinding.severity === FINDING_SEVERITIES.ERROR, 'Definite None access has ERROR severity');
    assert(defFinding.status === FINDING_STATUSES.STATIC_GUARANTEE, 'Definite None access has STATIC_GUARANTEE');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Division By Zero Verification (Constants & Empty Collections)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Division By Zero Verification...');
{
    const codeConstDiv = `a = 10\nb = 0\nc = a / b`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(codeConstDiv, { functionId: 'div_zero_test' });

    const divFinding = res.findings.find(f => f.kind === FINDING_KINDS.DEFINITE_DIVISION_BY_ZERO);
    assert(divFinding !== undefined, 'Detected DEFINITE_DIVISION_BY_ZERO finding');
    assert(divFinding.message.includes('division by zero'), 'Finding message describes zero division');

    const codeLenDiv = `def average(xs):\n    return sum(xs) / len(xs)\nvals = []\nres = average(vals)`;
    const resLen = analyzer.analyzeSource(codeLenDiv, { functionId: 'len_div_test' });
    const lenFinding = resLen.findings.find(f => f.kind === FINDING_KINDS.POSSIBLE_DIVISION_BY_ZERO);
    assert(lenFinding !== undefined, 'Detected POSSIBLE_DIVISION_BY_ZERO from potentially empty collection');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Index Bounds & Sequence Safety Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Index Bounds & Type Verification...');
{
    const codeIndex = `items = [1, 2, 3]\nval = items[10]`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(codeIndex, { functionId: 'idx_test' });

    const idxFinding = res.findings.find(f => f.kind === FINDING_KINDS.DEFINITE_INDEX_OUT_OF_BOUNDS);
    assert(idxFinding !== undefined, 'Detected DEFINITE_INDEX_OUT_OF_BOUNDS finding');
    assert(idxFinding.message.includes('items[10]'), 'Finding identifies problematic index expression');

    const codeInvalidType = `items = [1, 2, 3]\nval = items["name"]`;
    const resType = analyzer.analyzeSource(codeInvalidType, { functionId: 'idx_type_test' });
    const typeFinding = resType.findings.find(f => f.kind === FINDING_KINDS.DEFINITE_INVALID_INDEX_TYPE);
    assert(typeFinding !== undefined, 'Detected DEFINITE_INVALID_INDEX_TYPE finding');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Attribute Safety & Closed Object Shapes
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Attribute Safety & Object Shapes...');
{
    const codeAttr = `obj = Point()\nval = obj.z`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(codeAttr, { functionId: 'attr_test' });

    assert(Array.isArray(res.findings), 'Attribute verification executed without error');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Operation Type Compatibility Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Operation Type Compatibility (e.g. String + Integer)...');
{
    const codeOp = `msg = "count: " + 42`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(codeOp, { functionId: 'op_test' });

    const opFinding = res.findings.find(f => f.kind === FINDING_KINDS.DEFINITE_TYPE_MISMATCH);
    assert(opFinding !== undefined, 'Detected DEFINITE_TYPE_MISMATCH on string + integer');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Control-Flow Verification (Unreachable Blocks & Constant Conditions)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Control Flow & Reachability Verification...');
{
    const codeConstCond = `x = 10\nif True:\n    y = 20`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(codeConstCond, { functionId: 'cf_test' });

    const condFinding = res.findings.find(f => f.kind === FINDING_KINDS.CONSTANT_CONDITION);
    assert(condFinding !== undefined, 'Detected CONSTANT_CONDITION finding');
    assert(condFinding.confidence === 'STATIC_GUARANTEE', 'Constant condition has STATIC_GUARANTEE');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Function Call & Argument Count Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Function Call & Argument Verification...');
{
    const codeCall = `count = len(1, 2, 3)`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(codeCall, { functionId: 'call_test' });

    const callFinding = res.findings.find(f => f.kind === FINDING_KINDS.DEFINITE_CALL_ARGUMENT_MISMATCH);
    assert(callFinding !== undefined, 'Detected DEFINITE_CALL_ARGUMENT_MISMATCH on len() with 3 args');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Invariant Discovery & Contract Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Invariant Discovery & Contracts...');
{
    const code = `x = 10\ny = 20`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(code, {
        contracts: [
            new Contract({
                functionId: '<module>',
                preconditions: ['x >= 0'],
            }),
        ],
    });

    assert(res.snapshot.invariants.length >= 1, 'Inferred static invariants');
    const nonNegativeInv = res.snapshot.invariants.find(i => i.expression.includes('>= 0'));
    assert(nonNegativeInv !== undefined, 'Found x >= 0 non-negative invariant');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. VerificationGraph (Nodes, Edges, Traversal)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing VerificationGraph...');
{
    const code = `x = None\ny = x.val`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(code, { functionId: 'vgraph_test' });
    const graph = res.verificationGraph;

    assert(graph.getNodes().length >= 1, 'VerificationGraph has semantic nodes');
    assert(graph.getEdges().length >= 1, 'VerificationGraph has semantic edges');
    const nodes = graph.getNodes();
    const edges = graph.getEdges();
    assert(nodes.some(n => n.kind === VERIFICATION_NODE_KINDS.FINDING), 'Graph contains FINDING node');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. VerificationExplanation & Evidence Chains
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing VerificationExplanation & Machine-Readable Evidence...');
{
    const code = `a = 10\nb = 0\nc = a / b`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(code, { functionId: 'expl_test' });
    const queries = new VerificationQueries({ snapshot: res.snapshot, cfg: res.cfg, ssa: res.ssa });

    const findings = queries.getFindings();
    assert(findings.length >= 1, 'Obtained findings from queries');

    const expl = queries.explainFinding(findings[0].id);
    assert(expl !== null, 'Generated VerificationExplanation');
    assert(expl.steps.length >= 2, 'Explanation contains sequential reasoning steps');
    assert(expl.findingId === findings[0].id, 'Explanation references finding ID');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. VerificationSnapshot Immutability & Serialization Round-Trip
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing VerificationSnapshot Immutability & Serialization...');
{
    const code = `x = 42\ny = "hello"`;
    const analyzer = new VerificationAnalyzer();
    const res = analyzer.analyzeSource(code, { functionId: 'snap_test' });
    const snap = res.snapshot;

    assert(Object.isFrozen(snap), 'VerificationSnapshot is frozen');
    assert(snap.verificationVersion === 1, 'VerificationSnapshot version is 1');

    const json = JSON.stringify(snap.toJSON());
    const parsed = JSON.parse(json);
    const restored = VerificationSnapshot.fromJSON(parsed);

    assert(snap.equals(restored), 'VerificationSnapshot JSON round-trip equality');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Debugger Integration (Stage 15 APIs & Watch Verification)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing Debugger Integration (Stage 15 APIs)...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        source: {
            files: {
                'main.py': 'x = None\ny = x.name\n',
            },
        },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'x = None' },
                runtimeState: new RuntimeState({ globals: { x: createPrimitiveValue('none', null) } }),
            },
        ],
    };

    const dbg = new Debugger();
    dbg.loadExecution(mockTrace);

    const findings = dbg.getFindings();
    assert(Array.isArray(findings), 'Debugger returned findings array');
    assert(findings.length >= 1, 'Debugger identified static findings');

    const finding = dbg.getFinding(findings[0].id);
    assert(finding !== null, 'Debugger retrieved finding by ID');

    const w = dbg.getWatchManager().add('x.name');
    const watchFindings = dbg.getWatchFindings(w.id);
    assert(Array.isArray(watchFindings), 'Retrieved watch findings');

    const watchSafety = dbg.explainWatchSafety(w.id);
    assert(watchSafety !== null, 'Generated watch safety explanation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Determinism & Byte-for-Byte Stability
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing Determinism & Serialization Stability...');
{
    const code = `a = 100\nb = 0\nc = a / b\nitems = [1, 2]\nx = items[5]`;
    const analyzer = new VerificationAnalyzer();

    const res1 = analyzer.analyzeSource(code, { functionId: 'det_test' });
    const res2 = analyzer.analyzeSource(code, { functionId: 'det_test' });

    const json1 = JSON.stringify(res1.snapshot.toJSON());
    const json2 = JSON.stringify(res2.snapshot.toJSON());

    assert(json1 === json2, 'Verification analysis produces byte-for-byte identical serialization');
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

    const analyzer = new VerificationAnalyzer();
    const t0 = performance.now();
    const res = analyzer.analyzeSource(codeLarge, { functionId: 'bench_fn' });
    const t1 = performance.now();

    const analysisTime = t1 - t0;
    assert(analysisTime < 1000, `Analyzed 1,000-statement program in ${analysisTime.toFixed(1)}ms (< 1000ms)`);

    const queries = new VerificationQueries({ snapshot: res.snapshot, cfg: res.cfg });
    const t2 = performance.now();
    for (let i = 0; i < 10000; i++) {
        queries.getFindingsAtLocation({ line: (i % 500) + 1 });
    }
    const t3 = performance.now();
    const queryTime = t3 - t2;
    assert(queryTime < 500, `Executed 10,000 verification queries in ${queryTime.toFixed(1)}ms (< 500ms)`);
}

console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed, ${total} total.`);
console.log('========================================\n');
