/**
 * WorldModel — Pure projection of RuntimeState + playback frame into a renderer-neutral
 * description of the 3D world (stack frames, variables, heap objects, reference edges).
 *
 * No Three.js, DOM, or Python knowledge lives here: the output is plain data that the
 * SpatialWorld renderer (or any other view) can reconcile against. Keeping this pure makes
 * the projection deterministic and unit-testable in Node.
 */

import { stringifyValue } from '../runtime/Value.js';

export const WORLD_LIMITS = Object.freeze({
    MAX_CELLS: 12,
    MAX_OBJECTS: 40,
    MAX_DISPLAY: 18,
    MAX_TABLE_ROWS: 10,
    MAX_TABLE_COLS: 8,
});

function truncate(text, max = WORLD_LIMITS.MAX_DISPLAY) {
    const s = String(text);
    return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function heapLookup(heap, objectId) {
    if (!heap) return null;
    if (typeof heap.getObject === 'function') return heap.getObject(objectId);
    return heap[objectId] || null;
}

function isRef(v) {
    return Boolean(v && typeof v === 'object' && v.kind === 'reference' && v.objectId);
}

function primitiveDisplay(v, heap) {
    if (isRef(v)) {
        const obj = heapLookup(heap, v.objectId);
        return obj ? `${obj.className || obj.type}` : `${v.type || 'ref'}`;
    }
    return stringifyValue(v, heap);
}

function cellsOf(obj) {
    const cells = [];
    if (obj.type === 'list' || obj.type === 'tuple' || obj.type === 'set') {
        (obj.elements || []).forEach((el, i) => {
            cells.push({ label: obj.type === 'set' ? '' : String(i), value: el });
        });
    } else if (obj.type === 'dict') {
        (obj.entries || []).forEach(e => {
            cells.push({ label: truncate(stringifyValue(e.key, {}), 8), value: e.value });
        });
    } else {
        Object.entries(obj.fields || {}).forEach(([k, v]) => {
            cells.push({ label: truncate(k, 8), value: v });
        });
    }
    return cells;
}

function isPrimitiveValue(v) {
    return !isRef(v);
}

/**
 * Tabular view of an object, or null. Tables come from three places:
 *  - the tracer's 'table' objects (pandas DataFrame, 2-D numpy array)
 *  - a list/tuple of equal-ish rows of primitives (a matrix / grid)
 *  - a list/tuple of dicts that share the same primitive-valued keys (records)
 * Returns { columns, rowLabels, rows: [[value]], totalRows, totalCols, absorbed: [objectId] }.
 */
export function tableOf(obj, heap) {
    const L = WORLD_LIMITS;
    if (!obj) return null;
    if (obj.type === 'table') {
        return {
            columns: obj.columns || [],
            rowLabels: obj.rowLabels || [],
            rows: obj.rows || [],
            totalRows: obj.totalRows ?? (obj.rows || []).length,
            totalCols: obj.totalCols ?? (obj.columns || []).length,
            absorbed: [],
        };
    }
    if (obj.type !== 'list' && obj.type !== 'tuple') return null;
    const els = obj.elements || [];
    if (els.length < 2 || !els.every(isRef)) return null;
    const children = els.map(e => heapLookup(heap, e.objectId));
    if (children.some(c => !c)) return null;

    // Matrix: every row is a list/tuple of primitives, 1..MAX_TABLE_COLS wide.
    if (children.every(c => (c.type === 'list' || c.type === 'tuple') && (c.elements || []).length > 0
        && (c.elements || []).length <= L.MAX_TABLE_COLS && c.elements.every(isPrimitiveValue))) {
        const width = Math.max(...children.map(c => c.elements.length));
        return {
            columns: Array.from({ length: width }, (_, i) => String(i)),
            rowLabels: children.map((_, i) => String(i)),
            rows: children.map(c => Array.from({ length: width }, (_, i) => c.elements[i] ?? null)),
            totalRows: obj.elements.length,
            totalCols: width,
            absorbed: els.map(e => e.objectId),
        };
    }

    // Records: every row is a dict of primitives with the same keys.
    if (children.every(c => c.type === 'dict' && (c.entries || []).length > 0 && c.entries.length <= L.MAX_TABLE_COLS
        && c.entries.every(e => isPrimitiveValue(e.key) && isPrimitiveValue(e.value)))) {
        const keyOf = e => stringifyValue(e.key, {});
        const keys = children[0].entries.map(keyOf);
        const sameKeys = children.every(c => c.entries.length === keys.length && c.entries.every((e, i) => keyOf(e) === keys[i]));
        if (!sameKeys) return null;
        return {
            columns: keys.map(k => k.replace(/^"(.*)"$/, '$1')),
            rowLabels: children.map((_, i) => String(i)),
            rows: children.map(c => c.entries.map(e => e.value)),
            totalRows: obj.elements.length,
            totalCols: keys.length,
            absorbed: els.map(e => e.objectId),
        };
    }
    return null;
}

/**
 * Build the world description for a single playback step.
 *
 * @param {import('../runtime/RuntimeState.js').RuntimeState|null} state
 * @param {object|null} frame - Legacy visualization frame (for change flags / event type)
 * @returns {{frames: Array, objects: Array, edges: Array, line: number|null, eventType: string|null, exception: object|null}}
 */
export function buildWorldModel(state, frame = null) {
    const world = {
        frames: [],
        objects: [],
        edges: [],
        line: frame?.current_line ?? state?.currentSource?.line ?? null,
        eventType: frame?.event_type ?? null,
        exception: frame?.exception ?? null,
    };
    if (!state) return world;

    const heap = state.heap;
    const changed = new Map();
    for (const c of frame?.changed_variables || []) changed.set(c.name, c);

    // 1. Stack frames (bottom → top). Fall back to the frame snapshot if the stack is empty.
    const stack = state.callStack && state.callStack.length > 0
        ? state.callStack.map(cf => ({ name: cf.functionName, bindings: cf.scope.bindings }))
        : [{ name: frame?.current_function || '<module>', bindings: Object.fromEntries(
            Object.entries(frame?.variables || {}).map(([k, v]) => [k, v.rawValue ?? { kind: 'primitive', type: 'str', value: v.value }])
        ) }];

    const roots = [];
    stack.forEach((sf, depth) => {
        const frameId = `frame:${depth}:${sf.name}`;
        const isActive = depth === stack.length - 1;
        const vars = Object.entries(sf.bindings || {}).map(([name, value]) => {
            const id = `var:${depth}:${name}`;
            const ch = isActive ? changed.get(name) : null;
            const ref = isRef(value) ? value.objectId : null;
            if (ref) roots.push(ref);
            return {
                id,
                name,
                type: value?.type || 'unknown',
                kind: ref ? 'reference' : 'primitive',
                display: truncate(primitiveDisplay(value, heap)),
                fullDisplay: stringifyValue(value, heap),
                objectId: ref,
                changed: Boolean(ch),
                isNew: Boolean(ch?.is_new),
            };
        });
        world.frames.push({ id: frameId, name: sf.name, depth, active: isActive, vars });
    });

    // 2. Heap objects reachable from any visible variable (BFS, bounded).
    const seen = new Set();
    const queue = [...roots];
    while (queue.length > 0 && world.objects.length < WORLD_LIMITS.MAX_OBJECTS) {
        const objectId = queue.shift();
        if (seen.has(objectId)) continue;
        seen.add(objectId);
        const obj = heapLookup(heap, objectId);
        if (!obj) continue;

        const table = tableOf(obj, heap);
        if (table) {
            // Rows absorbed into the table are not drawn again as separate objects.
            table.absorbed.forEach(id => seen.add(id));
            const rows = table.rows.slice(0, WORLD_LIMITS.MAX_TABLE_ROWS);
            const ncols = Math.min(table.columns.length, WORLD_LIMITS.MAX_TABLE_COLS);
            const gridRows = rows.map((row, r) => ({
                label: truncate(table.rowLabels[r] ?? String(r), 6),
                cells: row.slice(0, ncols).map((v, c) => ({
                    id: `cell:${objectId}:${r}:${c}`,
                    display: v == null ? '' : truncate(primitiveDisplay(v, heap), 9),
                    objectId: isRef(v) ? v.objectId : null,
                    type: v?.type || null,
                })),
            }));
            world.objects.push({
                id: `obj:${objectId}`,
                objectId,
                type: obj.type,
                className: obj.className || obj.type,
                cells: gridRows.flatMap(r => r.cells),
                overflow: 0,
                grid: {
                    columns: table.columns.slice(0, ncols).map(c => truncate(c, 9)),
                    rows: gridRows,
                    totalRows: table.totalRows,
                    totalCols: table.totalCols,
                    hiddenRows: Math.max(0, table.totalRows - gridRows.length),
                    hiddenCols: Math.max(0, table.totalCols - ncols),
                },
            });
            continue;
        }

        const all = cellsOf(obj);
        const cells = all.slice(0, WORLD_LIMITS.MAX_CELLS).map((c, i) => {
            const ref = isRef(c.value) ? c.value.objectId : null;
            if (ref && !seen.has(ref)) queue.push(ref);
            return {
                id: `cell:${objectId}:${i}`,
                label: c.label,
                display: truncate(ref ? '•' : primitiveDisplay(c.value, heap), 10),
                objectId: ref,
            };
        });
        world.objects.push({
            id: `obj:${objectId}`,
            objectId,
            type: obj.type,
            className: obj.className || obj.type,
            cells,
            overflow: Math.max(0, all.length - cells.length),
        });
    }

    // 3. Reference edges (variable → object, cell → object) to objects that are rendered.
    const rendered = new Set(world.objects.map(o => o.objectId));
    for (const f of world.frames) {
        for (const v of f.vars) {
            if (v.objectId && rendered.has(v.objectId)) {
                world.edges.push({ id: `edge:${v.id}->${v.objectId}`, from: v.id, to: `obj:${v.objectId}`, active: v.changed });
            }
        }
    }
    for (const o of world.objects) {
        for (const c of o.cells) {
            if (c.objectId && rendered.has(c.objectId)) {
                world.edges.push({ id: `edge:${c.id}->${c.objectId}`, from: c.id, to: `obj:${c.objectId}`, active: false });
            }
        }
    }

    return world;
}
