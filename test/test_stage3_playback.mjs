/**
 * Stage 3 Test Suite — Deterministic Timeline, Checkpoints & Bidirectional Playback
 *
 * Tests:
 *  1. Deterministic Reconstruction (reconstruct(N) always produces identical state)
 *  2. Checkpoint Creation & Recovery (checkpoints created at interval and used for fast replay)
 *  3. Checkpoint Isolation (mutating reconstructed state does not corrupt checkpoints)
 *  4. Bidirectional Stepping (nextFrame, prevFrame, restart, jumpTo)
 *  5. Arbitrary & Repeated Scrubbing (random jump sequences without state drift)
 *  6. Object Identity Across Reconstruction (a = []; b = a; a.append(1))
 *  7. Cyclic References Across Reconstruction (a = []; a.append(a))
 *  8. Nested Structures & Shared Objects Across Reconstruction
 *  9. Mutation History Across Non-Linear Navigation
 * 10. Scope Lifecycle & Call Frame Popping Across Time
 * 11. Recursion Stack Reconstruction (factorial)
 * 12. Exception Frame Reconstruction
 * 13. Synthetic Loop Performance & Checkpoint Scaling (200 iterations)
 */

import { StateReconstructor } from '../src/playback/StateReconstructor.js';
import { Timeline } from '../src/playback/Timeline.js';
import { PlaybackEngine } from '../src/PlaybackEngine.js';
import { createExecutionTrace, createTraceEvent, EVENT_TYPES } from '../src/trace/TraceSchema.js';
import { createPrimitiveValue, createReferenceValue, stringifyValue } from '../src/runtime/Value.js';

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

console.log('=== ProViz Stage 3: Deterministic Timeline & State Reconstruction Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Deterministic Reconstruction
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Deterministic State Reconstruction...');
{
    const events = [
        createTraceEvent({ id: 0, type: EVENT_TYPES.LINE, source: { line: 1 }, data: { locals: { x: createPrimitiveValue('int', 10) } } }),
        createTraceEvent({ id: 1, type: EVENT_TYPES.LINE, source: { line: 2 }, data: { locals: { x: createPrimitiveValue('int', 10), y: createPrimitiveValue('int', 20) } } }),
        createTraceEvent({ id: 2, type: EVENT_TYPES.LINE, source: { line: 3 }, data: { locals: { x: createPrimitiveValue('int', 10), y: createPrimitiveValue('int', 20), z: createPrimitiveValue('int', 30) } } }),
    ];

    const trace = createExecutionTrace({ events });
    const reconstructor = new StateReconstructor({ uetTrace: trace, checkpointInterval: 2 });

    const stateA = reconstructor.reconstruct(2);
    const stateB = reconstructor.reconstruct(2);

    assert(stateA.equals(stateB), 'Two calls to reconstruct(2) produce equivalent RuntimeState');
    assert(stateA.activeLocals.z.value === 30, 'Reconstructed frame 2 contains z = 30');
    assert(stateA.activeLocals.x.value === 10, 'Reconstructed frame 2 contains x = 10');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Checkpoint Creation & Interval Recovery
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Checkpoint Creation & Nearest Checkpoint Recovery...');
{
    const events = [];
    for (let i = 0; i < 25; i++) {
        events.push(createTraceEvent({
            id: i,
            type: EVENT_TYPES.LINE,
            source: { line: i + 1 },
            data: { locals: { count: createPrimitiveValue('int', i) } },
        }));
    }

    const trace = createExecutionTrace({ events });
    const reconstructor = new StateReconstructor({ uetTrace: trace, checkpointInterval: 10 });

    assert(reconstructor.checkpoints.length >= 3, `Created checkpoints at intervals (actual: ${reconstructor.checkpoints.length})`);
    assert(reconstructor.checkpoints[0].index === -1, 'Checkpoint 0 is initial baseline (-1)');
    assert(reconstructor.checkpoints.some(c => c.index === 9), 'Contains checkpoint at index 9 (10th frame)');
    assert(reconstructor.checkpoints.some(c => c.index === 19), 'Contains checkpoint at index 19 (20th frame)');

    const stateAt15 = reconstructor.reconstruct(15);
    assert(stateAt15.activeLocals.count.value === 15, 'Reconstruct at 15 returns count = 15');

    const stateAt23 = reconstructor.reconstruct(23);
    assert(stateAt23.activeLocals.count.value === 23, 'Reconstruct at 23 returns count = 23');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Checkpoint Isolation from External Mutation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Checkpoint Isolation...');
{
    const events = [
        createTraceEvent({ id: 0, type: EVENT_TYPES.LINE, source: { line: 1 }, data: { locals: { x: createPrimitiveValue('int', 100) } } }),
        createTraceEvent({ id: 1, type: EVENT_TYPES.LINE, source: { line: 2 }, data: { locals: { x: createPrimitiveValue('int', 200) } } }),
    ];

    const trace = createExecutionTrace({ events });
    const reconstructor = new StateReconstructor({ uetTrace: trace, checkpointInterval: 1 });

    const state1 = reconstructor.reconstruct(0);
    assert(state1.activeLocals.x.value === 100, 'Original reconstructed state has x = 100');

    // Mutate state1 in-place externally
    state1.activeLocals.x.value = 9999;
    state1.setVariable('injected', createPrimitiveValue('str', 'corrupted'));

    // Reconstruct frame 0 again
    const state2 = reconstructor.reconstruct(0);
    assert(state2.activeLocals.x.value === 100, 'Subsequent reconstruction retains pristine x = 100');
    assert(state2.getVariable('injected') === null, 'Injected variable does not exist in checkpoint');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Bidirectional Playback (PlaybackEngine)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Bidirectional Stepping in PlaybackEngine...');
{
    const events = [
        createTraceEvent({ id: 0, type: EVENT_TYPES.LINE, source: { line: 1 }, data: { locals: { step: createPrimitiveValue('int', 1) } } }),
        createTraceEvent({ id: 1, type: EVENT_TYPES.LINE, source: { line: 2 }, data: { locals: { step: createPrimitiveValue('int', 2) } } }),
        createTraceEvent({ id: 2, type: EVENT_TYPES.LINE, source: { line: 3 }, data: { locals: { step: createPrimitiveValue('int', 3) } } }),
    ];

    const trace = createExecutionTrace({ events });
    const engine = new PlaybackEngine();
    engine.setFrames(trace);

    assert(engine.totalFrames === 3, 'Engine reports 3 total frames');

    // Step forward 0 -> 1 -> 2
    const f0 = engine.nextFrame();
    assert(engine.currentIdx === 0 && f0.variables.step.value === '1', 'Step forward to frame 0');

    const f1 = engine.nextFrame();
    assert(engine.currentIdx === 1 && f1.variables.step.value === '2', 'Step forward to frame 1');

    const f2 = engine.nextFrame();
    assert(engine.currentIdx === 2 && f2.variables.step.value === '3', 'Step forward to frame 2');

    // Step backward 2 -> 1 -> 0
    const b1 = engine.prevFrame();
    assert(engine.currentIdx === 1 && b1.variables.step.value === '2', 'Step backward to frame 1');

    const b0 = engine.prevFrame();
    assert(engine.currentIdx === 0 && b0.variables.step.value === '1', 'Step backward to frame 0');

    // Restart
    engine.restart();
    assert(engine.currentIdx === -1, 'Restart sets index to -1');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Arbitrary & Repeated Scrubbing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Arbitrary & Repeated Scrubbing...');
{
    const events = [];
    for (let i = 0; i < 50; i++) {
        events.push(createTraceEvent({
            id: i,
            type: EVENT_TYPES.LINE,
            source: { line: i + 1 },
            data: { locals: { val: createPrimitiveValue('int', i * 10) } },
        }));
    }

    const trace = createExecutionTrace({ events });
    const engine = new PlaybackEngine();
    engine.setFrames(trace);

    const jumpSequence = [0, 25, 10, 40, 5, 25, 40, 0, 49];

    for (const target of jumpSequence) {
        const frame = engine.jumpTo(target);
        assert(engine.currentIdx === target, `Jumped to frame ${target}`);
        assert(frame.variables.val.value === String(target * 10), `Frame ${target} has val = ${target * 10}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Object Identity Across Reconstruction (a = []; b = a; a.append(1))
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Object Identity Across Reconstruction...');
{
    const heapInit = {
        obj_1: { id: 'obj_1', type: 'list', elements: [] },
    };
    const heapMutated = {
        obj_1: { id: 'obj_1', type: 'list', elements: [createPrimitiveValue('int', 1)] },
    };

    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { line: 1 },
            data: { locals: { a: createReferenceValue('list', 'obj_1') }, heap: heapInit },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.LINE,
            source: { line: 2 },
            data: { locals: { a: createReferenceValue('list', 'obj_1'), b: createReferenceValue('list', 'obj_1') }, heap: heapInit },
        }),
        createTraceEvent({
            id: 2,
            type: EVENT_TYPES.LINE,
            source: { line: 3 },
            data: {
                locals: { a: createReferenceValue('list', 'obj_1'), b: createReferenceValue('list', 'obj_1') },
                heap: heapMutated,
                mutations: [{ targetObjectId: 'obj_1', operation: 'append', data: { value: createPrimitiveValue('int', 1) } }],
            },
        }),
    ];

    const trace = createExecutionTrace({ events, final_state: { heap: heapMutated } });
    const reconstructor = new StateReconstructor({ uetTrace: trace, checkpointInterval: 1 });

    // Scrub back and forth
    const stateAt2 = reconstructor.reconstruct(2);
    const refA = stateAt2.activeLocals.a;
    const refB = stateAt2.activeLocals.b;
    assert(refA.objectId === 'obj_1' && refB.objectId === 'obj_1', 'Frame 2: a and b both reference obj_1');
    assert(stateAt2.heap.getObject('obj_1').elements.length === 1, 'Frame 2: obj_1 has 1 element');

    const stateAt0 = reconstructor.reconstruct(0);
    assert(stateAt0.activeLocals.b === undefined, 'Frame 0: b does not exist yet');

    const stateAt2Again = reconstructor.reconstruct(2);
    assert(stateAt2.equals(stateAt2Again), 'Frame 2 reconstructed after scrubbing is identical');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Cyclic References Across Reconstruction
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Cyclic References Across Reconstruction...');
{
    const cyclicHeap = {
        obj_1: { id: 'obj_1', type: 'list', elements: [createReferenceValue('list', 'obj_1')] },
    };

    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { line: 1 },
            data: { locals: { a: createReferenceValue('list', 'obj_1') }, heap: cyclicHeap },
        }),
    ];

    const trace = createExecutionTrace({ events, final_state: { heap: cyclicHeap } });
    const reconstructor = new StateReconstructor({ uetTrace: trace });

    const state = reconstructor.reconstruct(0);
    const obj1 = state.heap.getObject('obj_1');
    assert(obj1 !== null, 'Heap contains cyclic obj_1');
    assert(obj1.elements[0].objectId === 'obj_1', 'obj_1[0] references obj_1 self');

    const str = stringifyValue(createReferenceValue('list', 'obj_1'), state.heap);
    assert(str.includes('Cyclic') || str.includes('obj_1'), 'Stringifies cyclic object cleanly without stack overflow');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 8: Nested Structures Across Reconstruction
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Nested Structures Across Reconstruction...');
{
    const heap = {
        obj_1: { id: 'obj_1', type: 'list', elements: [createPrimitiveValue('int', 1), createPrimitiveValue('int', 2)] },
        obj_2: { id: 'obj_2', type: 'dict', entries: [{ key: createPrimitiveValue('str', 'items'), value: createReferenceValue('list', 'obj_1') }] },
    };

    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { line: 1 },
            data: { locals: { data: createReferenceValue('dict', 'obj_2') }, heap },
        }),
    ];

    const trace = createExecutionTrace({ events, final_state: { heap } });
    const reconstructor = new StateReconstructor({ uetTrace: trace });

    const state = reconstructor.reconstruct(0);
    const dictObj = state.heap.getObject('obj_2');
    assert(dictObj.getOutboundReferences().includes('obj_1'), 'Dict obj_2 contains outbound reference to obj_1');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 9: Mutation History Across Non-Linear Navigation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Mutation History in Non-Linear Navigation...');
{
    const makeHeap = len => ({
        obj_1: { id: 'obj_1', type: 'list', elements: Array.from({ length: len }, (_, i) => createPrimitiveValue('int', i + 1)) },
    });

    const events = [
        createTraceEvent({ id: 0, type: EVENT_TYPES.LINE, source: { line: 1 }, data: { locals: { a: createReferenceValue('list', 'obj_1') }, heap: makeHeap(0) } }),
        createTraceEvent({ id: 1, type: EVENT_TYPES.LINE, source: { line: 2 }, data: { locals: { a: createReferenceValue('list', 'obj_1') }, heap: makeHeap(1) } }),
        createTraceEvent({ id: 2, type: EVENT_TYPES.LINE, source: { line: 3 }, data: { locals: { a: createReferenceValue('list', 'obj_1') }, heap: makeHeap(2) } }),
        createTraceEvent({ id: 3, type: EVENT_TYPES.LINE, source: { line: 4 }, data: { locals: { a: createReferenceValue('list', 'obj_1') }, heap: makeHeap(3) } }),
    ];

    const trace = createExecutionTrace({ events, final_state: { heap: makeHeap(3) } });
    const reconstructor = new StateReconstructor({ uetTrace: trace, checkpointInterval: 1 });

    // Non-linear order: 3 -> 0 -> 2 -> 1 -> 3
    const s3 = reconstructor.reconstruct(3);
    assert(s3.heap.getObject('obj_1').elements.length === 3, 'Frame 3 has list length 3');

    const s0 = reconstructor.reconstruct(0);
    assert(s0.heap.getObject('obj_1').elements.length === 0, 'Frame 0 has list length 0');

    const s2 = reconstructor.reconstruct(2);
    assert(s2.heap.getObject('obj_1').elements.length === 2, 'Frame 2 has list length 2');

    const s1 = reconstructor.reconstruct(1);
    assert(s1.heap.getObject('obj_1').elements.length === 1, 'Frame 1 has list length 1');

    const s3Again = reconstructor.reconstruct(3);
    assert(s3.equals(s3Again), 'Frame 3 equal on re-reconstruction');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 10: Scope Lifecycle Across Time
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Scope Lifecycle Across Time...');
{
    const events = [
        // Frame 0: global x = 10
        createTraceEvent({ id: 0, type: EVENT_TYPES.LINE, source: { line: 1 }, scope: { function: '<module>', depth: 1 }, data: { locals: { x: createPrimitiveValue('int', 10) } } }),
        // Frame 1: call foo()
        createTraceEvent({ id: 1, type: EVENT_TYPES.CALL, source: { line: 3 }, scope: { function: 'foo', depth: 2 }, data: { locals: { y: createPrimitiveValue('int', 20) } } }),
        // Frame 2: inside foo line 4
        createTraceEvent({ id: 2, type: EVENT_TYPES.LINE, source: { line: 4 }, scope: { function: 'foo', depth: 2 }, data: { locals: { y: createPrimitiveValue('int', 20) } } }),
        // Frame 3: return from foo
        createTraceEvent({ id: 3, type: EVENT_TYPES.RETURN, source: { line: 4 }, scope: { function: 'foo', depth: 2 }, data: { return_value: createPrimitiveValue('int', 20) } }),
        // Frame 4: back in module, z = 20
        createTraceEvent({ id: 4, type: EVENT_TYPES.LINE, source: { line: 5 }, scope: { function: '<module>', depth: 1 }, data: { locals: { x: createPrimitiveValue('int', 10), z: createPrimitiveValue('int', 20) } } }),
    ];

    const trace = createExecutionTrace({ events });
    const reconstructor = new StateReconstructor({ uetTrace: trace, checkpointInterval: 1 });

    // Inside foo (Frame 2)
    const stateInFoo = reconstructor.reconstruct(2);
    assert(stateInFoo.callStack.length === 2, 'Inside foo: call stack depth is 2');
    assert(stateInFoo.activeFrame.functionName === 'foo', 'Inside foo: top frame is foo');
    assert(stateInFoo.activeLocals.y.value === 20, 'Inside foo: local y = 20');

    // After return (Frame 4)
    const stateAfterReturn = reconstructor.reconstruct(4);
    assert(stateAfterReturn.callStack.length === 1, 'After return: call stack depth is 1 (<module>)');
    assert(stateAfterReturn.activeLocals.y === undefined, 'After return: local y is popped');
    assert(stateAfterReturn.activeLocals.z.value === 20, 'After return: z = 20 exists');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 11: Recursion Stack Reconstruction (factorial)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Recursion Stack Reconstruction...');
{
    const events = [
        createTraceEvent({ id: 0, type: EVENT_TYPES.CALL, source: { line: 1 }, scope: { function: 'fact', depth: 1 }, data: { locals: { n: createPrimitiveValue('int', 3) } } }),
        createTraceEvent({ id: 1, type: EVENT_TYPES.CALL, source: { line: 1 }, scope: { function: 'fact', depth: 2 }, data: { locals: { n: createPrimitiveValue('int', 2) } } }),
        createTraceEvent({ id: 2, type: EVENT_TYPES.CALL, source: { line: 1 }, scope: { function: 'fact', depth: 3 }, data: { locals: { n: createPrimitiveValue('int', 1) } } }),
        createTraceEvent({ id: 3, type: EVENT_TYPES.RETURN, source: { line: 2 }, scope: { function: 'fact', depth: 3 }, data: { return_value: createPrimitiveValue('int', 1) } }),
        createTraceEvent({ id: 4, type: EVENT_TYPES.RETURN, source: { line: 3 }, scope: { function: 'fact', depth: 2 }, data: { return_value: createPrimitiveValue('int', 2) } }),
        createTraceEvent({ id: 5, type: EVENT_TYPES.RETURN, source: { line: 3 }, scope: { function: 'fact', depth: 1 }, data: { return_value: createPrimitiveValue('int', 6) } }),
    ];

    const trace = createExecutionTrace({ events });
    const reconstructor = new StateReconstructor({ uetTrace: trace, checkpointInterval: 2 });

    // Deepest point (Frame 2)
    const deepest = reconstructor.reconstruct(2);
    assert(deepest.callStack.length === 3, 'Deepest frame has call stack depth 3');
    assert(deepest.activeLocals.n.value === 1, 'Top frame has n = 1');
    assert(deepest.callStack[0].scope.getBinding('n').value === 3, 'Base frame has n = 3');

    // After 1 return (Frame 3)
    const afterOneReturn = reconstructor.reconstruct(3);
    assert(afterOneReturn.callStack.length === 2, 'After 1 return: call stack depth is 2');

    // Jump back to deepest
    const deepestAgain = reconstructor.reconstruct(2);
    assert(deepest.equals(deepestAgain), 'Reconstructed deepest frame equals previous snapshot');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 12: Exception Frame Reconstruction
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Exception Frame Reconstruction...');
{
    const events = [
        createTraceEvent({ id: 0, type: EVENT_TYPES.LINE, source: { line: 1 }, data: { locals: { a: createPrimitiveValue('int', 5) } } }),
        createTraceEvent({ id: 1, type: EVENT_TYPES.EXCEPTION, source: { line: 2 }, data: { exception_type: 'ZeroDivisionError', exception_message: 'division by zero' } }),
    ];

    const trace = createExecutionTrace({ events });
    const reconstructor = new StateReconstructor({ uetTrace: trace });

    const excState = reconstructor.reconstruct(1);
    assert(excState.currentSource.line === 2, 'Exception source line is 2');
    assert(excState.activeLocals.a.value === 5, 'Local variable a = 5 preserved at exception step');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 13: Synthetic Loop Performance & Scaling
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing Synthetic Loop Performance (200 events)...');
{
    const loopEvents = [];
    let accum = 0;
    for (let i = 0; i < 200; i++) {
        accum += i;
        loopEvents.push(createTraceEvent({
            id: i,
            type: EVENT_TYPES.LINE,
            source: { line: 2 },
            data: { locals: { total: createPrimitiveValue('int', accum), i: createPrimitiveValue('int', i) } },
        }));
    }

    const trace = createExecutionTrace({ events: loopEvents });
    const startMs = performance.now();
    const reconstructor = new StateReconstructor({ uetTrace: trace, checkpointInterval: 25 });
    const buildMs = performance.now() - startMs;

    assert(reconstructor.checkpoints.length >= 8, `Created checkpoints across 200 events (actual: ${reconstructor.checkpoints.length})`);

    const t0 = reconstructor.reconstruct(0);
    const t50 = reconstructor.reconstruct(50);
    const t100 = reconstructor.reconstruct(100);
    const t199 = reconstructor.reconstruct(199);

    assert(t0.activeLocals.i.value === 0, 'Frame 0: i = 0');
    assert(t50.activeLocals.i.value === 50, 'Frame 50: i = 50');
    assert(t100.activeLocals.i.value === 100, 'Frame 100: i = 100');
    assert(t199.activeLocals.i.value === 199, 'Frame 199: i = 199');

    console.log(`    (Checkpoint build time for 200 frames: ${buildMs.toFixed(2)}ms)`);
}

console.log(`\n========================================`);
console.log(`Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
console.log(`========================================\n`);

if (failedTests > 0) {
    process.exit(1);
}
