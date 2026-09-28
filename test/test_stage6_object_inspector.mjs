/**
 * Stage 6 Test Suite — Universal Object Inspector & Heap Explorer
 *
 * Verification Requirements:
 *  1. Primitive Values Inspection
 *  2. Single Object Inspection
 *  3. Aliasing (a = []; b = a => shared object identity obj_N)
 *  4. Nested Structures (a = [{"x": [1, 2]}])
 *  5. Shared Nested Objects (x = []; a = [x]; b = {"x": x})
 *  6. Cyclic Reference Protections (a = []; a.append(a))
 *  7. Custom Object Class Instances & Attributes
 *  8. Inbound Referrer Discovery (getReferrers from variables & heap objects)
 *  9. Historical Object Inspection across Time/Scrubbing
 * 10. Object Lifetime & Disappearance Handling
 * 11. Historical Mutation Inspection
 * 12. Dictionaries Key/Value Identity
 * 13. Sets Handling (Unordered member safety)
 * 14. SceneGraph Mapping Adapter (SceneInspectorAdapter)
 * 15. Inspection Determinism (Repeated inspections yield identical results)
 * 16. Bounded Large Object Graph Inspection (Memory & recursion safety)
 */

import { ObjectInspector } from '../src/inspector/ObjectInspector.js';
import { SceneInspectorAdapter } from '../src/inspector/SceneInspectorAdapter.js';
import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { Heap } from '../src/runtime/Heap.js';
import { HeapObject } from '../src/runtime/HeapObject.js';
import { CallFrame } from '../src/runtime/CallFrame.js';
import { createPrimitiveValue, createReferenceValue } from '../src/runtime/Value.js';
import { Debugger } from '../src/debugger/Debugger.js';
import { SceneBuilder } from '../src/scene/SceneBuilder.js';
import { TRACE_SCHEMA_VERSION, EVENT_TYPES, createTraceEvent, createExecutionTrace } from '../src/trace/TraceSchema.js';

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
    }
}

console.log('=== ProViz Stage 6: Universal Object Inspector Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Primitive Values Inspection
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Primitive Values Inspection...');
{
    const state = new RuntimeState();
    state.setVariable('x', createPrimitiveValue('int', 42));
    state.setVariable('s', createPrimitiveValue('str', 'hello world'));

    const inspector = new ObjectInspector({ runtimeState: state });

    const varX = state.getVariable('x');
    const varS = state.getVariable('s');

    assert(varX.value === 42, 'x value is 42');
    assert(varS.value === 'hello world', 's value is "hello world"');
    assert(!inspector.hasObject('x'), 'Primitive variable x does not spawn a fake heap object');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Single Object & Details
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Single Object Details...');
{
    const state = new RuntimeState();
    const listObj = new HeapObject({
        id: 'obj_1',
        type: 'list',
        elements: [createPrimitiveValue('int', 10), createPrimitiveValue('int', 20)],
    });
    state.heap.setObject(listObj);
    state.setVariable('a', createReferenceValue('obj_1'));

    const inspector = new ObjectInspector({ runtimeState: state });
    const details = inspector.getObjectDetails('obj_1');

    assert(details.exists, 'Object obj_1 exists in heap');
    assert(details.type === 'list', 'Type is list');
    assert(details.size === 2, 'Size is 2 elements');
    assert(details.boundVariables.includes('a'), 'Bound variable list includes "a"');
    assert(details.referrers.length === 1 && details.referrers[0].name === 'a', 'Referrers list identifies global/local variable "a"');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Aliasing (a = []; b = a)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Object Identity & Aliasing (a = []; b = a)...');
{
    const state = new RuntimeState();
    const sharedList = new HeapObject({
        id: 'obj_shared',
        type: 'list',
        elements: [createPrimitiveValue('int', 99)],
    });
    state.heap.setObject(sharedList);
    state.setVariable('a', createReferenceValue('obj_shared'));
    state.setVariable('b', createReferenceValue('obj_shared'));

    const inspector = new ObjectInspector({ runtimeState: state });
    const details = inspector.getObjectDetails('obj_shared');

    assert(details.boundVariables.length === 2, 'Object is bound to 2 variables');
    assert(details.boundVariables.includes('a') && details.boundVariables.includes('b'), 'Variables a and b both reference obj_shared');
    assert(details.referrers.length === 2, 'getReferrers returns exactly 2 referrer edges for obj_shared');
    assert(state.heap.getAllObjects().length === 1, 'Only 1 heap object exists (no duplicate lists created)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Nested Structures
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Nested Structures (a = [{"x": [1, 2]}])...');
{
    const state = new RuntimeState();
    const innerList = new HeapObject({
        id: 'obj_inner',
        type: 'list',
        elements: [createPrimitiveValue('int', 1), createPrimitiveValue('int', 2)],
    });
    const innerDict = new HeapObject({
        id: 'obj_dict',
        type: 'dict',
        entries: [{ key: 'x', value: createReferenceValue('obj_inner') }],
    });
    const outerList = new HeapObject({
        id: 'obj_outer',
        type: 'list',
        elements: [createReferenceValue('obj_dict')],
    });

    state.heap.setObject(innerList);
    state.heap.setObject(innerDict);
    state.heap.setObject(outerList);
    state.setVariable('a', createReferenceValue('obj_outer'));

    const inspector = new ObjectInspector({ runtimeState: state });

    const outerDetails = inspector.getObjectDetails('obj_outer');
    assert(outerDetails.references.length === 1, 'Outer list references 1 object');
    assert(outerDetails.references[0].targetObjectId === 'obj_dict', 'Outer list references obj_dict');

    const dictReferrers = inspector.getReferrers('obj_dict');
    assert(dictReferrers.some(r => r.sourceObjectId === 'obj_outer'), 'obj_dict identifies obj_outer as referrer');

    const innerReferrers = inspector.getReferrers('obj_inner');
    assert(innerReferrers.some(r => r.sourceObjectId === 'obj_dict'), 'obj_inner identifies obj_dict as referrer');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Shared Nested Objects
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Shared Nested Objects (x = []; a = [x]; b = {"x": x})...');
{
    const state = new RuntimeState();
    const xObj = new HeapObject({ id: 'obj_x', type: 'list', elements: [] });
    const aList = new HeapObject({ id: 'obj_a', type: 'list', elements: [createReferenceValue('obj_x')] });
    const bDict = new HeapObject({ id: 'obj_b', type: 'dict', entries: [{ key: 'x', value: createReferenceValue('obj_x') }] });

    state.heap.setObject(xObj);
    state.heap.setObject(aList);
    state.heap.setObject(bDict);

    state.setVariable('x', createReferenceValue('obj_x'));
    state.setVariable('a', createReferenceValue('obj_a'));
    state.setVariable('b', createReferenceValue('obj_b'));

    const inspector = new ObjectInspector({ runtimeState: state });
    const xReferrers = inspector.getReferrers('obj_x');

    assert(xReferrers.length === 3, `obj_x has 3 referrers (variable x, obj_a[0], obj_b["x"]) (actual: ${xReferrers.length})`);
    assert(xReferrers.some(r => r.sourceKind === 'variable' && r.name === 'x'), 'Identifies variable x as referrer');
    assert(xReferrers.some(r => r.sourceObjectId === 'obj_a'), 'Identifies obj_a as referrer');
    assert(xReferrers.some(r => r.sourceObjectId === 'obj_b'), 'Identifies obj_b as referrer');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Cyclic Reference Protections (a = []; a.append(a))
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Cyclic Reference Protection...');
{
    const state = new RuntimeState();
    const cyclicObj = new HeapObject({
        id: 'obj_cycle',
        type: 'list',
        elements: [createReferenceValue('obj_cycle')],
    });
    state.heap.setObject(cyclicObj);

    const inspector = new ObjectInspector({ runtimeState: state });

    const tree = inspector.getObjectTree('obj_cycle');
    assert(tree.children.length === 1, 'Cyclic list has 1 child element');
    assert(tree.children[0].child.isCycle === true, 'Child node is correctly flagged as a cycle (isCycle: true)');
    assert(tree.children[0].child.preview.includes('cycle'), 'Child node preview indicates cycle');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Custom Class Instances & Attributes
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Custom Class Instances & Attributes...');
{
    const state = new RuntimeState();
    const personObj = new HeapObject({
        id: 'obj_person',
        type: 'instance',
        className: 'Person',
        fields: {
            name: createPrimitiveValue('str', 'Alice'),
            age: createPrimitiveValue('int', 25),
        },
    });
    state.heap.setObject(personObj);
    state.setVariable('p', createReferenceValue('obj_person'));

    const inspector = new ObjectInspector({ runtimeState: state });
    const details = inspector.getObjectDetails('obj_person');

    assert(details.className === 'Person', 'className is Person');
    assert(details.fields.name.value === 'Alice', 'field name is Alice');
    assert(details.fields.age.value === 25, 'field age is 25');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 8: Historical Inspection & Timeline Scrubbing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Historical Object Inspection across Time...');
{
    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 1 },
            data: {
                locals: { nums: createReferenceValue('obj_1') },
                heap: { obj_1: { id: 'obj_1', type: 'list', elements: [createPrimitiveValue('int', 10)] } },
            },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 2 },
            data: {
                locals: { nums: createReferenceValue('obj_1') },
                heap: { obj_1: { id: 'obj_1', type: 'list', elements: [createPrimitiveValue('int', 10), createPrimitiveValue('int', 20)] } },
            },
        }),
    ];
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);

    const inspector = new ObjectInspector();

    // Inspect at frame 0
    dbg.jumpTo(0);
    inspector.setRuntimeState(dbg.getDebuggerState().runtimeState);
    const detailsFrame0 = inspector.getObjectDetails('obj_1');
    assert(detailsFrame0.size === 1, 'Frame 0: obj_1 has 1 element');

    // Scrub to frame 1
    dbg.jumpTo(1);
    inspector.setRuntimeState(dbg.getDebuggerState().runtimeState);
    const detailsFrame1 = inspector.getObjectDetails('obj_1');
    assert(detailsFrame1.size === 2, 'Frame 1: obj_1 has 2 elements');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 9: Object Disappearance & Lifetime Handling
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Object Lifetime & Disappearance Handling...');
{
    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 1 },
            data: { locals: { x: createPrimitiveValue('int', 5) }, heap: {} },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 2 },
            data: {
                locals: { x: createPrimitiveValue('int', 5), obj: createReferenceValue('obj_late') },
                heap: { obj_late: { id: 'obj_late', type: 'dict', entries: [] } },
            },
        }),
    ];
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);
    const inspector = new ObjectInspector();

    // Frame 1: obj_late exists
    dbg.jumpTo(1);
    inspector.setRuntimeState(dbg.getDebuggerState().runtimeState);
    assert(inspector.hasObject('obj_late'), 'Frame 1: obj_late exists');

    // Scrub back to frame 0: obj_late does not exist yet
    dbg.jumpTo(0);
    inspector.setRuntimeState(dbg.getDebuggerState().runtimeState);
    assert(!inspector.hasObject('obj_late'), 'Frame 0: obj_late does not exist');
    const missingDetails = inspector.getObjectDetails('obj_late');
    assert(missingDetails.exists === false, 'getObjectDetails returns exists: false gracefully');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 10: Dictionaries Key/Value Structure
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Dictionaries Key/Value Inspection...');
{
    const state = new RuntimeState();
    const valObj = new HeapObject({ id: 'obj_val', type: 'list', elements: [createPrimitiveValue('int', 100)] });
    const dictObj = new HeapObject({
        id: 'obj_dict',
        type: 'dict',
        entries: [
            { key: createPrimitiveValue('str', 'items'), value: createReferenceValue('obj_val') },
        ],
    });
    state.heap.setObject(valObj);
    state.heap.setObject(dictObj);

    const inspector = new ObjectInspector({ runtimeState: state });
    const details = inspector.getObjectDetails('obj_dict');

    assert(details.type === 'dict', 'Object type is dict');
    assert(details.entries.length === 1, 'Dict has 1 entry');
    assert(details.references.length === 1 && details.references[0].targetObjectId === 'obj_val', 'Dict references obj_val outbound');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 11: Sets Unordered Member Safety
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Sets Unordered Member Safety...');
{
    const state = new RuntimeState();
    const setObj = new HeapObject({
        id: 'obj_set',
        type: 'set',
        elements: [createPrimitiveValue('int', 10), createPrimitiveValue('int', 20)],
    });
    state.heap.setObject(setObj);

    const inspector = new ObjectInspector({ runtimeState: state });
    const details = inspector.getObjectDetails('obj_set');

    assert(details.type === 'set', 'Object type is set');
    assert(details.size === 2, 'Set size is 2');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 12: SceneGraph Mapping Adapter (SceneInspectorAdapter)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing SceneInspectorAdapter Mapping...');
{
    const state = new RuntimeState();
    const listObj = new HeapObject({ id: 'obj_42', type: 'list', elements: [] });
    state.heap.setObject(listObj);

    const builder = new SceneBuilder();
    const sceneGraph = builder.build(state);

    const inspector = new ObjectInspector({ runtimeState: state });
    const adapter = new SceneInspectorAdapter({ inspector, sceneGraph });

    // Test selectFromScene using scene node ID
    const selected = adapter.selectFromScene('scene_obj_42');
    assert(selected !== null && selected.objectId === 'obj_42', 'Adapter maps scene_obj_42 to obj_42 in ObjectInspector');

    // Test reverse lookup (getSceneNodeForObject)
    const sceneNode = adapter.getSceneNodeForObject('obj_42');
    assert(sceneNode !== null && sceneNode.id === 'scene_obj_42', 'Adapter finds SceneNode scene_obj_42 for obj_42');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 13: Search & Path Discovery
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing Search & Directed Reference Path Discovery...');
{
    const state = new RuntimeState();
    const targetObj = new HeapObject({ id: 'obj_target', type: 'list', elements: [] });
    const midObj = new HeapObject({ id: 'obj_mid', type: 'list', elements: [createReferenceValue('obj_target')] });
    const rootObj = new HeapObject({ id: 'obj_root', type: 'list', elements: [createReferenceValue('obj_mid')] });

    state.heap.setObject(targetObj);
    state.heap.setObject(midObj);
    state.heap.setObject(rootObj);
    state.setVariable('myVar', createReferenceValue('obj_root'));

    const inspector = new ObjectInspector({ runtimeState: state });

    // Test Heap Overview
    const overview = inspector.getHeapOverview();
    assert(overview.length === 3, `Heap overview returns 3 objects (actual: ${overview.length})`);

    // Test Search
    const searchResults = inspector.search('target');
    assert(searchResults.length === 1 && searchResults[0].objectId === 'obj_target', 'Search by ID "target" finds obj_target');

    const searchVarResults = inspector.search('myVar');
    assert(searchVarResults.length === 1 && searchVarResults[0].objectId === 'obj_root', 'Search by variable "myVar" finds obj_root');

    // Test Path Discovery obj_root -> obj_target
    const path = inspector.getPath('obj_root', 'obj_target');
    assert(Array.isArray(path), 'getPath returns path array');
    assert(path.join(' -> ') === 'obj_root -> obj_mid -> obj_target', `Path resolved: ${path.join(' -> ')}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 14: Inspection Determinism
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing Inspection Determinism...');
{
    const state = new RuntimeState();
    const obj = new HeapObject({ id: 'obj_det', type: 'list', elements: [createPrimitiveValue('int', 100)] });
    state.heap.setObject(obj);

    const inspector = new ObjectInspector({ runtimeState: state });

    const d1 = JSON.stringify(inspector.getObjectDetails('obj_det'));
    const d2 = JSON.stringify(inspector.getObjectDetails('obj_det'));

    assert(d1 === d2, 'Repeated getObjectDetails calls yield byte-for-byte identical JSON output');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 15: Bounded Large Object Graph Inspection
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing Bounded Large Object Graph Inspection...');
{
    const state = new RuntimeState();
    // Create chain of 50 objects obj_0 -> obj_1 -> ... -> obj_49
    for (let i = 0; i < 50; i++) {
        const nextId = i < 49 ? `obj_${i + 1}` : null;
        const o = new HeapObject({
            id: `obj_${i}`,
            type: 'list',
            elements: nextId ? [createReferenceValue(nextId)] : [createPrimitiveValue('int', 999)],
        });
        state.heap.setObject(o);
    }

    const inspector = new ObjectInspector({ runtimeState: state });

    const startTime = Date.now();
    const tree = inspector.getObjectTree('obj_0');
    const duration = Date.now() - startTime;

    assert(tree !== null, 'Large graph inspection completed successfully');
    assert(duration < 100, `Inspection completed in ${duration}ms (bounded limit)`);
}

console.log(`\n========================================`);
console.log(`Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
console.log(`========================================\n`);

if (failedTests > 0) {
    process.exit(1);
}
