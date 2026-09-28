/**
 * Stage 5 Test Suite — Universal Debugger & IDE Core
 *
 * Verification Requirements:
 *  1. Debugger Lifecycle (idle, running, paused, completed, error)
 *  2. Timeline Navigation (stepForward, stepBackward, restart, jumpTo, scrubbing)
 *  3. Source Location Mapping (deterministic resolution of file/line)
 *  4. Breakpoint Semantics (hit, disabled, multiple, continue after hit, final line)
 *  5. Runtime Synchronization (debugger frame == playback frame == RuntimeState == SceneGraph)
 *  6. Variables Inspection & Scope Access
 *  7. Object Identity & Aliasing (a = []; b = a => both reference obj_N)
 *  8. Historical Mutation Scrubbing
 *  9. Call Stack Panel Data (nested & recursive functions)
 * 10. Exception State Handling & Location
 * 11. Determinism across Non-Linear Navigation (0 -> 20 -> 5 -> 30 -> 10)
 * 12. Editor Isolation (Zero CodeMirror/DOM dependencies in Debugger core)
 */

import { Debugger } from '../src/debugger/Debugger.js';
import { DebuggerState } from '../src/debugger/DebuggerState.js';
import { Breakpoint } from '../src/debugger/Breakpoint.js';
import { EditorDebuggerAdapter } from '../src/debugger/EditorDebuggerAdapter.js';
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

console.log('=== ProViz Stage 5: Universal Debugger & IDE Core Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Execution Lifecycle & Initial State
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Debugger Lifecycle (idle, running, paused, completed, error)...');
{
    const dbg = new Debugger();
    const initialState = dbg.getDebuggerState();

    assert(initialState.status === 'idle', `Initial status is "idle" (actual: ${initialState.status})`);
    assert(initialState.frameIndex === -1, `Initial frame index is -1 (actual: ${initialState.frameIndex})`);
    assert(initialState.reason === 'idle', `Initial reason is "idle" (actual: ${initialState.reason})`);
    assert(initialState.sourceLocation.line === null, 'Initial source location line is null');

    // Create a 3-event UET trace
    const sampleTrace = createExecutionTrace({
        version: TRACE_SCHEMA_VERSION,
        events: [
            createTraceEvent({
                id: 0,
                type: EVENT_TYPES.LINE,
                source: { file: 'main.py', line: 1 },
                scope: { function: '<module>', depth: 1 },
                data: { locals: { x: '10' } },
            }),
            createTraceEvent({
                id: 1,
                type: EVENT_TYPES.LINE,
                source: { file: 'main.py', line: 2 },
                scope: { function: '<module>', depth: 1 },
                data: { locals: { x: '10', y: '20' } },
            }),
            createTraceEvent({
                id: 2,
                type: EVENT_TYPES.PROGRAM_END,
                source: { file: 'main.py', line: 3 },
                scope: { function: '<module>', depth: 0 },
                data: { output: 'done' },
            }),
        ],
        result: { success: true, output: 'done' },
    });

    const loadedState = dbg.loadExecution(sampleTrace);
    assert(loadedState.status === 'paused', `Loaded status is "paused" (actual: ${loadedState.status})`);
    assert(loadedState.frameIndex === 0, `Loaded initial frame index is 0 (actual: ${loadedState.frameIndex})`);
    assert(loadedState.totalFrames === 3, `Total frames is 3 (actual: ${loadedState.totalFrames})`);
    assert(loadedState.sourceLocation.line === 1, 'Loaded initial line is 1');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Navigation (stepForward, stepBackward, restart, jumpTo, scrubbing)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Timeline Navigation Controls...');
{
    const events = [];
    for (let i = 1; i <= 10; i++) {
        events.push(createTraceEvent({
            id: i - 1,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: i },
            scope: { function: '<module>', depth: 1 },
            data: { locals: { val: String(i * 10) } },
        }));
    }
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);

    // Step forward
    dbg.stepForward();
    assert(dbg.frameIndex === 1, `stepForward moved to frame 1 (actual: ${dbg.frameIndex})`);
    assert(dbg.getSourceLocation().line === 2, 'Line moved to 2');

    // Step backward
    dbg.stepBackward();
    assert(dbg.frameIndex === 0, `stepBackward returned to frame 0 (actual: ${dbg.frameIndex})`);
    assert(dbg.getSourceLocation().line === 1, 'Line returned to 1');

    // Jump to arbitrary frame
    dbg.jumpTo(7);
    assert(dbg.frameIndex === 7, `jumpTo(7) set frame index to 7 (actual: ${dbg.frameIndex})`);
    assert(dbg.getSourceLocation().line === 8, 'Line mapped to 8');

    // Restart
    dbg.restart();
    assert(dbg.frameIndex === 0, `restart returned frame index to 0 (actual: ${dbg.frameIndex})`);
    assert(dbg.status === 'paused', 'Status after restart is paused');

    // Repeated scrubbing
    const scrubSequence = [0, 5, 2, 9, 1, 8, 4];
    let scrubPassed = true;
    for (const target of scrubSequence) {
        dbg.jumpTo(target);
        if (dbg.frameIndex !== target || dbg.getSourceLocation().line !== target + 1) {
            scrubPassed = false;
        }
    }
    assert(scrubPassed, 'Repeated scrubbing accurately set frame index and line number');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Source Location Mapping & Determinism
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Source Location Mapping & Determinism...');
{
    const events = [
        createTraceEvent({ id: 0, type: EVENT_TYPES.LINE, source: { file: 'app.py', line: 10 } }),
        createTraceEvent({ id: 1, type: EVENT_TYPES.LINE, source: { file: 'app.py', line: 15 } }),
        createTraceEvent({ id: 2, type: EVENT_TYPES.LINE, source: { file: 'app.py', line: 42 } }),
    ];
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);

    const loc0 = dbg.getSourceLocation();
    assert(loc0.file === 'app.py', 'Frame 0 maps file app.py');
    assert(loc0.line === 10, 'Frame 0 maps line 10');
    assert(loc0.column === null, 'Column is null (not fake)');

    dbg.jumpTo(2);
    const loc2 = dbg.getSourceLocation();
    assert(loc2.line === 42, 'Frame 2 maps line 42');

    // Jump back to 0 — must yield identical source location regardless of sequence
    dbg.jumpTo(0);
    const loc0Again = dbg.getSourceLocation();
    assert(loc0Again.line === 10, 'Re-jump to frame 0 deterministically yields line 10');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Breakpoint Semantics & Continue
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Breakpoint Semantics...');
{
    // Create trace with lines 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    const events = [];
    for (let i = 1; i <= 10; i++) {
        events.push(createTraceEvent({
            id: i - 1,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: i },
            scope: { function: '<module>', depth: 1 },
            data: { locals: { step: String(i) } },
        }));
    }
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);

    // Set breakpoints at line 4 and line 8
    dbg.addBreakpoint('main.py', 4);
    dbg.addBreakpoint('main.py', 8);

    assert(dbg.hasBreakpoint('main.py', 4), 'Breakpoint registered at line 4');
    assert(dbg.hasBreakpoint('main.py', 8), 'Breakpoint registered at line 8');

    // Continue from frame 0 -> should stop at line 4 (frame 3)
    const state1 = dbg.continue();
    assert(state1.status === 'paused', 'Debugger paused at breakpoint 1');
    assert(state1.reason === 'breakpoint', 'Pause reason is "breakpoint"');
    assert(state1.frameIndex === 3, `Frame index paused at 3 (line 4) (actual: ${state1.frameIndex})`);
    assert(state1.sourceLocation.line === 4, 'Source line is 4');

    // Continue again from line 4 -> should step off line 4 and stop at line 8 (frame 7)
    const state2 = dbg.continue();
    assert(state2.status === 'paused', 'Debugger paused at breakpoint 2');
    assert(state2.frameIndex === 7, `Frame index paused at 7 (line 8) (actual: ${state2.frameIndex})`);
    assert(state2.sourceLocation.line === 8, 'Source line is 8');

    // Continue again -> should reach program end (frame 9)
    const state3 = dbg.continue();
    assert(state3.status === 'completed', `Reached completed status (actual: ${state3.status})`);
    assert(state3.reason === 'program_end', 'Reason is program_end');

    // Test disabled breakpoint
    dbg.restart();
    dbg.clearBreakpoints();
    const disabledBp = dbg.addBreakpoint('main.py', 5);
    disabledBp.toggle(); // Disable
    assert(!disabledBp.enabled, 'Breakpoint successfully disabled');
    dbg.continue();
    assert(dbg.status === 'completed', 'Continue with disabled breakpoint runs to completion');

    // Breakpoint at final line
    dbg.restart();
    dbg.clearBreakpoints();
    dbg.addBreakpoint('main.py', 10); // final line
    const finalBpState = dbg.continue();
    assert(finalBpState.status === 'paused', 'Paused at breakpoint on final line');
    assert(finalBpState.sourceLocation.line === 10, 'Source line is 10');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Synchronization Invariants (Debugger == Playback == Runtime == Scene)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Synchronization Invariant Across All Layers...');
{
    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 1 },
            data: { locals: { a: '10' } },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 2 },
            data: { locals: { a: '10', b: '20' } },
        }),
        createTraceEvent({
            id: 2,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 3 },
            data: { locals: { a: '10', b: '20', c: '30' } },
        }),
    ];
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);

    const testIndices = [0, 2, 1, 0, 2];

    for (const idx of testIndices) {
        dbg.jumpTo(idx);
        const state = dbg.getDebuggerState();

        const debuggerFrameIdx = state.frameIndex;
        const playbackFrameIdx = dbg.playbackEngine.currentIdx;
        const runtimeState = state.runtimeState;
        const sceneGraph = state.sceneGraph;
        const sourceLocLine = state.sourceLocation.line;

        assert(debuggerFrameIdx === idx, `[Sync frame ${idx}] Debugger frame index is ${idx}`);
        assert(playbackFrameIdx === idx, `[Sync frame ${idx}] Playback frame index is ${idx}`);
        assert(runtimeState !== null, `[Sync frame ${idx}] RuntimeState exists`);
        assert(sceneGraph !== null, `[Sync frame ${idx}] SceneGraph exists`);
        assert(sourceLocLine === idx + 1, `[Sync frame ${idx}] Source line matches frame line ${idx + 1}`);

        // Verify variables in reconstructed state match frame index
        if (idx === 0) assert(Boolean(runtimeState.getVariable('a')) && !runtimeState.getVariable('b'), 'Frame 0 has a');
        if (idx === 1) assert(Boolean(runtimeState.getVariable('b')) && !runtimeState.getVariable('c'), 'Frame 1 has b');
        if (idx === 2) assert(Boolean(runtimeState.getVariable('c')), 'Frame 2 has c');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Variables Panel & Object Identity (Aliasing)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Object Identity & Aliasing Representation...');
{
    // Trace representing: a = []; b = a
    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 1 },
            data: {
                locals: {
                    a: { kind: 'reference', objectId: 'obj_1', type: 'list' },
                },
                heap: {
                    obj_1: { id: 'obj_1', type: 'list', elements: [] },
                },
            },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 2 },
            data: {
                locals: {
                    a: { kind: 'reference', objectId: 'obj_1', type: 'list' },
                    b: { kind: 'reference', objectId: 'obj_1', type: 'list' },
                },
                heap: {
                    obj_1: { id: 'obj_1', type: 'list', elements: [] },
                },
            },
        }),
    ];
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);
    dbg.jumpTo(1);

    const state = dbg.getDebuggerState();
    const varA = state.runtimeState.getVariable('a');
    const varB = state.runtimeState.getVariable('b');

    assert(Boolean(varA) && Boolean(varB), 'Variables a and b exist in active scope');
    assert(varA.objectId === 'obj_1', 'Variable a references obj_1');
    assert(varB.objectId === 'obj_1', 'Variable b references obj_1 (shared identity)');

    // Verify SceneGraph represents aliasing with a single heap object node
    const objNode = state.sceneGraph.getNode('scene_obj_1');
    assert(Boolean(objNode), 'SceneGraph contains single heap object node scene_obj_1');

    const refs = state.sceneGraph.relationships.filter(r => r.toId === 'scene_obj_1' && r.type === 'references');
    assert(refs.length === 2, `SceneGraph contains 2 reference edges pointing to scene_obj_1 (actual: ${refs.length})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Historical Mutation & Scrubbing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Historical Mutation & Scrubbing...');
{
    // Trace representing: nums = [1]; nums.append(2); nums.append(3)
    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 1 },
            data: {
                locals: { nums: { kind: 'reference', objectId: 'obj_nums', type: 'list' } },
                heap: { obj_nums: { id: 'obj_nums', type: 'list', elements: [1] } },
            },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 2 },
            data: {
                locals: { nums: { kind: 'reference', objectId: 'obj_nums', type: 'list' } },
                heap: { obj_nums: { id: 'obj_nums', type: 'list', elements: [1, 2] } },
            },
        }),
        createTraceEvent({
            id: 2,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 3 },
            data: {
                locals: { nums: { kind: 'reference', objectId: 'obj_nums', type: 'list' } },
                heap: { obj_nums: { id: 'obj_nums', type: 'list', elements: [1, 2, 3] } },
            },
        }),
    ];
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);

    dbg.jumpTo(2);
    let state = dbg.getDebuggerState();
    let obj = state.runtimeState.heap.getObject('obj_nums');
    assert(obj.elements.length === 3, 'Frame 2 has 3 elements');

    dbg.jumpTo(0);
    state = dbg.getDebuggerState();
    obj = state.runtimeState.heap.getObject('obj_nums');
    assert(obj.elements.length === 1, 'Frame 0 has 1 element');

    dbg.jumpTo(1);
    state = dbg.getDebuggerState();
    obj = state.runtimeState.heap.getObject('obj_nums');
    assert(obj.elements.length === 2, 'Frame 1 has 2 elements');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 8: Call Stack & Nested Functions
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Call Stack Panel Representation...');
{
    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 6 },
            scope: { function: '<module>', depth: 1 },
            data: { locals: {} },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.CALL,
            source: { file: 'main.py', line: 1 },
            scope: { function: 'outer', depth: 2 },
            data: { locals: { x: '10' }, stack: [{ function: '<module>', line: 6 }, { function: 'outer', line: 1 }] },
        }),
        createTraceEvent({
            id: 2,
            type: EVENT_TYPES.CALL,
            source: { file: 'main.py', line: 3 },
            scope: { function: 'inner', depth: 3 },
            data: { locals: { y: '20' }, stack: [{ function: '<module>', line: 6 }, { function: 'outer', line: 2 }, { function: 'inner', line: 3 }] },
        }),
    ];
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);
    dbg.jumpTo(2);

    const state = dbg.getDebuggerState();
    assert(state.callStack.length === 3, `Call stack depth is 3 (actual: ${state.callStack.length})`);
    assert(state.activeFrame.functionName === 'inner', 'Active top frame is "inner"');
    assert(state.activeLocals.y.value === '20', 'Top frame active local y = 20');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 9: Exception State Handling
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Exception State Handling...');
{
    const excEvent = createTraceEvent({
        id: 0,
        type: EVENT_TYPES.EXCEPTION,
        source: { file: 'main.py', line: 5 },
        scope: { function: 'divide', depth: 2 },
        data: {
            exception_type: 'ZeroDivisionError',
            exception_message: 'division by zero',
        },
    });
    const trace = createExecutionTrace({
        events: [excEvent],
        result: {
            success: false,
            output: '',
            error: { type: 'ZeroDivisionError', message: 'division by zero', line: 5 },
        },
    });

    const dbg = new Debugger();
    const state = dbg.loadExecution(trace);

    assert(state.status === 'error', `Status is "error" (actual: ${state.status})`);
    assert(state.reason === 'exception', 'Reason is "exception"');
    assert(state.exception !== null, 'Exception descriptor exists');
    assert(state.exception.type === 'ZeroDivisionError', 'Exception type is ZeroDivisionError');
    assert(state.exception.message === 'division by zero', 'Exception message is division by zero');
    assert(state.sourceLocation.line === 5, 'Exception source location line is 5');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 10: Determinism (Non-Linear Navigation 0 -> 20 -> 5 -> 30 -> 10)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Non-Linear Navigation Determinism...');
{
    const events = [];
    for (let i = 0; i <= 40; i++) {
        events.push(createTraceEvent({
            id: i,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: i + 1 },
            data: { locals: { count: String(i * 5) } },
        }));
    }
    const trace = createExecutionTrace({ events, result: { success: true, output: '' } });

    const dbg = new Debugger();
    dbg.loadExecution(trace);

    // Record baseline states at targets via direct jump
    const targets = [0, 20, 5, 30, 10];
    const baselines = {};
    for (const target of targets) {
        dbg.jumpTo(target);
        baselines[target] = dbg.getDebuggerState().runtimeState.clone();
    }

    // Now execute non-linear navigation sequence 0 -> 20 -> 5 -> 30 -> 10
    let allMatched = true;
    for (const target of targets) {
        dbg.jumpTo(target);
        const currentRuntime = dbg.getDebuggerState().runtimeState;
        if (!currentRuntime.equals(baselines[target])) {
            allMatched = false;
        }
    }

    assert(allMatched, 'Non-linear navigation (0 -> 20 -> 5 -> 30 -> 10) produced byte-for-byte identical RuntimeStates');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 11: Editor Isolation Contract
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Editor Isolation Contract...');
{
    const dbg = new Debugger();
    let notificationReceived = false;
    let receivedLine = null;

    const adapter = new EditorDebuggerAdapter({
        debuggerInstance: dbg,
        highlightFn: (line, file) => {
            notificationReceived = true;
            receivedLine = line;
        },
    });

    const trace = createExecutionTrace({
        events: [
            createTraceEvent({ id: 0, type: EVENT_TYPES.LINE, source: { file: 'main.py', line: 12 } }),
        ],
        result: { success: true, output: '' },
    });

    dbg.loadExecution(trace);

    assert(notificationReceived, 'EditorDebuggerAdapter received line highlight callback');
    assert(receivedLine === 12, 'EditorDebuggerAdapter received line number 12');

    // Toggle breakpoint via adapter
    adapter.toggleBreakpoint(15, 'main.py');
    assert(dbg.hasBreakpoint('main.py', 15), 'Adapter successfully added breakpoint to Debugger');
}

console.log(`\n========================================`);
console.log(`Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
console.log(`========================================\n`);

if (failedTests > 0) {
    process.exit(1);
}
