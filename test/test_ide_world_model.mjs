/**
 * IDE layer tests: WorldModel projection (RuntimeState -> renderer-neutral world) and
 * StepNavigator debugger semantics (step over / into / out / continue / markers).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { Heap } from '../src/runtime/Heap.js';
import { buildWorldModel, WORLD_LIMITS } from '../src/rendering/WorldModel.js';
import {
    stepIntoIndex, stepOverIndex, stepOutIndex, continueIndex, timelineMarkers, changeOriginLine,
} from '../src/debugger/StepNavigator.js';

function stateWith(frames, heap = {}) {
    const s = new RuntimeState({ heap: new Heap(heap) });
    frames.forEach((f, i) => s.pushCallFrame({ frameId: `f${i}`, functionName: f.name, source: { file: 'main.py', line: 1 }, locals: f.locals }));
    return s;
}

const prim = (type, value) => ({ kind: 'primitive', type, value });
const ref = (objectId, type = 'list') => ({ kind: 'reference', type, objectId });

test('WorldModel: empty / null state yields an empty world', () => {
    const w = buildWorldModel(null, null);
    assert.deepEqual(w.frames, []);
    assert.deepEqual(w.objects, []);
    assert.deepEqual(w.edges, []);
});

test('WorldModel: aliased variables share one heap object and produce two edges', () => {
    const heap = { obj_1: { id: 'obj_1', type: 'list', elements: [prim('int', 1), prim('int', 2)] } };
    const s = stateWith([{ name: '<module>', locals: { a: ref('obj_1'), b: ref('obj_1'), x: prim('int', 7) } }], heap);
    const w = buildWorldModel(s, { changed_variables: [{ name: 'b', is_new: true }], event_type: 'line', current_line: 3 });

    assert.equal(w.objects.length, 1, 'identity preserved: one list, not two');
    assert.equal(w.objects[0].cells.length, 2);
    assert.equal(w.edges.length, 2);
    assert.ok(w.edges.every(e => e.to === 'obj:obj_1'));
    const b = w.frames[0].vars.find(v => v.name === 'b');
    assert.equal(b.kind, 'reference');
    assert.equal(b.changed, true);
    assert.equal(b.isNew, true);
    const x = w.frames[0].vars.find(v => v.name === 'x');
    assert.equal(x.display, '7');
    assert.equal(w.line, 3);
});

test('WorldModel: nested references are followed and cyclic heaps terminate', () => {
    const heap = {
        obj_1: { id: 'obj_1', type: 'instance', className: 'Node', fields: { val: prim('int', 1), next: ref('obj_2', 'Node') } },
        obj_2: { id: 'obj_2', type: 'instance', className: 'Node', fields: { val: prim('int', 2), next: ref('obj_1', 'Node') } },
    };
    const s = stateWith([{ name: '<module>', locals: { head: ref('obj_1', 'Node') } }], heap);
    const w = buildWorldModel(s, null);
    assert.equal(w.objects.length, 2);
    const cellEdges = w.edges.filter(e => e.from.startsWith('cell:'));
    assert.equal(cellEdges.length, 2, 'both next pointers drawn, cycle included');
});

test('WorldModel: only the active frame carries change flags; stack order preserved', () => {
    const s = stateWith([
        { name: '<module>', locals: { n: prim('int', 3) } },
        { name: 'fact', locals: { n: prim('int', 2) } },
    ]);
    const w = buildWorldModel(s, { changed_variables: [{ name: 'n', is_new: false }] });
    assert.deepEqual(w.frames.map(f => f.name), ['<module>', 'fact']);
    assert.equal(w.frames[1].active, true);
    assert.equal(w.frames[0].vars[0].changed, false);
    assert.equal(w.frames[1].vars[0].changed, true);
    assert.notEqual(w.frames[0].vars[0].id, w.frames[1].vars[0].id, 'same name in different frames gets distinct ids');
});

test('WorldModel: large collections are bounded with an overflow count', () => {
    const elements = Array.from({ length: 30 }, (_, i) => prim('int', i));
    const s = stateWith([{ name: '<module>', locals: { big: ref('obj_1') } }], { obj_1: { id: 'obj_1', type: 'list', elements } });
    const w = buildWorldModel(s, null);
    assert.equal(w.objects[0].cells.length, WORLD_LIMITS.MAX_CELLS);
    assert.equal(w.objects[0].overflow, 30 - WORLD_LIMITS.MAX_CELLS);
});

test('WorldModel: falls back to frame variables when the call stack is empty', () => {
    const s = new RuntimeState();
    const w = buildWorldModel(s, { current_function: '<module>', variables: { y: { value: '5', rawValue: prim('int', 5) } } });
    assert.equal(w.frames.length, 1);
    assert.equal(w.frames[0].vars[0].display, '5');
});

const F = (event_type, stack_depth, current_line, current_function = 'f') => ({ event_type, stack_depth, current_line, current_function });
const timeline = [
    F('line', 1, 1, '<module>'),   // 0
    F('call', 2, 5, 'g'),          // 1
    F('line', 2, 6, 'g'),          // 2
    F('call', 3, 9, 'h'),          // 3
    F('line', 3, 10, 'h'),         // 4
    F('return', 3, 10, 'h'),       // 5
    F('line', 2, 7, 'g'),          // 6
    F('return', 2, 7, 'g'),        // 7
    F('line', 1, 2, '<module>'),   // 8
    F('exception', 1, 2, '<module>'), // 9
];

test('StepNavigator: step into advances exactly one frame and clamps', () => {
    assert.equal(stepIntoIndex(timeline, 0), 1);
    assert.equal(stepIntoIndex(timeline, 9), 9);
});

test('StepNavigator: step over skips callee bodies', () => {
    assert.equal(stepOverIndex(timeline, 0), 8);
    assert.equal(stepOverIndex(timeline, 2), 6);
    assert.equal(stepOverIndex(timeline, -1), 0);
});

test('StepNavigator: step out returns to the caller', () => {
    assert.equal(stepOutIndex(timeline, 4), 6);
    assert.equal(stepOutIndex(timeline, 2), 8);
    assert.equal(stepOutIndex(timeline, 0), 9);
});

test('StepNavigator: continue stops at breakpoints and exceptions', () => {
    assert.equal(continueIndex(timeline, -1, new Set([6])), 2, 'line 6 is frame 2');
    assert.equal(continueIndex(timeline, 2, new Set([6])), 9, 'next stop is the exception');
    assert.equal(continueIndex(timeline, -1, new Set()), 9);
});

test('StepNavigator: timeline markers flag calls, breakpoints and exceptions', () => {
    const m = timelineMarkers(timeline, new Set([7]));
    assert.deepEqual(m.filter(x => x.kind === 'call').map(x => x.index), [1, 3]);
    assert.deepEqual(m.filter(x => x.kind === 'breakpoint').map(x => x.index), [6]);
    assert.deepEqual(m.filter(x => x.kind === 'exception').map(x => x.index), [9]);
});

test('StepNavigator: change origin is the previously executed line in the same frame', () => {
    assert.equal(changeOriginLine(timeline, 6), 6, 'g resumed after h: origin is the earlier g line');
    assert.equal(changeOriginLine(timeline, 1), 5, 'call frame: no same-frame predecessor');
    assert.equal(changeOriginLine(timeline, 99), null);
});
