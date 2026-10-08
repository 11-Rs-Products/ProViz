/**
 * Value — Structured runtime value descriptors.
 *
 * Distinguishes primitives (int, float, bool, str, None) from heap references (list, dict, set, instance).
 */

export const VALUE_KINDS = Object.freeze({
    PRIMITIVE: 'primitive',
    REFERENCE: 'reference',
    OPAQUE: 'opaque',
});

/**
 * Creates a structured primitive value descriptor.
 *
 * @param {string} type - 'int' | 'float' | 'bool' | 'str' | 'NoneType'
 * @param {any} value - Primitive JS value (number, boolean, string, null)
 * @returns {object}
 */
export function createPrimitiveValue(type, value) {
    return {
        kind: VALUE_KINDS.PRIMITIVE,
        type: type || (value === null ? 'NoneType' : typeof value),
        value,
    };
}

/**
 * Creates a structured heap reference descriptor.
 *
 * @param {string} type - 'list' | 'dict' | 'set' | 'tuple' | 'instance' | custom class name
 * @param {string} objectId - ProViz stable object ID (e.g. 'obj_1')
 * @returns {object}
 */
export function createReferenceValue(typeOrId, objectId = null) {
    if (objectId === null) {
        return {
            kind: VALUE_KINDS.REFERENCE,
            type: 'object',
            objectId: typeOrId,
        };
    }
    return {
        kind: VALUE_KINDS.REFERENCE,
        type: typeOrId || 'object',
        objectId,
    };
}

/**
 * Creates an opaque value descriptor for values exceeding limits or unserializable.
 *
 * @param {string} type - Python type name
 * @param {string} reason - Truncation or safety reason
 * @returns {object}
 */
export function createOpaqueValue(type, reason = 'limit_exceeded') {
    return {
        kind: VALUE_KINDS.OPAQUE,
        type: type || 'unknown',
        reason,
    };
}

export function isPrimitive(v) {
    return Boolean(v && typeof v === 'object' && v.kind === VALUE_KINDS.PRIMITIVE);
}

export function isReference(v) {
    return Boolean(v && typeof v === 'object' && v.kind === VALUE_KINDS.REFERENCE);
}

export function isOpaque(v) {
    return Boolean(v && typeof v === 'object' && v.kind === VALUE_KINDS.OPAQUE);
}

/**
 * Renders a human-readable string representation of a structured value,
 * resolving heap references recursively up to a safe depth limit.
 *
 * @param {object} value - Structured value descriptor
 * @param {object} [heap] - Heap dictionary / Heap instance
 * @param {Set} [visited] - Cycle detection set
 * @param {number} [depth=0] - Current recursion depth
 * @returns {string}
 */
export function stringifyValue(value, heap = {}, visited = new Set(), depth = 0) {
    if (!value) return 'None';
    if (typeof value === 'string') return value;

    if (isPrimitive(value)) {
        if (value.type === 'NoneType' || value.value === null) return 'None';
        if (value.type === 'bool') return value.value ? 'True' : 'False';
        if (value.type === 'str') return `"${value.value}"`;
        return String(value.value);
    }

    if (isOpaque(value)) {
        return `<${value.type}: ${value.reason}>`;
    }

    if (isReference(value)) {
        const objId = value.objectId;
        if (visited.has(objId)) {
            return `[Cyclic #${objId}]`;
        }

        const heapMap = heap && typeof heap.getObject === 'function' ? heap.objects : (heap.objects || heap);
        const obj = heapMap[objId];
        if (!obj) {
            return `[${value.type || 'Object'} #${objId}]`;
        }

        if (depth > 6) {
            return `[${obj.type} #${objId} ...]`;
        }

        visited.add(objId);

        let result = '';
        if (obj.type === 'list' || obj.type === 'tuple') {
            const elements = obj.elements || [];
            const inner = elements.map(el => stringifyValue(el, heap, visited, depth + 1)).join(', ');
            result = obj.type === 'tuple' ? `(${inner}${elements.length === 1 ? ',' : ''})` : `[${inner}]`;
            if (obj.className && obj.className !== 'list' && obj.className !== 'tuple') result = `${obj.className}(${result})`;
        } else if (obj.type === 'dict') {
            const entries = obj.entries || [];
            const inner = entries.map(e => `${stringifyValue(e.key, heap, visited, depth + 1)}: ${stringifyValue(e.value, heap, visited, depth + 1)}`).join(', ');
            result = `{${inner}}`;
            if (obj.className && obj.className !== 'dict') result = `${obj.className}(${result})`;
        } else if (obj.type === 'table') {
            const rows = obj.totalRows ?? (obj.rows || []).length;
            const cols = obj.totalCols ?? (obj.columns || []).length;
            result = `${obj.className || 'table'} (${rows} rows × ${cols} columns)`;
        } else if (obj.type === 'set') {
            const elements = obj.elements || [];
            result = elements.length === 0 ? 'set()' : `{${elements.map(el => stringifyValue(el, heap, visited, depth + 1)).join(', ')}}`;
        } else {
            // Class instance
            const fields = obj.fields || {};
            const fieldStrs = Object.entries(fields).map(([k, v]) => `${k}=${stringifyValue(v, heap, visited, depth + 1)}`).join(', ');
            result = `${obj.className || obj.type || 'Object'}(${fieldStrs})`;
        }

        visited.delete(objId);
        return result;
    }

    return String(value);
}

/**
 * Compares two structured values for structural and identity equivalence.
 *
 * @param {object} v1
 * @param {object} v2
 * @returns {boolean}
 */
export function valuesEqual(v1, v2) {
    if (v1 === v2) return true;
    if (!v1 || !v2) return false;
    if (typeof v1 !== 'object' || typeof v2 !== 'object') return v1 === v2;

    if (v1.kind !== v2.kind) return false;

    if (v1.kind === VALUE_KINDS.PRIMITIVE) {
        return v1.type === v2.type && v1.value === v2.value;
    }

    if (v1.kind === VALUE_KINDS.REFERENCE) {
        return v1.objectId === v2.objectId && v1.type === v2.type;
    }

    if (v1.kind === VALUE_KINDS.OPAQUE) {
        return v1.type === v2.type && v1.reason === v2.reason;
    }

    return false;
}

