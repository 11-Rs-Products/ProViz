/**
 * Heap — Manages all heap-allocated objects and reference topologies.
 */

import { HeapObject } from './HeapObject.js';

export class Heap {
    constructor(objects = {}) {
        this.objects = {};
        if (objects && typeof objects === 'object') {
            for (const [id, obj] of Object.entries(objects)) {
                this.objects[id] = obj instanceof HeapObject ? obj : new HeapObject(obj);
            }
        }
    }

    /**
     * Add or update an object in the heap.
     * Supports both setObject(obj) and setObject(id, obj).
     * @param {HeapObject|object|string} idOrObj
     * @param {HeapObject|object} [maybeObj]
     */
    setObject(idOrObj, maybeObj = null) {
        const obj = maybeObj !== null ? maybeObj : idOrObj;
        const id = (maybeObj !== null && typeof idOrObj === 'string') ? idOrObj : obj?.id;
        if (!obj || !id) return;
        this.objects[id] = obj instanceof HeapObject ? obj : new HeapObject({ ...obj, id });
    }

    /**
     * Retrieve an object by its ID.
     * @param {string} objectId
     * @returns {HeapObject|null}
     */
    getObject(objectId) {
        return this.objects[objectId] || null;
    }

    hasObject(objectId) {
        return Boolean(this.objects[objectId]);
    }

    removeObject(objectId) {
        delete this.objects[objectId];
    }

    getAllObjects() {
        return Object.values(this.objects);
    }

    /**
     * Applies a semantic mutation to a target heap object.
     *
     * @param {object} mutation
     * @param {string} mutation.targetObjectId - Target object ID
     * @param {string} mutation.operation - 'append' | 'set_item' | 'del_item' | 'set_attr' | 'del_attr' | 'update'
     * @param {object} mutation.data - Operation payload
     */
    applyMutation(mutation) {
        if (!mutation || !mutation.targetObjectId) return;
        const obj = this.getObject(mutation.targetObjectId);
        if (!obj) return;

        const op = mutation.operation;
        const data = mutation.data || {};

        if (op === 'append' && Array.isArray(obj.elements)) {
            obj.elements.push(data.value);
        } else if (op === 'set_item' && Array.isArray(obj.elements)) {
            const idx = data.index;
            if (typeof idx === 'number' && idx >= 0 && idx < obj.elements.length) {
                obj.elements[idx] = data.value;
            }
        } else if (op === 'del_item' && Array.isArray(obj.elements)) {
            const idx = data.index;
            if (typeof idx === 'number' && idx >= 0 && idx < obj.elements.length) {
                obj.elements.splice(idx, 1);
            }
        } else if (op === 'dict_set' || op === 'set_key') {
            const existing = obj.entries.find(e => JSON.stringify(e.key) === JSON.stringify(data.key));
            if (existing) {
                existing.value = data.value;
            } else {
                obj.entries.push({ key: data.key, value: data.value });
            }
        } else if (op === 'dict_del' || op === 'del_key') {
            obj.entries = obj.entries.filter(e => JSON.stringify(e.key) !== JSON.stringify(data.key));
        } else if (op === 'set_attr') {
            if (data.name) {
                obj.fields[data.name] = data.value;
            }
        } else if (op === 'del_attr') {
            if (data.name) {
                delete obj.fields[data.name];
            }
        }
    }

    equals(otherHeap) {
        if (!otherHeap || !(otherHeap instanceof Heap)) return false;
        const keysA = Object.keys(this.objects);
        const keysB = Object.keys(otherHeap.objects);
        if (keysA.length !== keysB.length) return false;
        for (const k of keysA) {
            const objA = this.objects[k];
            const objB = otherHeap.objects[k];
            if (!objB || !objA.equals(objB)) return false;
        }
        return true;
    }

    clone() {
        const cloned = new Heap();
        for (const [id, obj] of Object.entries(this.objects)) {
            cloned.objects[id] = obj.clone();
        }
        return cloned;
    }

    toJSON() {
        const out = {};
        for (const [id, obj] of Object.entries(this.objects)) {
            out[id] = obj.toJSON();
        }
        return out;
    }
}
