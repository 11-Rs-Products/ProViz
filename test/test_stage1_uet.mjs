/**
 * Stage 1 Test Suite — Universal Execution Trace (UET) & Freeform Execution Contracts
 *
 * Tests:
 *  1. Freeform Execution (basic arithmetic & assignment)
 *  2. Function Calls & Returns (scope stack & return values)
 *  3. Branching / Conditionals (line tracking across branches)
 *  4. Loops (iterative line execution and variable updates)
 *  5. Exception Handling (runtime error capture without crashing)
 *  6. Existing DSA Problem Execution & Frame Adapter Compatibility
 */

import { TRACE_SCHEMA_VERSION, EVENT_TYPES, createTraceEvent, createExecutionTrace, validateTrace } from '../src/trace/TraceSchema.js';
import { ExecutionRequest, createExecutionRequest } from '../src/trace/ExecutionRequest.js';
import { LegacyFrameAdapter } from '../src/trace/LegacyFrameAdapter.js';
import { TraceTransformer } from '../src/engine/TraceTransformer.js';
import { questions } from '../src/questions/registry.js';

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

console.log('=== ProViz Stage 1: Universal Execution Trace Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: UET Schema & Factory Validation
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing UET Schema & Structure...');
{
    const sampleEvent = createTraceEvent({
        id: 0,
        type: EVENT_TYPES.LINE,
        source: { file: 'main.py', line: 1, column: null },
        scope: { function: '<module>', depth: 1 },
        data: {
            locals: { x: '10' },
            changed_variables: [{ name: 'x', old_value: null, new_value: '10', is_new: true }],
            stack: [{ function: '<module>', line: 1 }],
        },
    });

    const sampleTrace = createExecutionTrace({
        version: TRACE_SCHEMA_VERSION,
        metadata: { language: 'python', runtime: 'pyodide' },
        source: { entrypoint: 'main.py', files: { 'main.py': 'x = 10' } },
        events: [sampleEvent],
        result: { success: true, output: '', error: null },
    });

    const validation = validateTrace(sampleTrace);
    assert(validation.valid, 'Sample trace passes UET schema validation');
    assert(sampleTrace.version === 1, `Trace schema version is 1 (actual: ${sampleTrace.version})`);
    assert(sampleEvent.source.file === 'main.py', 'Event source file correctly populated');
    assert(sampleEvent.source.line === 1, 'Event source line correctly populated');
    assert(sampleEvent.scope.function === '<module>', 'Event scope function correctly populated');
    assert(!('color' in sampleEvent), 'Event contains no visualization-specific properties (color)');
    assert(!('mesh' in sampleEvent), 'Event contains no visualization-specific properties (mesh)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Freeform Execution Request
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing Freeform Execution Request...');
{
    const freeformCode = 'x = 10\ny = 20\nz = x + y';
    const req = createExecutionRequest(freeformCode);

    assert(req.language === 'python', 'Request defaults to Python language');
    assert(req.entrypoint === 'main.py', 'Request defaults to main.py entrypoint');
    assert(req.getMainCode() === freeformCode, 'Request returns main source code');
    assert(req.context === null, 'Freeform request context is null (no question required)');
    assert(!req.hasProblemContext(), 'Freeform request correctly identifies lack of problem context');

    // Simulate UET generation for freeform
    const events = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 1 },
            scope: { function: '<module>', depth: 1 },
            data: { locals: { x: '10' }, changed_variables: [{ name: 'x', old_value: null, new_value: '10', is_new: true }] },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 2 },
            scope: { function: '<module>', depth: 1 },
            data: { locals: { x: '10', y: '20' }, changed_variables: [{ name: 'y', old_value: null, new_value: '20', is_new: true }] },
        }),
        createTraceEvent({
            id: 2,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 3 },
            scope: { function: '<module>', depth: 1 },
            data: { locals: { x: '10', y: '20', z: '30' }, changed_variables: [{ name: 'z', old_value: null, new_value: '30', is_new: true }] },
        }),
        createTraceEvent({
            id: 3,
            type: EVENT_TYPES.PROGRAM_END,
            source: { file: 'main.py', line: null },
            scope: { function: '<module>', depth: 0 },
            data: { output: '' },
        }),
    ];

    const freeformTrace = createExecutionTrace({
        version: TRACE_SCHEMA_VERSION,
        events,
        result: { success: true, output: '' },
    });

    const frames = LegacyFrameAdapter.toVisualizationFrames(freeformTrace);
    assert(frames.length === 4, `Adapted into 4 VisualizationFrames (3 lines + 1 program_end) (actual: ${frames.length})`);
    assert(frames[2].variables.z.value === '30', 'Line 3 frame has z = 30');
    assert(frames[3].event_type === 'output', 'Final frame is program_end output frame');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Function Calls & Returns
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing Function Call & Return Trace Events...');
{
    const funcEvents = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 4 },
            scope: { function: '<module>', depth: 1 },
            data: { locals: {}, changed_variables: [] },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.CALL,
            source: { file: 'main.py', line: 1 },
            scope: { function: 'add', depth: 2 },
            data: { locals: { a: '2', b: '3' }, stack: [{ function: '<module>', line: 4 }, { function: 'add', line: 1 }] },
        }),
        createTraceEvent({
            id: 2,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 2 },
            scope: { function: 'add', depth: 2 },
            data: { locals: { a: '2', b: '3' } },
        }),
        createTraceEvent({
            id: 3,
            type: EVENT_TYPES.RETURN,
            source: { file: 'main.py', line: 2 },
            scope: { function: 'add', depth: 2 },
            data: { return_value: '5' },
        }),
        createTraceEvent({
            id: 4,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 4 },
            scope: { function: '<module>', depth: 1 },
            data: { locals: { x: '5' }, changed_variables: [{ name: 'x', old_value: null, new_value: '5', is_new: true }] },
        }),
    ];

    const funcTrace = createExecutionTrace({
        events: funcEvents,
        result: { success: true, output: '' },
    });

    const frames = LegacyFrameAdapter.toVisualizationFrames(funcTrace);
    assert(frames.some(f => f.event_type === 'call'), 'Emits "call" frame');
    assert(frames.some(f => f.event_type === 'return'), 'Emits "return" frame');
    const returnFrame = frames.find(f => f.event_type === 'return');
    assert(returnFrame.return_value === '5', `Return frame captures return_value = 5 (actual: ${returnFrame.return_value})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Branching / Conditionals
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing Branching / Conditional Execution...');
{
    const branchEvents = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 1 },
            scope: { function: '<module>', depth: 1 },
            data: { locals: { x: '10' }, changed_variables: [{ name: 'x', old_value: null, new_value: '10', is_new: true }] },
        }),
        createTraceEvent({
            id: 1,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 3 }, // 'if x > 5:'
            scope: { function: '<module>', depth: 1 },
            data: { locals: { x: '10' } },
        }),
        createTraceEvent({
            id: 2,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 4 }, // 'y = 20'
            scope: { function: '<module>', depth: 1 },
            data: { locals: { x: '10', y: '20' }, changed_variables: [{ name: 'y', old_value: null, new_value: '20', is_new: true }] },
        }),
    ];

    const branchTrace = createExecutionTrace({
        events: branchEvents,
        result: { success: true, output: '' },
    });

    const frames = LegacyFrameAdapter.toVisualizationFrames(branchTrace);
    assert(frames.length === 3, 'Branch trace produces 3 frames');
    assert(frames[2].current_line === 4, 'Branch targets line 4 directly');
    assert(frames[2].variables.y.value === '20', 'y assigned to 20');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Loops
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Loop Execution...');
{
    const loopEvents = [
        createTraceEvent({
            id: 0,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 1 },
            scope: { function: '<module>', depth: 1 },
            data: { locals: { total: '0' }, changed_variables: [{ name: 'total', old_value: null, new_value: '0', is_new: true }] },
        }),
    ];

    let total = 0;
    for (let i = 0; i < 5; i++) {
        total += i;
        loopEvents.push(createTraceEvent({
            id: loopEvents.length,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 2 }, // for i in range(5)
            scope: { function: '<module>', depth: 1 },
            data: { locals: { total: String(total - i), i: String(i) }, changed_variables: [{ name: 'i', old_value: null, new_value: String(i), is_new: i === 0 }] },
        }));
        loopEvents.push(createTraceEvent({
            id: loopEvents.length,
            type: EVENT_TYPES.LINE,
            source: { file: 'main.py', line: 3 }, // total += i
            scope: { function: '<module>', depth: 1 },
            data: { locals: { total: String(total), i: String(i) }, changed_variables: [{ name: 'total', old_value: String(total - i), new_value: String(total), is_new: false }] },
        }));
    }

    const loopTrace = createExecutionTrace({
        events: loopEvents,
        result: { success: true, output: '' },
    });

    const frames = LegacyFrameAdapter.toVisualizationFrames(loopTrace);
    assert(frames.length === 11, `Loop trace generates 11 frames (actual: ${frames.length})`);
    assert(frames[frames.length - 1].variables.total.value === '10', 'Final loop accumulator is 10');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Exception Handling
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Exception Handling...');
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
    assert(frames[0].event_type === 'exception', 'Frame type is "exception"');
    assert(frames[0].exception.type === 'ZeroDivisionError', 'Frame contains ZeroDivisionError');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: DSA Problem Mode & TraceTransformer Delegation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Problem Mode Compatibility & TraceTransformer...');
{
    const problem = questions[0];
    assert(Boolean(problem), 'Found question in questions registry');

    const reqWithProblem = createExecutionRequest({
        code: problem.starter_code,
        language: 'python',
        context: {
            problemId: problem.id,
            visualization: problem.visualization,
        },
    });

    assert(reqWithProblem.hasProblemContext(), 'Identifies valid problem context');
    assert(reqWithProblem.context.problemId === problem.id, 'Preserves problem ID in context');

    const transformer = new TraceTransformer();
    const testTrace = createExecutionTrace({
        events: [
            createTraceEvent({
                id: 0,
                type: EVENT_TYPES.LINE,
                source: { file: 'main.py', line: 1 },
                scope: { function: '<module>', depth: 1 },
                data: { locals: { nums: '[1, 2, 3]' } },
            }),
        ],
        result: { success: true, output: '56' },
    });

    const frames = transformer.transform(testTrace, problem.visualization);
    assert(Array.isArray(frames), 'TraceTransformer returns VisualizationFrame array');
    assert(frames.length >= 1, 'Transformed frames contain execution data');
}

console.log(`\n========================================`);
console.log(`Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
console.log(`========================================\n`);

if (failedTests > 0) {
    process.exit(1);
}
