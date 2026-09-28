/**
 * ProViz — Stage 11 Test Suite: Universal Watch Expressions & Interactive Runtime Inspection
 *
 * Validates:
 *  1. Expression canonical model (deterministic ID, normalization, serialization, equality)
 *  2. ExpressionParser & AST generation (identifiers, member access, index access, literals, operators, identity, syntax errors)
 *  3. EvaluationContext (scope resolution hierarchy: locals -> enclosing -> globals, limits)
 *  4. ExpressionEvaluator on runtime types (primitives, lists, dicts, instances, strings)
 *  5. Reference identity & aliasing (a is b returns true for shared Heap objectId)
 *  6. Cyclic structures & bounded traversal (no infinite loops)
 *  7. Structured EvaluationErrors (UNKNOWN_IDENTIFIER, ATTRIBUTE_NOT_FOUND, INDEX_OUT_OF_RANGE, INVALID_INDEX, UNSUPPORTED_OPERATION, SYNTAX_ERROR)
 *  8. Read-only invariant (evaluations never mutate RuntimeState, Heap, Scope, or Timeline)
 *  9. Safe Intrinsics (len, type) & rejection of arbitrary code/function calls (items.append(1), eval())
 * 10. Limits (depth limit, timeout limit)
 * 11. Historical evaluation across timeline frames (evaluateAt) without re-running code
 * 12. Multi-file scope awareness (resolving active module variables vs foreign module variables)
 * 13. WatchExpression & WatchManager (CRUD, evaluateAll, evaluateHistory, serialization)
 * 14. InspectionSnapshot & Frame Diffing (tracking changed values between frames)
 * 15. ObjectInspector integration (watch objectId -> ObjectInspector.getObjectDetails)
 * 16. Debugger & ModuleDebugger integration (evaluate, evaluateAt, addWatch, evaluateWatches)
 * 17. Large-scale performance benchmarks (1,000 expressions, 10,000 expressions, 1,000 heap objects)
 */

import { Expression } from '../src/inspection/Expression.js';
import { ExpressionParser, AST_NODE_TYPES } from '../src/inspection/ExpressionParser.js';
import { EvaluationError, ERROR_CODES } from '../src/inspection/EvaluationError.js';
import { EvaluationResult, RESULT_STATUS } from '../src/inspection/EvaluationResult.js';
import { EvaluationContext } from '../src/inspection/EvaluationContext.js';
import { ExpressionEvaluator } from '../src/inspection/ExpressionEvaluator.js';
import { WatchExpression } from '../src/inspection/WatchExpression.js';
import { WatchManager } from '../src/inspection/WatchManager.js';
import { InspectionSnapshot } from '../src/inspection/InspectionSnapshot.js';
import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { Heap } from '../src/runtime/Heap.js';
import { Scope } from '../src/runtime/Scope.js';
import { CallFrame } from '../src/runtime/CallFrame.js';
import { createPrimitiveValue, createReferenceValue } from '../src/runtime/Value.js';
import { Debugger } from '../src/debugger/Debugger.js';
import { ModuleDebugger } from '../src/debugger/ModuleDebugger.js';
import { Workspace } from '../src/workspace/Workspace.js';
import { PlaybackEngine } from '../src/PlaybackEngine.js';
import { ObjectInspector } from '../src/inspector/ObjectInspector.js';
import { createExecutionTrace, createTraceEvent } from '../src/trace/TraceSchema.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    }
}

console.log('=== ProViz Stage 11: Universal Watch Expressions & Inspection Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Expression Canonical Model
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Testing Expression Canonical Model...');
{
    const expr1 = Expression.create('  user.name  ');
    assert(expr1.source === 'user.name', 'Source is trimmed');
    assert(expr1.normalized === 'user.name', 'Normalized is user.name');
    assert(expr1.id.startsWith('expr_user_name_'), 'Deterministic ID starts with slug');

    const expr2 = Expression.create('user.name');
    assert(expr1.id === expr2.id, 'Identical normalized expressions produce identical IDs');
    assert(expr1.equals(expr2), 'Expression equals() returns true for identical queries');

    const exprNorm = Expression.create('items [ 0 ]   +   1');
    assert(exprNorm.normalized === 'items[0] + 1', 'Normalized collapses internal whitespace around brackets/operators');

    const json = expr1.toJSON();
    const fromJson = Expression.fromJSON(json);
    assert(fromJson.equals(expr1), 'Expression JSON round-trip is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ExpressionParser & AST Generation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Testing ExpressionParser & AST Generation...');
{
    const parser = new ExpressionParser();

    // 1. Identifier
    const astId = parser.parse('count');
    assert(astId.type === AST_NODE_TYPES.IDENTIFIER && astId.name === 'count', 'Parsed Identifier node');

    // 2. Member access
    const astMember = parser.parse('user.profile.age');
    assert(astMember.type === AST_NODE_TYPES.MEMBER_ACCESS && astMember.property === 'age', 'Parsed nested MemberAccess');
    assert(astMember.object.type === AST_NODE_TYPES.MEMBER_ACCESS && astMember.object.property === 'profile', 'Parsed inner MemberAccess');

    // 3. Index access
    const astIndex = parser.parse('data["users"][0]');
    assert(astIndex.type === AST_NODE_TYPES.INDEX_ACCESS, 'Parsed IndexAccess');
    assert(astIndex.index.type === AST_NODE_TYPES.LITERAL && astIndex.index.value === 0, 'Parsed numeric index literal');

    // 4. Identity operator: 'a is b' and 'a is not b'
    const astIs = parser.parse('a is b');
    assert(astIs.type === AST_NODE_TYPES.IDENTITY && !astIs.isNot, 'Parsed identity "a is b"');
    const astIsNot = parser.parse('a is not b');
    assert(astIsNot.type === AST_NODE_TYPES.IDENTITY && astIsNot.isNot, 'Parsed identity "a is not b"');

    // 5. Comparisons & Arithmetic
    const astComp = parser.parse('x + 5 >= y * 2');
    assert(astComp.type === AST_NODE_TYPES.COMPARISON && astComp.operator === '>=', 'Parsed Comparison operator');
    assert(astComp.left.type === AST_NODE_TYPES.BINARY_OP && astComp.left.operator === '+', 'Parsed left BinaryOp +');
    assert(astComp.right.type === AST_NODE_TYPES.BINARY_OP && astComp.right.operator === '*', 'Parsed right BinaryOp *');

    // 6. Safe intrinsic calls
    const astCall = parser.parse('len(items)');
    assert(astCall.type === AST_NODE_TYPES.CALL && astCall.callee.name === 'len', 'Parsed Call node for len()');

    // 7. Syntax errors
    let threw = false;
    try {
        parser.parse('user..name');
    } catch (e) {
        threw = true;
        assert(e.code === ERROR_CODES.SYNTAX_ERROR, 'Threw structured SYNTAX_ERROR on invalid syntax');
    }
    assert(threw, 'Invalid expression syntax was rejected');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EvaluationContext & Scope Resolution
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Testing EvaluationContext & Scope Resolution...');
{
    const heap = new Heap({
        obj_1: { id: 'obj_1', type: 'list', elements: [createPrimitiveValue('int', 42)] },
    });

    const globalScope = new Scope('global', {
        g_val: createPrimitiveValue('int', 100),
        shadowed: createPrimitiveValue('str', 'global'),
    });

    const outerFrame = new CallFrame({
        frameId: 'frame_1',
        functionName: 'outer',
        scope: new Scope('local', {
            outer_val: createPrimitiveValue('str', 'outer'),
            shadowed: createPrimitiveValue('str', 'outer'),
        }),
        depth: 1,
    });

    const activeFrame = new CallFrame({
        frameId: 'frame_2',
        functionName: 'inner',
        scope: new Scope('local', {
            local_val: createPrimitiveValue('int', 5),
            shadowed: createPrimitiveValue('str', 'inner'),
            items: createReferenceValue('list', 'obj_1'),
        }),
        depth: 2,
    });

    const runtimeState = new RuntimeState({
        globals: globalScope,
        callStack: [outerFrame, activeFrame],
        heap,
    });

    const ctx = EvaluationContext.fromRuntimeState(runtimeState, { frameIndex: 1 });

    // Local resolution
    assert(ctx.resolveVariable('local_val')?.value === 5, 'Resolves active local variable');

    // Scope shadowing (active frame local shadows outer frame and global)
    assert(ctx.resolveVariable('shadowed')?.value === 'inner', 'Active local shadows outer and global variables');

    // Enclosing frame resolution
    assert(ctx.resolveVariable('outer_val')?.value === 'outer', 'Resolves enclosing call frame variable');

    // Global resolution
    assert(ctx.resolveVariable('g_val')?.value === 100, 'Resolves global variable');

    // Missing variable
    assert(ctx.resolveVariable('non_existent') === null, 'Returns null for undefined variable');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ExpressionEvaluator on Runtime Types
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Testing ExpressionEvaluator on Runtime Types...');
{
    const heap = new Heap({
        obj_user: {
            id: 'obj_user',
            type: 'instance',
            className: 'User',
            fields: {
                name: createPrimitiveValue('str', 'Alice'),
                age: createPrimitiveValue('int', 30),
                active: createPrimitiveValue('bool', true),
            },
        },
        obj_list: {
            id: 'obj_list',
            type: 'list',
            elements: [
                createPrimitiveValue('int', 10),
                createPrimitiveValue('int', 20),
                createPrimitiveValue('int', 30),
            ],
        },
        obj_dict: {
            id: 'obj_dict',
            type: 'dict',
            entries: [
                { key: createPrimitiveValue('str', 'role'), value: createPrimitiveValue('str', 'admin') },
                { key: createPrimitiveValue('str', 'code'), value: createPrimitiveValue('int', 999) },
            ],
        },
    });

    const state = new RuntimeState({
        globals: {
            user: createReferenceValue('User', 'obj_user'),
            numbers: createReferenceValue('list', 'obj_list'),
            data: createReferenceValue('dict', 'obj_dict'),
            base: createPrimitiveValue('int', 5),
            greeting: createPrimitiveValue('str', 'Hello'),
        },
        heap,
    });

    const ctx = EvaluationContext.fromRuntimeState(state);
    const evaluator = new ExpressionEvaluator();

    // 1. Primitive evaluation
    const resBase = evaluator.evaluate('base + 10', ctx);
    assert(resBase.isSuccess && resBase.value.value === 15, 'Evaluated arithmetic on primitive (5 + 10 = 15)');
    assert(resBase.valueType === 'int', 'Value type is int');

    // 2. Class instance member access
    const resName = evaluator.evaluate('user.name', ctx);
    assert(resName.isSuccess && resName.value.value === 'Alice', 'Evaluated object attribute user.name -> "Alice"');
    assert(resName.display === '"Alice"', 'Display format is "Alice"');

    // 3. List indexing & negative indexing
    const resElem0 = evaluator.evaluate('numbers[0]', ctx);
    assert(resElem0.isSuccess && resElem0.value.value === 10, 'Evaluated numbers[0] -> 10');
    const resElemLast = evaluator.evaluate('numbers[-1]', ctx);
    assert(resElemLast.isSuccess && resElemLast.value.value === 30, 'Evaluated numbers[-1] -> 30 (negative index)');

    // 4. Dict key lookup
    const resDict = evaluator.evaluate('data["role"]', ctx);
    assert(resDict.isSuccess && resDict.value.value === 'admin', 'Evaluated data["role"] -> "admin"');

    // 5. String length / concatenation
    const resConcat = evaluator.evaluate('greeting + " World"', ctx);
    assert(resConcat.isSuccess && resConcat.value.value === 'Hello World', 'Evaluated string concatenation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Reference Identity & Aliasing (a is b)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Testing Reference Identity & Aliasing...');
{
    const heap = new Heap({
        obj_1: { id: 'obj_1', type: 'list', elements: [createPrimitiveValue('int', 1)] },
        obj_2: { id: 'obj_2', type: 'list', elements: [createPrimitiveValue('int', 1)] },
    });

    const state = new RuntimeState({
        globals: {
            a: createReferenceValue('list', 'obj_1'),
            b: createReferenceValue('list', 'obj_1'), // Alias pointing to obj_1
            c: createReferenceValue('list', 'obj_2'), // Distinct object with identical contents
            none_val: createPrimitiveValue('NoneType', null),
        },
        heap,
    });

    const ctx = EvaluationContext.fromRuntimeState(state);
    const evaluator = new ExpressionEvaluator();

    // 1. a is b -> true (both point to obj_1)
    const resIs = evaluator.evaluate('a is b', ctx);
    assert(resIs.isSuccess && resIs.value.value === true, 'a is b evaluates to True for aliased objects');

    // 2. a is not b -> false
    const resIsNot = evaluator.evaluate('a is not b', ctx);
    assert(resIsNot.isSuccess && resIsNot.value.value === false, 'a is not b evaluates to False');

    // 3. a is c -> false (different objectId obj_1 vs obj_2)
    const resDiff = evaluator.evaluate('a is c', ctx);
    assert(resDiff.isSuccess && resDiff.value.value === false, 'a is c evaluates to False for distinct heap objects');

    // 4. a == c -> true (structural equality of contents)
    const resEq = evaluator.evaluate('a == c', ctx);
    assert(resEq.isSuccess && resEq.value.value === true, 'a == c evaluates to True for identical list contents');

    // 5. none_val is None -> true
    const resNone = evaluator.evaluate('none_val is None', ctx);
    assert(resNone.isSuccess && resNone.value.value === true, 'none_val is None evaluates to True');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Cyclic Structures & Bounded Traversal
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Testing Cyclic Structures & Bounded Traversal...');
{
    const heap = new Heap({
        obj_cyclic: {
            id: 'obj_cyclic',
            type: 'list',
            elements: [createReferenceValue('list', 'obj_cyclic')], // Self-referencing list
        },
    });

    const state = new RuntimeState({
        globals: {
            cyclic_list: createReferenceValue('list', 'obj_cyclic'),
        },
        heap,
    });

    const ctx = EvaluationContext.fromRuntimeState(state);
    const evaluator = new ExpressionEvaluator();

    // Nested indexing into cyclic structure: cyclic_list[0][0][0]
    const resDeep = evaluator.evaluate('cyclic_list[0][0][0]', ctx);
    assert(resDeep.isSuccess && resDeep.objectId === 'obj_cyclic', 'Cyclic indexing evaluated safely returning obj_cyclic');
    assert(resDeep.display.includes('obj_cyclic'), 'Display string contains cyclic representation');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Structured Evaluation Errors
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Testing Structured Evaluation Errors...');
{
    const heap = new Heap({
        obj_user: { id: 'obj_user', type: 'instance', className: 'User', fields: { name: createPrimitiveValue('str', 'Alice') } },
        obj_list: { id: 'obj_list', type: 'list', elements: [createPrimitiveValue('int', 10)] },
    });

    const state = new RuntimeState({
        globals: {
            user: createReferenceValue('User', 'obj_user'),
            items: createReferenceValue('list', 'obj_list'),
        },
        heap,
    });

    const ctx = EvaluationContext.fromRuntimeState(state);
    const evaluator = new ExpressionEvaluator();

    // 1. UNKNOWN_IDENTIFIER
    const resUnknown = evaluator.evaluate('unknown_var', ctx);
    assert(resUnknown.isError, 'Unknown variable returned error status');
    assert(resUnknown.error.code === ERROR_CODES.UNKNOWN_IDENTIFIER, 'Error code is UNKNOWN_IDENTIFIER');

    // 2. ATTRIBUTE_NOT_FOUND
    const resAttr = evaluator.evaluate('user.email', ctx);
    assert(resAttr.isError && resAttr.error.code === ERROR_CODES.ATTRIBUTE_NOT_FOUND, 'Error code is ATTRIBUTE_NOT_FOUND');

    // 3. INDEX_OUT_OF_RANGE
    const resRange = evaluator.evaluate('items[99]', ctx);
    assert(resRange.isError && resRange.error.code === ERROR_CODES.INDEX_OUT_OF_RANGE, 'Error code is INDEX_OUT_OF_RANGE');

    // 4. INVALID_INDEX (e.g. non-integer index for list)
    const resInvIdx = evaluator.evaluate('items["string_key"]', ctx);
    assert(resInvIdx.isError && resInvIdx.error.code === ERROR_CODES.TYPE_ERROR, 'Error code is TYPE_ERROR on invalid index type');

    // 5. UNSUPPORTED_OPERATION (arbitrary function execution attempt)
    const resCall = evaluator.evaluate('items.append(5)', ctx);
    assert(resCall.isError && resCall.error.code === ERROR_CODES.UNSUPPORTED_OPERATION, 'Arbitrary function call rejected with UNSUPPORTED_OPERATION');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Read-Only Invariant: No Mutation of RuntimeState
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Testing Read-Only Invariant...');
{
    const heap = new Heap({
        obj_data: { id: 'obj_data', type: 'list', elements: [createPrimitiveValue('int', 1)] },
    });

    const state = new RuntimeState({
        globals: { x: createPrimitiveValue('int', 10), data: createReferenceValue('list', 'obj_data') },
        heap,
    });

    const originalJson = JSON.stringify(state.toJSON());
    const ctx = EvaluationContext.fromRuntimeState(state);
    const evaluator = new ExpressionEvaluator();

    // Perform multiple queries
    evaluator.evaluate('x + 100', ctx);
    evaluator.evaluate('data[0] + 50', ctx);
    evaluator.evaluate('len(data)', ctx);
    evaluator.evaluate('data.append(999)', ctx); // Rejected attempt

    const afterJson = JSON.stringify(state.toJSON());
    assert(originalJson === afterJson, 'RuntimeState remains 100% byte-for-byte identical after evaluations (NO MUTATIONS)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Safe Intrinsics: len() and type()
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Testing Safe Intrinsics: len() and type()...');
{
    const heap = new Heap({
        obj_list: { id: 'obj_list', type: 'list', elements: [createPrimitiveValue('int', 1), createPrimitiveValue('int', 2), createPrimitiveValue('int', 3)] },
        obj_dict: { id: 'obj_dict', type: 'dict', entries: [{ key: createPrimitiveValue('str', 'k'), value: createPrimitiveValue('int', 1) }] },
        obj_user: { id: 'obj_user', type: 'instance', className: 'Account', fields: {} },
    });

    const state = new RuntimeState({
        globals: {
            items: createReferenceValue('list', 'obj_list'),
            mapping: createReferenceValue('dict', 'obj_dict'),
            account: createReferenceValue('Account', 'obj_user'),
            text: createPrimitiveValue('str', 'ProViz'),
            num: createPrimitiveValue('int', 42),
        },
        heap,
    });

    const ctx = EvaluationContext.fromRuntimeState(state);
    const evaluator = new ExpressionEvaluator();

    // len(list)
    assert(evaluator.evaluate('len(items)', ctx).value.value === 3, 'len(items) -> 3');
    // len(dict)
    assert(evaluator.evaluate('len(mapping)', ctx).value.value === 1, 'len(mapping) -> 1');
    // len(str)
    assert(evaluator.evaluate('len(text)', ctx).value.value === 6, 'len("ProViz") -> 6');

    // type(account)
    assert(evaluator.evaluate('type(account)', ctx).value.value === "<class 'Account'>", 'type(account) -> <class \'Account\'>');
    // type(num)
    assert(evaluator.evaluate('type(num)', ctx).value.value === "<class 'int'>", 'type(num) -> <class \'int\'>');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Limits & Safety Safeguards
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Testing Limits & Safety Safeguards...');
{
    const evaluator = new ExpressionEvaluator();

    // 1. Depth limit
    const ctxDepth = new EvaluationContext({
        scope: new Scope('local', { x: createPrimitiveValue('int', 1) }),
        limits: { maxDepth: 2 },
    });

    const resDepth = evaluator.evaluate('((((x + 1) + 1) + 1) + 1)', ctxDepth);
    assert(resDepth.isError && resDepth.error.code === ERROR_CODES.DEPTH_LIMIT, 'Depth limit exceeded triggered DEPTH_LIMIT error');

    // 2. Timeout limit
    const ctxTimeout = new EvaluationContext({
        scope: new Scope('local', { x: createPrimitiveValue('int', 1) }),
        limits: { timeoutMs: -1 }, // Immediate timeout
    });

    const resTimeout = evaluator.evaluate('x + 1', ctxTimeout);
    assert(resTimeout.isError && resTimeout.error.code === ERROR_CODES.TIMEOUT, 'Timeout triggered TIMEOUT error');
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Historical Evaluation Across Timeline Frames
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Testing Historical Evaluation Across Timeline Frames...');
{
    const trace = createExecutionTrace({
        events: [
            createTraceEvent({ id: 0, type: 'line', source: { line: 1 }, data: { locals: { counter: { kind: 'primitive', type: 'int', value: 10 } } } }),
            createTraceEvent({ id: 1, type: 'line', source: { line: 2 }, data: { locals: { counter: { kind: 'primitive', type: 'int', value: 20 } } } }),
            createTraceEvent({ id: 2, type: 'line', source: { line: 3 }, data: { locals: { counter: { kind: 'primitive', type: 'int', value: 30 } } } }),
        ],
    });

    const playback = new PlaybackEngine();
    playback.setFrames(trace);

    const dbg = new Debugger({ playbackEngine: playback });
    dbg.loadExecution(trace);

    // Evaluate at historical frames without re-running code
    const resFrame0 = dbg.evaluateAt('counter', 0);
    const resFrame1 = dbg.evaluateAt('counter', 1);
    const resFrame2 = dbg.evaluateAt('counter', 2);

    assert(resFrame0.value.value === 10, 'Frame 0: counter == 10');
    assert(resFrame1.value.value === 20, 'Frame 1: counter == 20');
    assert(resFrame2.value.value === 30, 'Frame 2: counter == 30');

    // Verify determinism: jumping around does not alter evaluateAt results
    dbg.jumpTo(2);
    assert(dbg.evaluateAt('counter', 0).value.value === 10, 'Deterministic evaluation of frame 0 when at frame 2');
    dbg.jumpTo(0);
    assert(dbg.evaluateAt('counter', 2).value.value === 30, 'Deterministic evaluation of frame 2 when at frame 0');
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Multi-File Scope Awareness
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n12. Testing Multi-File Scope Awareness...');
{
    const ws = Workspace.fromFiles({
        'main.py': 'import utils\nx = 10',
        'utils.py': 'x = 20\ndef helper():\n  pass',
    });

    const trace = createExecutionTrace({
        events: [
            createTraceEvent({
                id: 0,
                type: 'line',
                source: { file: 'main.py', path: 'main.py', fileId: 'f_main', moduleId: 'm_main', line: 2 },
                data: { locals: { x: { kind: 'primitive', type: 'int', value: 10 } } },
            }),
            createTraceEvent({
                id: 1,
                type: 'call',
                source: { file: 'utils.py', path: 'utils.py', fileId: 'f_utils', moduleId: 'm_utils', line: 2 },
                scope: { function: 'helper', depth: 2 },
                data: { locals: { x: { kind: 'primitive', type: 'int', value: 20 } } },
            }),
        ],
    });

    const mDbg = new ModuleDebugger({ workspace: ws });
    mDbg.loadExecution(trace);

    // Frame 0 (main.py): x should be 10
    const resMain = mDbg.evaluate('x');
    assert(resMain.value.value === 10, 'In main.py: x resolves to 10');

    // Step to Frame 1 (utils.py): x should be 20
    mDbg.stepForward();
    const resUtils = mDbg.evaluate('x');
    assert(resUtils.value.value === 20, 'In utils.py: x resolves to 20 without cross-file leakage');
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. WatchExpression & WatchManager
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n13. Testing WatchExpression & WatchManager...');
{
    const wm = new WatchManager();

    const w1 = wm.add('x + 1');
    const w2 = wm.add('user.name');

    assert(wm.getAll().length === 2, 'WatchManager tracks 2 watches');
    assert(wm.get(w1.id) === w1, 'get(id) retrieved watch');

    // Toggle / Disable
    wm.disable(w1.id);
    assert(!w1.enabled, 'w1 disabled');
    wm.enable(w1.id);
    assert(w1.enabled, 'w1 enabled');

    // Update watch
    wm.update(w1.id, 'x + 100');
    assert(w1.source === 'x + 100', 'Watch query updated');

    // Batch evaluation
    const state = new RuntimeState({
        globals: { x: createPrimitiveValue('int', 5), user: createPrimitiveValue('str', 'Bob') },
    });
    const ctx = EvaluationContext.fromRuntimeState(state);

    const results = wm.evaluateAll(ctx);
    assert(results.size === 2, 'evaluateAll evaluated both enabled watches');
    assert(results.get(w1.id).value.value === 105, 'Evaluated updated watch: 5 + 100 = 105');

    // Remove
    wm.remove(w2.id);
    assert(wm.getAll().length === 1, 'Watch removed');

    // JSON round-trip
    const clonedWm = WatchManager.fromJSON(wm.toJSON());
    assert(clonedWm.getAll().length === 1, 'WatchManager JSON round-trip is valid');
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. InspectionSnapshot & Frame Diffing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n14. Testing InspectionSnapshot & Frame Diffing...');
{
    const wm = new WatchManager();
    const wX = wm.add('x');
    const wY = wm.add('y');

    // Snapshot at frame 0: x = 1, y = 2
    const state0 = new RuntimeState({ globals: { x: createPrimitiveValue('int', 1), y: createPrimitiveValue('int', 2) } });
    const res0 = wm.evaluateAll(EvaluationContext.fromRuntimeState(state0, { frameIndex: 0 }));
    const snap0 = new InspectionSnapshot({ frameIndex: 0, results: res0, watches: wm.getAll() });

    // Snapshot at frame 1: x = 99, y = 2 (x changed)
    const state1 = new RuntimeState({ globals: { x: createPrimitiveValue('int', 99), y: createPrimitiveValue('int', 2) } });
    const res1 = wm.evaluateAll(EvaluationContext.fromRuntimeState(state1, { frameIndex: 1 }));
    const snap1 = new InspectionSnapshot({ frameIndex: 1, results: res1, watches: wm.getAll() });

    const diff = snap1.diff(snap0);
    assert(diff.changed.length === 1, 'Diff detected exactly 1 changed watch');
    assert(diff.changed[0].watchId === wX.id, 'Changed watch is wX (x)');
    assert(diff.changed[0].fromValue.value === 1, 'fromValue is 1');
    assert(diff.changed[0].toValue.value === 99, 'toValue is 99');
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. ObjectInspector Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n15. Testing ObjectInspector Integration...');
{
    const heap = new Heap({
        obj_profile: {
            id: 'obj_profile',
            type: 'instance',
            className: 'Profile',
            fields: { email: createPrimitiveValue('str', 'user@example.com') },
        },
        obj_user: {
            id: 'obj_user',
            type: 'instance',
            className: 'User',
            fields: { profile: createReferenceValue('Profile', 'obj_profile') },
        },
    });

    const state = new RuntimeState({
        globals: { current_user: createReferenceValue('User', 'obj_user') },
        heap,
    });

    const ctx = EvaluationContext.fromRuntimeState(state);
    const evaluator = new ExpressionEvaluator();

    // Evaluate nested expression yielding objectId
    const res = evaluator.evaluate('current_user.profile', ctx);
    assert(res.isSuccess && res.objectId === 'obj_profile', 'Evaluated current_user.profile -> obj_profile');

    // Pass resolved objectId to ObjectInspector for deep exploration
    const inspector = new ObjectInspector({ runtimeState: state });
    const details = inspector.getObjectDetails(res.objectId);

    assert(details.exists && details.className === 'Profile', 'ObjectInspector seamlessly explored evaluated object');
    assert(details.fields.email.value === 'user@example.com', 'ObjectInspector resolved field value');
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Debugger & ModuleDebugger Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n16. Testing Debugger & ModuleDebugger Integration...');
{
    const trace = createExecutionTrace({
        events: [
            createTraceEvent({ id: 0, type: 'line', source: { line: 1 }, data: { locals: { a: { kind: 'primitive', type: 'int', value: 7 } } } }),
            createTraceEvent({ id: 1, type: 'line', source: { line: 2 }, data: { locals: { a: { kind: 'primitive', type: 'int', value: 14 } } } }),
        ],
    });

    const dbg = new Debugger();
    dbg.loadExecution(trace);

    // addWatch via Debugger API
    const watchA = dbg.addWatch('a * 2');
    assert(dbg.getWatches().length === 1, 'Debugger registered watch');

    const state0 = dbg.getDebuggerState();
    assert(state0.watchResults[watchA.id]?.value?.value === 14, 'Initial state evaluated watch a * 2 (7 * 2 = 14)');

    // Step forward
    dbg.stepForward();
    const state1 = dbg.getDebuggerState();
    assert(state1.watchResults[watchA.id]?.value?.value === 28, 'Next frame evaluated watch a * 2 (14 * 2 = 28)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Large Scale Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n17. Testing Large Scale Performance Benchmarks...');
{
    // 1. Heap with 1,000 objects
    const startHeap = performance.now();
    const largeHeap = new Heap();
    for (let i = 1; i <= 1000; i++) {
        largeHeap.setObject({
            id: `obj_${i}`,
            type: 'instance',
            className: 'Entity',
            fields: { index: createPrimitiveValue('int', i), tag: createPrimitiveValue('str', `tag_${i}`) },
        });
    }
    const stateWithBigHeap = new RuntimeState({
        globals: {
            root: createReferenceValue('Entity', 'obj_500'),
            val: createPrimitiveValue('int', 42),
        },
        heap: largeHeap,
    });
    const heapElapsed = performance.now() - startHeap;
    assert(largeHeap.getAllObjects().length === 1000, 'Created heap with 1,000 objects');
    assert(heapElapsed < 100, `Constructed 1,000 heap objects in ${heapElapsed.toFixed(1)}ms (< 100ms)`);

    // 2. Evaluate 1,000 expressions
    const ctx = EvaluationContext.fromRuntimeState(stateWithBigHeap);
    const evaluator = new ExpressionEvaluator();

    const start1k = performance.now();
    for (let i = 0; i < 1000; i++) {
        evaluator.evaluate('root.index + val', ctx);
    }
    const time1k = performance.now() - start1k;
    assert(time1k < 150, `Evaluated 1,000 expressions in ${time1k.toFixed(1)}ms (< 150ms)`);

    // 3. Evaluate 10,000 expressions
    const start10k = performance.now();
    for (let i = 0; i < 10000; i++) {
        evaluator.evaluate('val * 2', ctx);
    }
    const time10k = performance.now() - start10k;
    assert(time10k < 300, `Evaluated 10,000 expressions in ${time10k.toFixed(1)}ms (< 300ms)`);
}

console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total.`);
console.log('========================================');

if (failed > 0) {
    process.exit(1);
}
