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
