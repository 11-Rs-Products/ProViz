/**
 * Universal visualisation: table detection in the world model and table heap objects.
 * Matrices, records and DataFrame/ndarray tables render as one grid; other shapes don't.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RuntimeState } from '../src/runtime/RuntimeState.js';
import { Heap } from '../src/runtime/Heap.js';
import { HeapObject } from '../src/runtime/HeapObject.js';
import { buildWorldModel, tableOf } from '../src/rendering/WorldModel.js';
import { stringifyValue } from '../src/runtime/Value.js';

const prim = (type, value) => ({ kind: 'primitive', type, value });
const ref = (objectId, type = 'list') => ({ kind: 'reference', type, objectId });
const list = (id, elements, type = 'list') => ({ id, type, className: type, elements });
const dict = (id, pairs) => ({ id, type: 'dict', className: 'dict', entries: pairs.map(([k, v]) => ({ key: prim('str', k), value: v })) });

function world(heapObjs, locals) {
    const s = new RuntimeState({ heap: new Heap(heapObjs) });
    s.pushCallFrame({ frameId: 'f0', functionName: '<module>', source: { file: 'main.py', line: 1 }, locals });
    return buildWorldModel(s, { event_type: 'line', current_line: 1, changed_variables: [] });
}

test('matrix: list of equal rows becomes one 3×3 grid and rows are not drawn again', () => {
    const heap = {
        g: list('g', [ref('r0'), ref('r1'), ref('r2')]),
        r0: list('r0', [prim('int', 1), prim('int', 2), prim('int', 3)]),
        r1: list('r1', [prim('int', 4), prim('int', 0), prim('int', 6)]),
        r2: list('r2', [prim('int', 7), prim('int', 8), prim('int', 9)]),
    };
    const w = world(heap, { grid: ref('g') });
    assert.equal(w.objects.length, 1, 'rows are absorbed into the table');
    const t = w.objects[0].grid;
    assert.deepEqual(t.columns, ['0', '1', '2']);
    assert.equal(t.rows.length, 3);
    assert.equal(t.rows[1].cells[1].display, '0');
    assert.equal(t.rows[2].cells[0].type, 'int');
    assert.equal(w.edges.length, 1, 'one arc: grid → table');
});

test('records: list of dicts with the same keys becomes a table with key columns', () => {
    const heap = {
        p: list('p', [ref('a', 'dict'), ref('b', 'dict')]),
        a: dict('a', [['name', prim('str', 'Ana')], ['age', prim('int', 31)]]),
        b: dict('b', [['name', prim('str', 'Bo')], ['age', prim('int', 27)]]),
    };
    const t = tableOf(heap.p, heap);
    assert.deepEqual(t.columns, ['name', 'age']);
    assert.equal(t.rows.length, 2);
    assert.deepEqual(t.absorbed.sort(), ['a', 'b']);
});

test('not a table: mismatched keys, nested references, single row, or too wide', () => {
    const mixed = {
        p: list('p', [ref('a', 'dict'), ref('b', 'dict')]),
        a: dict('a', [['name', prim('str', 'Ana')]]),
        b: dict('b', [['title', prim('str', 'Dr')]]),
    };
    assert.equal(tableOf(mixed.p, mixed), null, 'different keys');
    const nested = { o: list('o', [ref('x'), ref('y')]), x: list('x', [ref('z')]), y: list('y', [prim('int', 1)]), z: list('z', []) };
    assert.equal(tableOf(nested.o, nested), null, 'cells must be primitives');
    const single = { o: list('o', [ref('x')]), x: list('x', [prim('int', 1)]) };
    assert.equal(tableOf(single.o, single), null, 'one row is just a list');
    const wide = { o: list('o', [ref('x'), ref('y')]), x: list('x', Array.from({ length: 20 }, (_, i) => prim('int', i))), y: list('y', [prim('int', 1)]) };
    assert.equal(tableOf(wide.o, wide), null, 'rows wider than the grid limit stay lists');
});

test('ragged matrix pads short rows with empty cells', () => {
    const heap = { m: list('m', [ref('a'), ref('b')]), a: list('a', [prim('int', 1), prim('int', 2)]), b: list('b', [prim('int', 3)]) };
    const w = world(heap, { m: ref('m') });
    const rows = w.objects[0].grid.rows;
    assert.equal(rows[1].cells.length, 2);
    assert.equal(rows[1].cells[1].display, '');
});

test('tracer tables (DataFrame / ndarray) keep columns, row labels and hidden counts', () => {
    const df = {
        id: 'df', type: 'table', className: 'DataFrame', columns: ['name', 'age'], rowLabels: ['0', '2'],
        rows: [[prim('str', 'Ana'), prim('int', 31)], [prim('str', 'Cy'), prim('int', 40)]], totalRows: 30, totalCols: 2,
    };
    const w = world({ df }, { older: ref('df', 'DataFrame') });
    const g = w.objects[0].grid;
    assert.deepEqual(g.columns, ['name', 'age']);
    assert.deepEqual(g.rows.map(r => r.label), ['0', '2']);
    assert.equal(g.hiddenRows, 28);
    assert.equal(stringifyValue(ref('df'), new Heap({ df })), 'DataFrame (30 rows × 2 columns)');
});

test('HeapObject round-trips table data through clone/toJSON/equals', () => {
    const t = new HeapObject({ id: 't', type: 'table', className: 'ndarray int64', columns: ['0', '1'], rowLabels: ['0'], rows: [[prim('int', 1), ref('o')]], totalRows: 1, totalCols: 2 });
    const c = t.clone();
    assert.ok(c.equals(t));
    assert.deepEqual(c.toJSON().columns, ['0', '1']);
    assert.deepEqual(t.getOutboundReferences(), ['o']);
    c.rows[0][0] = prim('int', 9);
    assert.ok(!c.equals(t), 'cell changes are detected');
});

test('subclass names are kept in display (deque, Counter)', () => {
    const heap = new Heap({
        q: { id: 'q', type: 'list', className: 'deque', elements: [prim('int', 1), prim('int', 2)] },
        c: { id: 'c', type: 'dict', className: 'Counter', entries: [{ key: prim('str', 'a'), value: prim('int', 3) }] },
    });
    assert.equal(stringifyValue(ref('q'), heap), 'deque([1, 2])');
    assert.equal(stringifyValue(ref('c', 'dict'), heap), 'Counter({"a": 3})');
});
