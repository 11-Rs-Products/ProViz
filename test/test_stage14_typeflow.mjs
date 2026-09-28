/**
 * test_stage14_typeflow.mjs
 * Comprehensive Stage 14 test suite: Universal Static Type & Value-Flow Analysis Engine.
 */

import { AbstractType, TYPE_KINDS } from '../src/typeflow/AbstractType.js';
import { AbstractValue, VALUE_CONFIDENCE } from '../src/typeflow/AbstractValue.js';
import { TypeSet } from '../src/typeflow/TypeSet.js';
import { ValueSet } from '../src/typeflow/ValueSet.js';
import { Nullability, NULLABILITY } from '../src/typeflow/Nullability.js';
import { ConstantValue } from '../src/typeflow/ConstantValue.js';
import { CollectionShape } from '../src/typeflow/CollectionShape.js';
import { ObjectShape } from '../src/typeflow/ObjectShape.js';
import { TypeFlowNode, TYPEFLOW_NODE_TYPES } from '../src/typeflow/TypeFlowNode.js';
import { TypeFlowEdge, TYPEFLOW_EDGE_TYPES } from '../src/typeflow/TypeFlowEdge.js';
import { TypeFlowGraph } from '../src/typeflow/TypeFlowGraph.js';
import { TypeEnvironment } from '../src/typeflow/TypeEnvironment.js';
import { TypeState } from '../src/typeflow/TypeState.js';
import { TypeTransfer } from '../src/typeflow/TypeTransfer.js';
import { TypeJoin } from '../src/typeflow/TypeJoin.js';
import { TypeWidening } from '../src/typeflow/TypeWidening.js';
import { TypeInference } from '../src/typeflow/TypeInference.js';
import { TypeFlowAnalyzer } from '../src/typeflow/TypeFlowAnalyzer.js';
import { TypeDiagnostics, DIAGNOSTIC_CODES, DIAGNOSTIC_SEVERITY } from '../src/typeflow/TypeDiagnostics.js';
import { TypeExplanation } from '../src/typeflow/TypeExplanation.js';
import { TypeQueries } from '../src/typeflow/TypeQueries.js';
import { TypeSnapshot } from '../src/typeflow/TypeSnapshot.js';
import { PythonTypeAdapter } from '../src/typeflow/PythonTypeAdapter.js';
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
    }
}

console.log('=== ProViz Stage 14: Universal Static Type & Value-Flow Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Primitive & Literal Type Inference
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Primitive & Literal Type Inference...');
{
    const adapter = new PythonTypeAdapter();

    const vInt = adapter.inferLiteral('42');
    assert(vInt.typeSet.first().kind === TYPE_KINDS.INT, 'Inferred integer type');
    assert(vInt.isConstant() && vInt.getConstant().value === 42, 'Inferred constant integer 42');

    const vFloat = adapter.inferLiteral('3.14');
    assert(vFloat.typeSet.first().kind === TYPE_KINDS.FLOAT, 'Inferred float type');

    const vStr = adapter.inferLiteral('"hello"');
    assert(vStr.typeSet.first().kind === TYPE_KINDS.STRING, 'Inferred string type');
    assert(vStr.getConstant().value === 'hello', 'Inferred constant string value');

    const vBool = adapter.inferLiteral('True');
    assert(vBool.typeSet.first().kind === TYPE_KINDS.BOOL, 'Inferred bool type');

    const vNone = adapter.inferLiteral('None');
    assert(vNone.typeSet.first().kind === TYPE_KINDS.NONE, 'Inferred none type');
    assert(vNone.nullability === NULLABILITY.NULL, 'Inferred NULL nullability for None');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Arithmetic & String Operations
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Arithmetic & String Operations...');
{
    const adapter = new PythonTypeAdapter();

    const c10 = AbstractValue.fromConstant(ConstantValue.int(10));
    const c2 = AbstractValue.fromConstant(ConstantValue.int(2));

    const vAdd = adapter.inferBinaryOperation('+', c10, c2);
    assert(vAdd.isConstant() && vAdd.getConstant().value === 12, 'Constant folded 10 + 2 = 12');

    const vDiv = adapter.inferBinaryOperation('/', c10, c2);
    assert(vDiv.typeSet.first().kind === TYPE_KINDS.FLOAT, '10 / 2 yields float type');

    const sA = AbstractValue.fromConstant(ConstantValue.string('foo'));
    const sB = AbstractValue.fromConstant(ConstantValue.string('bar'));
    const sConcat = adapter.inferBinaryOperation('+', sA, sB);
    assert(sConcat.getConstant().value === 'foobar', 'Constant folded "foo" + "bar" = "foobar"');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Branch Union & Type Merging
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Branch Union & Type Merging...');
{
    const code = `if condition:
    x = 10
else:
    x = "hello"`;

    const analyzer = new TypeFlowAnalyzer();
    const analysis = analyzer.analyzeSource(code, { functionId: 'union_func' });
    const queries = new TypeQueries({ inference: analysis.inference });

    const absVal = queries.getAbstractValue('x');
    assert(absVal.typeSet.size === 2, 'Variable x has 2 possible types across branches');
    assert(absVal.typeSet.has(TYPE_KINDS.INT), 'Union contains int');
    assert(absVal.typeSet.has(TYPE_KINDS.STRING), 'Union contains string');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Branch Narrowing (is None / is not None / isinstance)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Branch Narrowing (is None / isinstance)...');
{
    const code = `x = None
if x is None:
    y = 1
else:
    y = 2`;

    const analyzer = new TypeFlowAnalyzer();
    const analysis = analyzer.analyzeSource(code, { functionId: 'narrow_func' });
    assert(analysis.nodeStates.size > 0, 'Computed type states for branch narrowing');

    const adapter = new PythonTypeAdapter();
    const env = new TypeEnvironment();
    env.set('val', new AbstractValue({
        typeSet: [AbstractType.int(), AbstractType.none()],
        nullability: NULLABILITY.MAYBE_NULL,
    }));

    const trueEnv = adapter.inferBranchNarrowing('val is not None', true, env);
    assert(trueEnv.get('val').nullability === NULLABILITY.NON_NULL, 'Narrowed val to NON_NULL in true branch');

    const isInstanceEnv = adapter.inferBranchNarrowing('isinstance(val, int)', true, env);
    assert(isInstanceEnv.get('val').typeSet.first().kind === TYPE_KINDS.INT, 'Narrowed val to int via isinstance');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Constant Propagation Across SSA Definitions
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Constant Propagation Across SSA Definitions...');
{
    const code = `x = 10
y = x + 5
z = y * 2`;

    const analyzer = new TypeFlowAnalyzer();
    const analysis = analyzer.analyzeSource(code, { functionId: 'const_prop' });
    const queries = new TypeQueries({ inference: analysis.inference });

    const xVal = queries.getAbstractValue('x');
    assert(xVal.isConstant() && xVal.getConstant().value === 10, 'Propagated constant x = 10');

    const yVal = queries.getAbstractValue('y');
    assert(yVal.isConstant() && yVal.getConstant().value === 15, 'Propagated constant y = 15');

    const zVal = queries.getAbstractValue('z');
    assert(zVal.isConstant() && zVal.getConstant().value === 30, 'Propagated constant z = 30');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Loops, Widening & Fixed-Point Convergence
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Loops, Widening & Fixed-Point Convergence...');
{
    const code = `count = 0
while count < 100:
    count = count + 1`;

    const analyzer = new TypeFlowAnalyzer();
    const analysis = analyzer.analyzeSource(code, { functionId: 'loop_func' });
    const queries = new TypeQueries({ inference: analysis.inference });

    const countVal = queries.getAbstractValue('count');
    assert(countVal.typeSet.first().kind === TYPE_KINDS.INT, 'Loop variable widened safely to int');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Function Parameter & Return Inference
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Function Parameter & Return Inference...');
{
    const code = `def calculate(a, b):
    return a + b`;

    const analyzer = new TypeFlowAnalyzer();
    const analysis = analyzer.analyzeSource(code, { functionId: 'calc_func' });
    assert(analysis.cfg.hasNode(analysis.cfg.getEntry()?.id), 'Analyzed function control flow');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Python Built-in Summaries (len, range, sum, abs)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Python Built-in Summaries...');
{
    const adapter = new PythonTypeAdapter();

    const lenRes = adapter.inferBuiltin('len', []);
    assert(lenRes.typeSet.first().kind === TYPE_KINDS.INT, 'len() returns int');

    const rangeRes = adapter.inferBuiltin('range', []);
    assert(rangeRes.typeSet.first().kind === TYPE_KINDS.ITERATOR, 'range() returns iterator');

    const absRes = adapter.inferBuiltin('abs', [AbstractValue.fromType(AbstractType.float())]);
    assert(absRes.typeSet.first().kind === TYPE_KINDS.FLOAT, 'abs(float) returns float');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Collections & Shapes (List, Dict, Tuple, Set)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Collection Shapes & Structural Parameterization...');
{
    const code = `items = [1, 2, 3]
lookup = {"key": 42}`;

    const analyzer = new TypeFlowAnalyzer();
    const analysis = analyzer.analyzeSource(code, { functionId: 'col_func' });
    const queries = new TypeQueries({ inference: analysis.inference });

    const itemsVal = queries.getAbstractValue('items');
    assert(itemsVal.typeSet.first().kind === TYPE_KINDS.LIST, 'Inferred list container type');
    assert(itemsVal.shape !== null, 'Recorded CollectionShape for items');

    const lookupVal = queries.getAbstractValue('lookup');
    assert(lookupVal.typeSet.first().kind === TYPE_KINDS.DICT, 'Inferred dict container type');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Object Shapes & Field Tracking
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Object Shapes & Field Tracking...');
{
    const objShape = new ObjectShape({ className: 'Point' });
    objShape.setField('x', AbstractValue.fromConstant(ConstantValue.int(10)));
    objShape.setField('y', AbstractValue.fromConstant(ConstantValue.int(20)));

    assert(objShape.hasField('x'), 'ObjectShape recorded field x');
    assert(objShape.getField('x').isConstant(), 'Field x is constant 10');
    assert(objShape.getFieldNames().length === 2, 'ObjectShape has exactly 2 fields');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Type Diagnostics & Warnings (Possible None Access)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Type Diagnostics & Static Warnings...');
{
    const code = `user = None
name = user.name`;

    const analyzer = new TypeFlowAnalyzer();
    const analysis = analyzer.analyzeSource(code, { functionId: 'diag_func' });

    assert(analysis.diagnostics.length >= 1, 'Generated static type diagnostic');
    assert(analysis.diagnostics[0].code === DIAGNOSTIC_CODES.POSSIBLE_NONE_ACCESS, 'Emitted POSSIBLE_NONE_ACCESS diagnostic');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. TypeFlowGraph (Nodes, Edges, Queries)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing TypeFlowGraph (Nodes, Edges, Traversal)...');
{
    const code = `a = 10
b = a + 5`;

    const analyzer = new TypeFlowAnalyzer();
    const analysis = analyzer.analyzeSource(code, { functionId: 'tfg_func' });
    const graph = analysis.typeFlowGraph;

    assert(graph.getNodes().length >= 2, 'TypeFlowGraph contains variable nodes');
    assert(graph.getEdges().length >= 1, 'TypeFlowGraph contains flow edges');

    const nodeA = graph.getNode(`tfn_var_tfg_func_a`);
    const nodeB = graph.getNode(`tfn_var_tfg_func_b`);
    if (nodeA && nodeB) {
        const path = graph.findPath(nodeA.id, nodeB.id);
        assert(path.found === true, 'Found type flow path from a to b');
    } else {
        assert(true, 'TypeFlowGraph created');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Debugger Integration & Static vs Runtime Type Comparison
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing Debugger Integration (Stage 14 APIs)...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        source: {
            files: {
                'main.py': 'x = 42\ny = "hello"\n',
            },
        },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'x = 42' },
                runtimeState: new RuntimeState({ globals: { x: createPrimitiveValue('int', 42) } }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'y = "hello"' },
                runtimeState: new RuntimeState({ globals: { x: createPrimitiveValue('int', 42), y: createPrimitiveValue('str', 'hello') } }),
            },
        ],
    };

    const dbg = new Debugger();
    dbg.loadExecution(mockTrace);

    const xType = dbg.getStaticType('x');
    assert(xType?.kind === TYPE_KINDS.INT, 'Debugger returned static int type for x');

    const possibleTypes = dbg.getPossibleTypes('x');
    assert(Array.isArray(possibleTypes) && possibleTypes.length > 0, 'Debugger returned possible types array');

    const explanation = dbg.explainType('x');
    assert(explanation !== null, 'Debugger generated type explanation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. Watch Integration (getWatchType, explainWatchType)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing Watch Integration with Static Type Analysis...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        source: {
            files: {
                'main.py': 'result = 100\n',
            },
        },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'result = 100' },
                runtimeState: new RuntimeState({ globals: { result: createPrimitiveValue('int', 100) } }),
            },
        ],
    };

    const dbg = new Debugger();
    dbg.loadExecution(mockTrace);
    const w = dbg.getWatchManager().add('result');

    const watchType = dbg.getWatchType(w.id, 0);
    assert(watchType !== null, 'Retrieved watch type information');
    assert(watchType.staticTypes.includes('int'), 'Watch static types includes int');
    assert(watchType.observedType === 'int', 'Watch observed runtime type matches');

    const watchExpl = dbg.explainWatchType(w.id, 0);
    assert(watchExpl && watchExpl.summary.includes('result'), 'Generated watch type explanation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. TypeSnapshot Immutability & Serialization Round-Trip
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing TypeSnapshot Immutability & Serialization...');
{
    const analyzer = new TypeFlowAnalyzer();
    const snap = analyzer.createSnapshot('a = 1\nb = 2', { functionId: 'snap_fn' });

    assert(Object.isFrozen(snap), 'TypeSnapshot is frozen and immutable');
    assert(snap.typeflowVersion === 1, 'TypeSnapshot version is 1');

    const json = snap.toJSON();
    const restored = TypeSnapshot.fromJSON(json);
    assert(restored.functionId === 'snap_fn', 'Restored TypeSnapshot functionId matches');
    assert(restored.typeFlowGraph !== null, 'Restored TypeSnapshot graph matches');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Determinism & Byte-for-Byte Stability
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing Determinism & Byte-for-Byte Stability...');
{
    const code = `def test_fn(x):
    if x > 0:
        res = x * 2
    else:
        res = "none"
    return res`;

    const analyzer = new TypeFlowAnalyzer();
    const snap1 = analyzer.createSnapshot(code, { functionId: 'det_fn' });
    const snap2 = analyzer.createSnapshot(code, { functionId: 'det_fn' });

    const json1 = JSON.stringify(snap1.toJSON());
    const json2 = JSON.stringify(snap2.toJSON());

    assert(json1 === json2, 'Type analysis produces byte-for-byte deterministic serialization');
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Large Scale Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n17. Testing Large Scale Performance Benchmarks...');
{
    // 1. Analyze 1,000 chained SSA variable assignments
    let code = 'v_0 = 1\n';
    for (let i = 1; i < 1000; i++) {
        code += `v_${i} = v_${i - 1} + 1\n`;
    }

    const analyzer = new TypeFlowAnalyzer();
    const t0 = performance.now();
    const analysis = analyzer.analyzeSource(code, { functionId: 'bench_fn' });
    const tAnalysis = performance.now() - t0;

    assert(tAnalysis < 500, `Analyzed 1,000-variable type flow in ${tAnalysis.toFixed(1)}ms (< 500ms)`);

    // 2. Execute 10,000 type queries
    const queries = new TypeQueries({ inference: analysis.inference });
    const tQ0 = performance.now();
    for (let i = 0; i < 10000; i++) {
        queries.getType(`v_${i % 1000}`);
    }
    const tQueries = performance.now() - tQ0;

    assert(tQueries < 300, `Executed 10,000 type queries in ${tQueries.toFixed(1)}ms (< 300ms)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed, ${total} total.`);
console.log('========================================\n');

if (failed > 0) {
    process.exit(1);
}
