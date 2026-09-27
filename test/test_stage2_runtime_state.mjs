/**
 * Stage 2 Test Suite — Runtime State, Object Identity & Heap Graph
 *
 * Tests:
 *  1. Primitive Values (int, float, bool, str, None)
 *  2. List Object Representation
 *  3. Shared Reference (a = []; b = a)
 *  4. Mutation Through Alias (a = []; b = a; a.append(1))
 *  5. Dictionary Representation
 *  6. Nested Structures (dict containing list)
 *  7. Shared Nested Objects (data = {'a': items, 'b': items})
 *  8. Cyclic References (a = []; a.append(a))
 *  9. Class Instances & Attributes
 * 10. Object Field Mutation (p.name = 'Alice'; p.name = 'Bob')
 * 11. Function Scope & Call Stack Popping
 * 12. Recursion & Distinct Call Frames
 * 13. Returned Object Identity Preservation
 * 14. Structured Exception Handling
 */

import { VALUE_KINDS, createPrimitiveValue, createReferenceValue, stringifyValue, isPrimitive, isReference } from '../src/runtime/Value.js';
import { HeapObject } from '../src/runtime/HeapObject.js';
import { Heap } from '../src/runtime/Heap.js';
import { Scope } from '../src/runtime/Scope.js';
import { CallFrame } from '../src/runtime/CallFrame.js';
import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { createExecutionTrace, createTraceEvent, EVENT_TYPES } from '../src/trace/TraceSchema.js';
import { LegacyFrameAdapter } from '../src/trace/LegacyFrameAdapter.js';

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

console.log('=== ProViz Stage 2: Runtime State, Object Identity & Heap Graph Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Primitive Values
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Primitive Values...');
{
    const intVal = createPrimitiveValue('int', 42);
    const floatVal = createPrimitiveValue('float', 3.14);
    const boolVal = createPrimitiveValue('bool', true);
    const strVal = createPrimitiveValue('str', 'Hello');
    const noneVal = createPrimitiveValue('NoneType', null);

    assert(isPrimitive(intVal) && intVal.value === 42, 'Integer primitive structured correctly');
    assert(isPrimitive(floatVal) && floatVal.value === 3.14, 'Float primitive structured correctly');
    assert(isPrimitive(boolVal) && boolVal.value === true, 'Boolean primitive structured correctly');
    assert(isPrimitive(strVal) && strVal.value === 'Hello', 'String primitive structured correctly');
    assert(isPrimitive(noneVal) && noneVal.value === null, 'None primitive structured correctly');

    assert(stringifyValue(intVal) === '42', 'Stringifies integer: 42');
    assert(stringifyValue(boolVal) === 'True', 'Stringifies boolean: True');
    assert(stringifyValue(strVal) === '"Hello"', 'Stringifies string: "Hello"');
    assert(stringifyValue(noneVal) === 'None', 'Stringifies None: None');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: List Object Representation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing List Object Representation...');
{
    const heap = new Heap();
    const listObj = new HeapObject({
        id: 'obj_1',
        type: 'list',
        elements: [
            createPrimitiveValue('int', 1),
            createPrimitiveValue('int', 2),
            createPrimitiveValue('int', 3),
        ],
    });
    heap.setObject(listObj);

    const ref = createReferenceValue('list', 'obj_1');
    assert(isReference(ref), 'Reference descriptor created');
    assert(ref.objectId === 'obj_1', 'Reference points to obj_1');
    assert(heap.getObject('obj_1').elements.length === 3, 'Heap holds 3 elements');
    assert(stringifyValue(ref, heap) === '[1, 2, 3]', 'Stringifies list: [1, 2, 3]');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Shared References (a = []; b = a)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Shared References...');
{
    const heap = new Heap();
    const emptyList = new HeapObject({ id: 'obj_1', type: 'list', elements: [] });
    heap.setObject(emptyList);

    const refA = createReferenceValue('list', 'obj_1');
    const refB = createReferenceValue('list', 'obj_1');

    assert(refA.objectId === refB.objectId, 'a and b share identical objectId obj_1');
    assert(refA.objectId === 'obj_1', 'Stable object ID preserved');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Mutation Through Alias (a.append(1))
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Mutation Through Alias...');
{
    const heap = new Heap();
    const listObj = new HeapObject({ id: 'obj_1', type: 'list', elements: [] });
    heap.setObject(listObj);

    const refA = createReferenceValue('list', 'obj_1');
    const refB = createReferenceValue('list', 'obj_1');

    // Mutate list via heap operation
    heap.applyMutation({
        targetObjectId: 'obj_1',
        operation: 'append',
        data: { value: createPrimitiveValue('int', 1) },
    });

    const valA = stringifyValue(refA, heap);
    const valB = stringifyValue(refB, heap);

    assert(valA === '[1]', 'a sees mutated list: [1]');
    assert(valB === '[1]', 'b sees mutated list: [1]');
    assert(heap.getObject('obj_1').elements[0].value === 1, 'Heap element updated to 1');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Dictionary Representation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Dictionary Representation...');
{
    const heap = new Heap();
    const dictObj = new HeapObject({
        id: 'obj_2',
        type: 'dict',
        entries: [
            { key: createPrimitiveValue('str', 'name'), value: createPrimitiveValue('str', 'Alice') },
            { key: createPrimitiveValue('str', 'age'), value: createPrimitiveValue('int', 25) },
        ],
    });
    heap.setObject(dictObj);

    const ref = createReferenceValue('dict', 'obj_2');
    assert(heap.getObject('obj_2').entries.length === 2, 'Dict has 2 entries');
    const str = stringifyValue(ref, heap);
    assert(str.includes('"name": "Alice"') && str.includes('"age": 25'), 'Stringifies dict with keys and values');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Nested Structure (data = {'items': [1, 2, 3]})
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Nested Structure...');
{
    const heap = new Heap();
    const listObj = new HeapObject({
        id: 'obj_1',
        type: 'list',
        elements: [createPrimitiveValue('int', 1), createPrimitiveValue('int', 2), createPrimitiveValue('int', 3)],
    });
    heap.setObject(listObj);

    const dictObj = new HeapObject({
        id: 'obj_2',
        type: 'dict',
        entries: [
            { key: createPrimitiveValue('str', 'items'), value: createReferenceValue('list', 'obj_1') },
        ],
    });
    heap.setObject(dictObj);

    const dictRef = createReferenceValue('dict', 'obj_2');
    const outRefs = dictObj.getOutboundReferences();

    assert(outRefs.includes('obj_1'), 'Dict has outbound reference edge to list obj_1');
    assert(stringifyValue(dictRef, heap) === '{"items": [1, 2, 3]}', 'Resolves nested list reference inside dict');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Shared Nested Object (data = {'a': items, 'b': items})
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Shared Nested Object...');
{
    const heap = new Heap();
    const listObj = new HeapObject({
        id: 'obj_1',
        type: 'list',
        elements: [createPrimitiveValue('int', 42)],
    });
    heap.setObject(listObj);

    const dictObj = new HeapObject({
        id: 'obj_2',
        type: 'dict',
        entries: [
            { key: createPrimitiveValue('str', 'a'), value: createReferenceValue('list', 'obj_1') },
            { key: createPrimitiveValue('str', 'b'), value: createReferenceValue('list', 'obj_1') },
        ],
    });
    heap.setObject(dictObj);

    const entryA = dictObj.entries.find(e => e.key.value === 'a');
    const entryB = dictObj.entries.find(e => e.key.value === 'b');

    assert(entryA.value.objectId === entryB.value.objectId, 'data["a"] and data["b"] reference the same objectId obj_1');
    assert(entryA.value.objectId === 'obj_1', 'Target objectId is obj_1');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 8: Cyclic References (a = []; a.append(a))
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Cyclic References...');
{
    const heap = new Heap();
    const cyclicList = new HeapObject({
        id: 'obj_1',
        type: 'list',
        elements: [],
    });
    heap.setObject(cyclicList);

    // a.append(a) -> references self
    cyclicList.elements.push(createReferenceValue('list', 'obj_1'));

    const refA = createReferenceValue('list', 'obj_1');
    let strOutput = '';
    let didThrow = false;
    try {
        strOutput = stringifyValue(refA, heap);
    } catch (e) {
        didThrow = true;
    }

    assert(!didThrow, 'Cycle resolution does not throw stack overflow');
    assert(strOutput.includes('Cyclic') || strOutput.includes('obj_1'), 'Cycle handled gracefully in string representation');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 9: Class Instance & Attributes
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Class Instance...');
{
    const heap = new Heap();
    const personObj = new HeapObject({
        id: 'obj_3',
        type: 'instance',
        className: 'Person',
        fields: {
            name: createPrimitiveValue('str', 'Alice'),
        },
    });
    heap.setObject(personObj);

    const ref = createReferenceValue('Person', 'obj_3');
    assert(heap.getObject('obj_3').className === 'Person', 'Instance className is Person');
    assert(heap.getObject('obj_3').fields.name.value === 'Alice', 'Instance field name is Alice');
    assert(stringifyValue(ref, heap) === 'Person(name="Alice")', 'Stringifies class instance: Person(name="Alice")');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 10: Object Field Mutation (p.name = 'Bob')
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Object Field Mutation...');
{
    const heap = new Heap();
    const personObj = new HeapObject({
        id: 'obj_3',
        type: 'instance',
        className: 'Person',
        fields: {
            name: createPrimitiveValue('str', 'Alice'),
        },
    });
    heap.setObject(personObj);

    heap.applyMutation({
        targetObjectId: 'obj_3',
        operation: 'set_attr',
        data: { name: 'name', value: createPrimitiveValue('str', 'Bob') },
    });

    const ref = createReferenceValue('Person', 'obj_3');
    assert(heap.getObject('obj_3').fields.name.value === 'Bob', 'Field mutated to Bob');
    assert(stringifyValue(ref, heap) === 'Person(name="Bob")', 'Stringifies updated instance: Person(name="Bob")');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 11: Function Scope & Call Stack Popping
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Scope & Call Stack Lifecycle...');
{
    const state = new RuntimeState();

    // Global x = 10
    state.setVariable('x', createPrimitiveValue('int', 10));
    assert(state.globals.getBinding('x').value === 10, 'Global x = 10 stored');

    // Call foo() -> pushes CallFrame
    const frame = state.pushCallFrame({
        frameId: 'frame_1',
        functionName: 'foo',
        source: { file: 'main.py', line: 4 },
        locals: { y: createPrimitiveValue('int', 20) },
        depth: 2,
    });

    assert(state.callStack.length === 1, 'Call stack depth is 1');
    assert(state.activeFrame.functionName === 'foo', 'Active frame is foo()');
    assert(state.activeLocals.y.value === 20, 'Local variable y = 20 in active frame');

    // foo() returns -> pop frame
    const popped = state.popCallFrame();
    assert(popped.functionName === 'foo', 'Popped frame is foo()');
    assert(state.callStack.length === 0, 'Call stack is empty after return');
    assert(state.getVariable('y') === null, 'Local y is no longer in scope');

    // Global z = 20 (return value)
    state.setVariable('z', createPrimitiveValue('int', 20));
    assert(state.getVariable('z').value === 20, 'Global z assigned return value 20');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 12: Recursion & Distinct Call Frames
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Recursion Call Frames...');
{
    const state = new RuntimeState();

    state.pushCallFrame({ frameId: 'frame_1', functionName: 'factorial', source: { file: 'main.py', line: 1 }, locals: { n: createPrimitiveValue('int', 3) }, depth: 1 });
    state.pushCallFrame({ frameId: 'frame_2', functionName: 'factorial', source: { file: 'main.py', line: 1 }, locals: { n: createPrimitiveValue('int', 2) }, depth: 2 });
    state.pushCallFrame({ frameId: 'frame_3', functionName: 'factorial', source: { file: 'main.py', line: 1 }, locals: { n: createPrimitiveValue('int', 1) }, depth: 3 });

    assert(state.callStack.length === 3, '3 distinct recursive frames created');
    assert(state.callStack[0].scope.getBinding('n').value === 3, 'Frame 1 has n = 3');
    assert(state.callStack[1].scope.getBinding('n').value === 2, 'Frame 2 has n = 2');
    assert(state.callStack[2].scope.getBinding('n').value === 1, 'Frame 3 has n = 1');
    assert(state.activeFrame.frameId === 'frame_3', 'Active top frame is frame_3');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 13: Returned Object Identity Preservation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing Returned Object Identity...');
{
    const heap = new Heap();
    const createdList = new HeapObject({ id: 'obj_1', type: 'list', elements: [] });
    heap.setObject(createdList);

    const returnRef = createReferenceValue('list', 'obj_1');
    const xRef = returnRef;
    const yRef = xRef;

    assert(xRef.objectId === 'obj_1', 'x has objectId obj_1');
    assert(yRef.objectId === 'obj_1', 'y has objectId obj_1');
    assert(xRef.objectId === yRef.objectId, 'x and y share identical object identity obj_1');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 14: Structured Exception Handling
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing Structured Exception Handling...');
{
    const excEvent = createTraceEvent({
        id: 0,
        type: EVENT_TYPES.EXCEPTION,
        source: { file: 'main.py', line: 1 },
        scope: { function: '<module>', depth: 1 },
        data: {
            exception_type: 'ZeroDivisionError',
            exception_message: 'division by zero',
        },
    });

    const excTrace = createExecutionTrace({
        events: [excEvent],
        result: {
            success: false,
            output: '',
            error: { type: 'ZeroDivisionError', message: 'division by zero', line: 1 },
        },
    });

    const frames = LegacyFrameAdapter.toVisualizationFrames(excTrace);
    assert(frames.length === 1, 'Exception produces 1 frame');
    assert(frames[0].event_type === 'exception', 'Frame event_type is "exception"');
    assert(frames[0].exception.type === 'ZeroDivisionError', 'Frame contains structured ZeroDivisionError');
    assert(frames[0].exception.message === 'division by zero', 'Frame contains exception message');
}

console.log(`\n========================================`);
console.log(`Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
console.log(`========================================\n`);

if (failedTests > 0) {
    process.exit(1);
}
