/**
 * Stage 12: Universal Dataflow Analysis & Program Dependency Graph (PDG) Test Suite
 */

import { DataflowNode, DATAFLOW_NODE_TYPES } from '../src/dataflow/DataflowNode.js';
import { DataflowEdge, DATAFLOW_EDGE_TYPES } from '../src/dataflow/DataflowEdge.js';
import { DataflowEvent, DATAFLOW_EVENT_TYPES } from '../src/dataflow/DataflowEvent.js';
import { Definition } from '../src/dataflow/Definition.js';
import { Use } from '../src/dataflow/Use.js';
import { Dependency } from '../src/dataflow/Dependency.js';
import { AliasSet } from '../src/dataflow/AliasSet.js';
import { MutationRecord, MUTATION_OPERATIONS } from '../src/dataflow/MutationRecord.js';
import { DataflowGraph } from '../src/dataflow/DataflowGraph.js';
import { DataflowBuilder } from '../src/dataflow/DataflowBuilder.js';
import { DataflowAnalyzer } from '../src/dataflow/DataflowAnalyzer.js';
import { DataflowQueries } from '../src/dataflow/DataflowQueries.js';
import { DataflowSnapshot } from '../src/dataflow/DataflowSnapshot.js';
import { PythonDataflowAdapter } from '../src/dataflow/PythonDataflowAdapter.js';
import { Debugger } from '../src/debugger/Debugger.js';
import { ObjectInspector } from '../src/inspector/ObjectInspector.js';
import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { Heap } from '../src/runtime/Heap.js';
import { Scope } from '../src/runtime/Scope.js';
import { CallFrame } from '../src/runtime/CallFrame.js';
import { createPrimitiveValue, createReferenceValue } from '../src/runtime/Value.js';

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

console.log('=== ProViz Stage 12: Universal Dataflow Analysis & PDG Test Suite ===');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dataflow Canonical Models: Node, Edge, Event
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n1. Testing Dataflow Canonical Models (Node, Edge, Event)...');
{
    const varNode = DataflowNode.createVariableNode({
        name: 'x',
        frameIndex: 2,
        scopeId: 'local',
        fileId: 'main.py',
        value: createPrimitiveValue('int', 42),
    });

    assert(varNode.id.startsWith('df_var_2_local_main_py_x'), 'Deterministic node ID generated');
    assert(varNode.type === DATAFLOW_NODE_TYPES.VARIABLE, 'Node type is variable');
    assert(varNode.value.value === 42, 'Node holds runtime value');

    const edge = new DataflowEdge({
        type: DATAFLOW_EDGE_TYPES.DATA_DEPENDS_ON,
        fromId: 'node_a',
        toId: 'node_b',
        frameIndex: 1,
    });

    assert(edge.id.startsWith('df_edge_node_a_DATA_DEPENDS_ON_node_b_f1'), 'Deterministic edge ID generated');
    assert(edge.type === DATAFLOW_EDGE_TYPES.DATA_DEPENDS_ON, 'Edge type is DATA_DEPENDS_ON');

    const ev = new DataflowEvent({
        type: DATAFLOW_EVENT_TYPES.DEFINITION,
        frameIndex: 3,
        subject: { variable: 'y' },
        dependencies: ['x'],
    });

    assert(ev.type === DATAFLOW_EVENT_TYPES.DEFINITION, 'DataflowEvent type is definition');
    assert(ev.dependencies[0] === 'x', 'Event carries dependencies');

    // JSON Round-trip
    const nodeJSON = DataflowNode.fromJSON(varNode.toJSON());
    assert(nodeJSON.id === varNode.id && nodeJSON.variableId === 'x', 'DataflowNode JSON round-trip is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Definition, Use, AliasSet, MutationRecord Models
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Definition, Use, AliasSet, MutationRecord Models...');
{
    const def = new Definition({
        variableName: 'total',
        frameIndex: 5,
        value: createPrimitiveValue('int', 100),
        dependencies: ['subtotal', 'tax'],
        sourceLocation: { fileId: 'calc.py', line: 12 },
    });

    assert(def.variableName === 'total', 'Definition variableName is total');
    assert(def.dependencies.length === 2, 'Definition records 2 input dependencies');
    assert(def.sourceLocation.line === 12, 'Definition records source location line 12');

    const use = new Use({
        variableName: 'subtotal',
        frameIndex: 5,
        definitionId: 'df_def_subtotal_1',
        sourceLocation: { fileId: 'calc.py', line: 12 },
    });

    assert(use.variableName === 'subtotal', 'Use records variableName');
    assert(use.definitionId === 'df_def_subtotal_1', 'Use points to producer definition');

    const aliasSet = new AliasSet({ objectId: 'obj_42' });
    aliasSet.addAlias('a', 1);
    aliasSet.addAlias('b', 2);
    aliasSet.addAlias('c', 3);
    assert(aliasSet.getVariables().length === 3, 'AliasSet tracks 3 aliases');
    assert(aliasSet.getVariables(1).length === 1, 'Historical alias query at frame 1 returns 1 alias');

    aliasSet.removeAlias('b', 4);
    assert(aliasSet.getVariables(4).length === 2, 'Rebound alias removed from active set at frame 4');

    const mut = new MutationRecord({
        objectId: 'obj_42',
        operation: MUTATION_OPERATIONS.APPEND,
        target: 0,
        nextValue: createPrimitiveValue('int', 99),
        frameIndex: 4,
    });

    assert(mut.operation === 'append', 'Mutation operation is append');
    assert(mut.objectId === 'obj_42', 'Mutation target is obj_42');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Python Dataflow Adapter Statement Extraction
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing PythonDataflowAdapter Statement Extraction...');
{
    const adapter = new PythonDataflowAdapter();

    // Assignment parsing
    const p1 = adapter._parseStatement('x = a + b * 2');
    assert(p1.type === 'assignment', 'Parsed simple assignment');
    assert(p1.target === 'x', 'Target is x');
    assert(p1.dependencies.includes('a') && p1.dependencies.includes('b'), 'Dependencies include a and b');

    // Member write parsing
    const p2 = adapter._parseStatement('user.name = first_name');
    assert(p2.type === 'member_write', 'Parsed member write');
    assert(p2.objectVar === 'user' && p2.fieldName === 'name', 'Target is user.name');
    assert(p2.dependencies.includes('first_name'), 'Dependency is first_name');

    // Subscript write parsing
    const p3 = adapter._parseStatement('items[0] = new_val');
    assert(p3.type === 'subscript_write', 'Parsed subscript write');
    assert(p3.targetVar === 'items' && p3.indexExpr === '0', 'Target is items[0]');

    // Method mutation parsing
    const p4 = adapter._parseStatement('items.append(element)');
    assert(p4.type === 'method_call_mutation', 'Parsed method mutation');
    assert(p4.objectVar === 'items' && p4.method === 'append', 'Method is append');
    assert(p4.args.includes('element'), 'Arg is element');

    // Return parsing
    const p5 = adapter._parseStatement('return res + 1');
    assert(p5.type === 'return', 'Parsed return statement');
    assert(p5.dependencies.includes('res'), 'Return dependency is res');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Basic Dataflow: Definitions, Uses, and Dependencies
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Basic Dataflow Chain (x = 1; y = x; z = y + 2)...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'x = 1' },
                runtimeState: new RuntimeState({
                    globals: { x: createPrimitiveValue('int', 1) },
                }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'y = x' },
                runtimeState: new RuntimeState({
                    globals: {
                        x: createPrimitiveValue('int', 1),
                        y: createPrimitiveValue('int', 1),
                    },
                }),
            },
            {
                id: 2,
                type: 'line',
                source: { file: 'main.py', line: 3 },
                data: { code_line: 'z = y + 2' },
                runtimeState: new RuntimeState({
                    globals: {
                        x: createPrimitiveValue('int', 1),
                        y: createPrimitiveValue('int', 1),
                        z: createPrimitiveValue('int', 3),
                    },
                }),
            },
        ],
    };

    const analyzer = new DataflowAnalyzer();
    const graph = analyzer.analyze(mockTrace);
    const queries = new DataflowQueries(graph);

    // Definitions
    assert(graph.getDefinitions('x').length === 1, 'Defined variable x');
    assert(graph.getDefinitions('y').length === 1, 'Defined variable y');
    assert(graph.getDefinitions('z').length === 1, 'Defined variable z');

    // Uses
    assert(graph.getUses('x').length === 1, 'Variable x was used in y = x');
    assert(graph.getUses('y').length === 1, 'Variable y was used in z = y + 2');

    // Where did z come from?
    const originsZ = queries.findOrigins('z');
    assert(originsZ.origins.length > 0, 'Origins found for z');
    assert(originsZ.path.length >= 3, 'Dataflow path for z traces back through y and x');

    // What depends on x?
    const dependentsX = queries.findDependents('x');
    assert(dependentsX.dependents.some(d => d.label === 'y' || d.label === 'z'), 'x transitively affects y and z');

    // Shortest data path from x to z
    const path = queries.findDataPath('x', 'z');
    assert(path.found === true, 'Found data path from x to z');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Variable Rebinding & Historical Definition Invariant
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Variable Rebinding & Historical Definition Tracking...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'count = 1' },
                runtimeState: new RuntimeState({ globals: { count: createPrimitiveValue('int', 1) } }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'count = 2' },
                runtimeState: new RuntimeState({ globals: { count: createPrimitiveValue('int', 2) } }),
            },
            {
                id: 2,
                type: 'line',
                source: { file: 'main.py', line: 3 },
                data: { code_line: 'count = 3' },
                runtimeState: new RuntimeState({ globals: { count: createPrimitiveValue('int', 3) } }),
            },
        ],
    };

    const analyzer = new DataflowAnalyzer();
    const graph = analyzer.analyze(mockTrace);
    const queries = new DataflowQueries(graph);

    assert(graph.getDefinitions('count').length === 3, 'Recorded all 3 historical definitions of count');

    // Historical definitions
    const defAt0 = queries.findLastDefinition('count', 0);
    assert(defAt0.value.value === 1, 'Last definition of count at frame 0 was 1');

    const defAt1 = queries.findLastDefinition('count', 1);
    assert(defAt1.value.value === 2, 'Last definition of count at frame 1 was 2');

    const defAt2 = queries.findLastDefinition('count', 2);
    assert(defAt2.value.value === 3, 'Last definition of count at frame 2 was 3');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Aliasing & Heap Object Flow
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Aliasing & Heap Object Flow (a = []; b = a)...');
{
    const heap = new Heap({
        obj_list: { id: 'obj_list', type: 'list', elements: [] },
    });

    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'a = []' },
                runtimeState: new RuntimeState({
                    globals: { a: createReferenceValue('list', 'obj_list') },
                    heap,
                }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'b = a' },
                runtimeState: new RuntimeState({
                    globals: {
                        a: createReferenceValue('list', 'obj_list'),
                        b: createReferenceValue('list', 'obj_list'),
                    },
                    heap,
                }),
            },
        ],
    };

    const analyzer = new DataflowAnalyzer();
    const graph = analyzer.analyze(mockTrace);
    const queries = new DataflowQueries(graph);

    const aliases = queries.findAliases('obj_list');
    assert(aliases.includes('a') && aliases.includes('b'), 'Discovered both aliases a and b for obj_list');
    assert(aliases.length === 2, 'Exactly 2 aliases point to single heap object');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Object Mutation & Impact Propagation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Object Mutation & Impact Propagation (b.append(1))...');
{
    const heapBefore = new Heap({
        obj_list: { id: 'obj_list', type: 'list', elements: [] },
    });
    const heapAfter = new Heap({
        obj_list: { id: 'obj_list', type: 'list', elements: [createPrimitiveValue('int', 1)] },
    });

    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'a = []' },
                runtimeState: new RuntimeState({
                    globals: { a: createReferenceValue('list', 'obj_list') },
                    heap: heapBefore,
                }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'b = a' },
                runtimeState: new RuntimeState({
                    globals: {
                        a: createReferenceValue('list', 'obj_list'),
                        b: createReferenceValue('list', 'obj_list'),
                    },
                    heap: heapBefore,
                }),
            },
            {
                id: 2,
                type: 'line',
                source: { file: 'main.py', line: 3 },
                data: { code_line: 'b.append(1)' },
                runtimeState: new RuntimeState({
                    globals: {
                        a: createReferenceValue('list', 'obj_list'),
                        b: createReferenceValue('list', 'obj_list'),
                    },
                    heap: heapAfter,
                }),
            },
        ],
    };

    const analyzer = new DataflowAnalyzer();
    const graph = analyzer.analyze(mockTrace);
    const queries = new DataflowQueries(graph);

    const mutations = queries.findMutations('obj_list');
    assert(mutations.length >= 1, 'Detected mutation on obj_list');
    assert(mutations[0].operation === 'append', 'Mutation is append operation');

    const impact = queries.findImpact('obj_list');
    assert(impact.aliases.includes('a') && impact.aliases.includes('b'), 'Impact includes all aliases');
    assert(impact.mutations.length >= 1, 'Impact includes applied mutations');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Object Field & Collection Element Flow
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Object Field & Collection Element Flow...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'items[0] = 42' },
                runtimeState: new RuntimeState({
                    globals: { items: createReferenceValue('list', 'obj_arr') },
                    heap: new Heap({ obj_arr: { id: 'obj_arr', type: 'list', elements: [createPrimitiveValue('int', 42)] } }),
                }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'user.role = "admin"' },
                runtimeState: new RuntimeState({
                    globals: { user: createReferenceValue('User', 'obj_user') },
                    heap: new Heap({ obj_user: { id: 'obj_user', type: 'instance', className: 'User', fields: { role: createPrimitiveValue('str', 'admin') } } }),
                }),
            },
        ],
    };

    const analyzer = new DataflowAnalyzer();
    const graph = analyzer.analyze(mockTrace);

    assert(graph.mutations.some(m => m.operation === 'replace' && m.target === '0'), 'Recorded element write mutation');
    assert(graph.mutations.some(m => m.operation === 'field_write' && m.target === 'role'), 'Recorded field write mutation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Function Parameter & Return Flow
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Function Parameter & Return Flow...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'val = 10' },
                runtimeState: new RuntimeState({
                    globals: { val: createPrimitiveValue('int', 10) },
                }),
            },
            {
                id: 1,
                type: 'call',
                source: { file: 'main.py', line: 3 },
                scope: { function: 'calc', depth: 2 },
                data: { code_line: 'def calc(num):' },
                runtimeState: new RuntimeState({
                    globals: { val: createPrimitiveValue('int', 10) },
                    callStack: [
                        new CallFrame({
                            frameId: 'frame_1',
                            functionName: 'calc',
                            scope: new Scope('local', { num: createPrimitiveValue('int', 10) }),
                            depth: 2,
                        }),
                    ],
                }),
            },
            {
                id: 2,
                type: 'return',
                source: { file: 'main.py', line: 4 },
                scope: { function: 'calc', depth: 2 },
                data: { code_line: 'return num * 2' },
                runtimeState: new RuntimeState({
                    globals: { val: createPrimitiveValue('int', 10) },
                    callStack: [
                        new CallFrame({
                            frameId: 'frame_1',
                            functionName: 'calc',
                            scope: new Scope('local', { num: createPrimitiveValue('int', 10) }),
                            depth: 2,
                        }),
                    ],
                }),
            },
        ],
    };

    const analyzer = new DataflowAnalyzer();
    const graph = analyzer.analyze(mockTrace);

    assert(graph.hasNode('df_var_0_local_main_py_val'), 'Caller argument variable defined');
    assert(graph.definitions.size >= 1, 'Definitions recorded in function scope');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Multi-File Dataflow
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Multi-File Dataflow Boundaries...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'utils.py', fileId: 'f_utils', line: 1 },
                data: { code_line: 'shared_key = "secret_123"' },
                runtimeState: new RuntimeState({
                    globals: { shared_key: createPrimitiveValue('str', 'secret_123') },
                }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', fileId: 'f_main', line: 5 },
                data: { code_line: 'api_token = shared_key' },
                runtimeState: new RuntimeState({
                    globals: {
                        shared_key: createPrimitiveValue('str', 'secret_123'),
                        api_token: createPrimitiveValue('str', 'secret_123'),
                    },
                }),
            },
        ],
    };

    const analyzer = new DataflowAnalyzer();
    const graph = analyzer.analyze(mockTrace);
    const queries = new DataflowQueries(graph);

    const originsToken = queries.findOrigins('api_token');
    assert(originsToken.origins.some(o => o.label === 'shared_key'), 'Cross-file origin resolved from utils.py to main.py');
    assert(originsToken.sourceLocations.some(l => l.fileId === 'f_utils'), 'utils.py source location preserved in dataflow trace');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Cyclic Structures & Safe Bounded Traversal
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Cyclic Heap Structures & Bounded Traversal...');
{
    const cyclicHeap = new Heap({
        obj_cyclic: { id: 'obj_cyclic', type: 'list', elements: [createReferenceValue('list', 'obj_cyclic')] },
    });

    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'a = []' },
                runtimeState: new RuntimeState({
                    globals: { a: createReferenceValue('list', 'obj_cyclic') },
                    heap: cyclicHeap,
                }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'a.append(a)' },
                runtimeState: new RuntimeState({
                    globals: { a: createReferenceValue('list', 'obj_cyclic') },
                    heap: cyclicHeap,
                }),
            },
        ],
    };

    const analyzer = new DataflowAnalyzer();
    const graph = analyzer.analyze(mockTrace);
    const queries = new DataflowQueries(graph);

    // Ensure traversal does not crash or loop infinitely
    const path = queries.findDataPath('a', 'a');
    assert(path.found === true, 'Self-path found without infinite loop');

    const origins = queries.findOrigins('a');
    assert(origins.path.length > 0, 'Origins returned safely for cyclic structure');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Historical Queries & Navigation Independence Invariant
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Historical Queries & Navigation Independence...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'x = 10' },
                runtimeState: new RuntimeState({ globals: { x: createPrimitiveValue('int', 10) } }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'x = 20' },
                runtimeState: new RuntimeState({ globals: { x: createPrimitiveValue('int', 20) } }),
            },
            {
                id: 2,
                type: 'line',
                source: { file: 'main.py', line: 3 },
                data: { code_line: 'x = 30' },
                runtimeState: new RuntimeState({ globals: { x: createPrimitiveValue('int', 30) } }),
            },
        ],
    };

    const dbg = new Debugger();
    dbg.loadExecution(mockTrace);

    // Query frame 1 when at frame 0
    const defF1_from0 = dbg.getDefinition('x', 1);

    // Move debugger to frame 2
    dbg.jumpTo(2);
    const defF1_from2 = dbg.getDefinition('x', 1);

    assert(defF1_from0.value.value === defF1_from2.value.value, 'Historical query at frame 1 produces identical result regardless of current debugger frame position');
    assert(defF1_from0.value.value === 20, 'Resolved correct historical definition (20)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Watch Expression Integration: explainWatchChange
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing Watch Integration (explainWatchChange)...');
{
    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'total = 50' },
                runtimeState: new RuntimeState({ globals: { total: createPrimitiveValue('int', 50) } }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'total = 100' },
                runtimeState: new RuntimeState({ globals: { total: createPrimitiveValue('int', 100) } }),
            },
        ],
    };

    const dbg = new Debugger();
    dbg.loadExecution(mockTrace);
    const watch = dbg.addWatch('total');

    const explanation = dbg.explainWatchChange(watch.id, 0, 1);
    assert(explanation.changed === true, 'Watch change detected');
    assert(explanation.relevantDefinitions.length === 1, 'Identified 1 relevant definition causing the change');
    assert(explanation.relevantDefinitions[0].value.value === 100, 'Identified new definition value (100)');
    assert(explanation.sourceLocations.length === 1, 'Identified source location causing change');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. ObjectInspector Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing ObjectInspector Integration...');
{
    const heap = new Heap({
        obj_user: { id: 'obj_user', type: 'instance', className: 'User', fields: { name: createPrimitiveValue('str', 'Alice') } },
    });

    const mockTrace = {
        metadata: { language: 'python' },
        events: [
            {
                id: 0,
                type: 'line',
                source: { file: 'main.py', line: 1 },
                data: { code_line: 'user = User("Alice")' },
                runtimeState: new RuntimeState({
                    globals: { user: createReferenceValue('User', 'obj_user') },
                    heap,
                }),
            },
            {
                id: 1,
                type: 'line',
                source: { file: 'main.py', line: 2 },
                data: { code_line: 'admin = user' },
                runtimeState: new RuntimeState({
                    globals: {
                        user: createReferenceValue('User', 'obj_user'),
                        admin: createReferenceValue('User', 'obj_user'),
                    },
                    heap,
                }),
            },
        ],
    };

    const analyzer = new DataflowAnalyzer();
    const graph = analyzer.analyze(mockTrace);
    const queries = new DataflowQueries(graph);

    const inspector = new ObjectInspector({ runtimeState: mockTrace.events[1].runtimeState });
    inspector.setDataflowQueries(queries);

    const aliases = inspector.getObjectAliases('obj_user');
    assert(aliases.includes('user') && aliases.includes('admin'), 'ObjectInspector retrieved dataflow aliases');

    const fullDf = inspector.getObjectDataflow('obj_user');
    assert(fullDf.objectId === 'obj_user', 'ObjectInspector resolved full dataflow package');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. DataflowSnapshot & Historical Diffing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing DataflowSnapshot & Historical Diffing...');
{
    const graph = new DataflowGraph();
    graph.addDefinition(new Definition({ variableName: 'a', frameIndex: 0, value: createPrimitiveValue('int', 1) }));
    graph.addDefinition(new Definition({ variableName: 'b', frameIndex: 1, value: createPrimitiveValue('int', 2) }));

    const snap0 = DataflowSnapshot.capture(graph, 0);
    const snap1 = DataflowSnapshot.capture(graph, 1);

    assert(snap0.definitions.length === 1, 'Snapshot 0 has 1 definition');
    assert(snap1.definitions.length === 2, 'Snapshot 1 has 2 definitions');

    const diff = snap1.diff(snap0);
    assert(diff.newDefinitions.length === 1, 'Diff detected exactly 1 new definition');
    assert(diff.newDefinitions[0].variableName === 'b', 'New definition is b');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Graph Serialization Round-Trip
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing DataflowGraph Serialization & Deserialization...');
{
    const graph = new DataflowGraph();
    const node1 = graph.addNode(DataflowNode.createVariableNode({ name: 'x', frameIndex: 0 }));
    const node2 = graph.addNode(DataflowNode.createVariableNode({ name: 'y', frameIndex: 1 }));
    graph.addEdge(new DataflowEdge({
        type: DATAFLOW_EDGE_TYPES.DATA_DEPENDS_ON,
        fromId: node1.id,
        toId: node2.id,
        frameIndex: 1,
    }));
    graph.addDefinition(new Definition({ variableName: 'x', frameIndex: 0 }));
    graph.addUse(new Use({ variableName: 'x', frameIndex: 1 }));
    graph.addAlias('obj_1', 'x', 0);
    graph.addMutation(new MutationRecord({ objectId: 'obj_1', operation: 'append', frameIndex: 1 }));

    const serialized = graph.toJSON();
    const restored = DataflowGraph.fromJSON(serialized);

    assert(restored.nodes.size === graph.nodes.size, 'Restored same number of nodes');
    assert(restored.edges.size === graph.edges.size, 'Restored same number of edges');
    assert(restored.definitions.size === graph.definitions.size, 'Restored definitions');
    assert(restored.uses.size === graph.uses.size, 'Restored uses');
    assert(restored.aliasSets.size === graph.aliasSets.size, 'Restored alias sets');
    assert(restored.mutations.length === graph.mutations.length, 'Restored mutations');
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Large Scale Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n17. Testing Large Scale Performance Benchmarks...');
{
    const graph = new DataflowGraph();

    // 1. Construct 1,000 definitions, uses, and dependencies
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
        const nodeA = graph.addNode(DataflowNode.createVariableNode({ name: `var_${i}`, frameIndex: i }));
        const nodeB = graph.addNode(DataflowNode.createVariableNode({ name: `dep_${i}`, frameIndex: i }));

        graph.addEdge(new DataflowEdge({
            type: DATAFLOW_EDGE_TYPES.DATA_DEPENDS_ON,
            fromId: nodeA.id,
            toId: nodeB.id,
            frameIndex: i,
        }));

        graph.addDefinition(new Definition({ variableName: `var_${i}`, frameIndex: i }));
        graph.addUse(new Use({ variableName: `var_${i}`, frameIndex: i }));
    }
    const tConstruct = performance.now() - t0;
    assert(tConstruct < 200, `Constructed 1,000 nodes & edges in ${tConstruct.toFixed(1)}ms (< 200ms)`);

    // 2. Execute 10,000 queries
    const queries = new DataflowQueries(graph);
    const tQ0 = performance.now();
    for (let i = 0; i < 10000; i++) {
        const idx = i % 1000;
        queries.findLastDefinition(`var_${idx}`, idx);
    }
    const tQueries = performance.now() - tQ0;
    assert(tQueries < 300, `Executed 10,000 dataflow queries in ${tQueries.toFixed(1)}ms (< 300ms)`);

    // 3. Path query performance
    const tP0 = performance.now();
    const pRes = queries.findDataPath('df_var_0_local_main_py_var_0', 'df_var_0_local_main_py_dep_0');
    const tPath = performance.now() - tP0;
    assert(pRes.found === true && tPath < 20, `Executed path search in ${tPath.toFixed(2)}ms (< 20ms)`);
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
