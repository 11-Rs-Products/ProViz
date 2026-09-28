/**
 * ObjectInspector — Read-only projection model for inspection and heap exploration.
 *
 * Encapsulates object structure, identity topology, outbound references, reverse referrers,
 * cyclic detection, and heap overview.
 *
 * Operates directly on RuntimeState without duplicating heap memory or binding to Three.js/DOM.
 */

import { RuntimeState } from '../runtime/RuntimeState.js';
import { HeapObject } from '../runtime/HeapObject.js';

export class ObjectInspector {
    /**
     * @param {object} [params]
     * @param {RuntimeState|null} [params.runtimeState=null] - Authoritative RuntimeState snapshot
     */
    constructor({ runtimeState = null } = {}) {
        this._runtimeState = runtimeState;
        this._selectedObjectId = null;
    }

    /**
     * Update the active RuntimeState snapshot.
     * @param {RuntimeState|null} runtimeState
     */
    setRuntimeState(runtimeState) {
        this._runtimeState = runtimeState;
    }

    get runtimeState() {
        return this._runtimeState;
    }

    get heap() {
        return this._runtimeState ? this._runtimeState.heap : null;
    }

    /**
     * Get or set currently selected object ID.
     */
    get selectedObjectId() {
        return this._selectedObjectId;
    }

    selectObject(objectId) {
        this._selectedObjectId = objectId;
        return this.getObjectDetails(objectId);
    }

    /**
     * Checks if a heap object exists in current runtime state.
     * @param {string} objectId
     * @returns {boolean}
     */
    hasObject(objectId) {
        return Boolean(this.heap && this.heap.hasObject(objectId));
    }

    /**
     * Retrieve a HeapObject by ID directly.
     * @param {string} objectId
     * @returns {HeapObject|null}
     */
    getObject(objectId) {
        return this.heap ? this.heap.getObject(objectId) : null;
    }

    /**
     * Retrieve complete structured inspection details for a target heap object.
     *
     * @param {string} objectId - Target object ID (e.g. 'obj_1')
     * @returns {object} Object inspection descriptor
     */
    getObjectDetails(objectId) {
        if (!objectId) return null;
        const obj = this.getObject(objectId);
        if (!obj) {
            return {
                objectId,
                exists: false,
                message: `Object ${objectId} is not present in the current runtime state.`,
            };
        }

        const size = this._calculateObjectSize(obj);
        const preview = this._generatePreview(obj);
        const outbound = this.getOutboundReferences(objectId);
        const referrers = this.getReferrers(objectId);
        const boundVariables = this._getBoundVariables(objectId);

        return {
            objectId: obj.id,
            exists: true,
            type: obj.type,
            className: obj.className || obj.type,
            size,
            preview,
            elements: obj.elements ? [...obj.elements] : [],
            entries: obj.entries ? [...obj.entries] : [],
            fields: obj.fields ? { ...obj.fields } : {},
            references: outbound,
            referrers,
            boundVariables,
        };
    }

    /**
     * Calculate reverse references (referrers) pointing to target objectId.
     * Searches active call stack frame variables, global scope, and all heap objects.
     *
     * @param {string} targetObjectId
     * @returns {Array<object>} Referrer descriptors
     */
    getReferrers(targetObjectId) {
        if (!this._runtimeState || !targetObjectId) return [];

        const referrers = [];
        const seen = new Set();

        const addReferrer = (ref) => {
            const key = `${ref.sourceKind}:${ref.scope || ''}:${ref.name || ''}:${ref.sourceObjectId || ''}`;
            if (!seen.has(key)) {
                seen.add(key);
                referrers.push(ref);
            }
        };

        // 1. Search local variables in call stack frames
        for (const frame of this._runtimeState.callStack) {
            const scopeName = frame.functionName || '<module>';
            for (const [varName, binding] of Object.entries(frame.scope.bindings)) {
                if (this._valueMatchesTarget(binding, targetObjectId)) {
                    addReferrer({
                        sourceKind: 'variable',
                        scope: scopeName,
                        name: varName,
                        label: `${scopeName}.${varName}`,
                    });
                }
            }
        }

        // 2. Search global variables
        if (this._runtimeState.globals) {
            for (const [varName, binding] of Object.entries(this._runtimeState.globals.bindings)) {
                if (this._valueMatchesTarget(binding, targetObjectId)) {
                    addReferrer({
                        sourceKind: 'variable',
                        scope: 'global',
                        name: varName,
                        label: `global ${varName}`,
                    });
                }
            }
        }

        // 3. Search outbound fields/elements/entries of all heap objects
        if (this.heap) {
            for (const srcObj of this.heap.getAllObjects()) {
                // Check list/tuple/set elements
                if (Array.isArray(srcObj.elements)) {
                    srcObj.elements.forEach((elem, idx) => {
                        if (this._valueMatchesTarget(elem, targetObjectId)) {
                            addReferrer({
                                sourceKind: 'object',
                                sourceObjectId: srcObj.id,
                                sourceType: srcObj.type,
                                name: `[${idx}]`,
                                label: `${srcObj.type} ${srcObj.id}[${idx}]`,
                            });
                        }
                    });
                }

                // Check dict entries
                if (Array.isArray(srcObj.entries)) {
                    srcObj.entries.forEach(entry => {
                        if (this._valueMatchesTarget(entry.key, targetObjectId)) {
                            addReferrer({
                                sourceKind: 'object',
                                sourceObjectId: srcObj.id,
                                sourceType: srcObj.type,
                                name: `[key]`,
                                label: `${srcObj.type} ${srcObj.id} (as key)`,
                            });
                        }
                        if (this._valueMatchesTarget(entry.value, targetObjectId)) {
                            const keyLabel = typeof entry.key === 'object' ? (entry.key.value || entry.key.objectId || 'key') : entry.key;
                            addReferrer({
                                sourceKind: 'object',
                                sourceObjectId: srcObj.id,
                                sourceType: srcObj.type,
                                name: `["${keyLabel}"]`,
                                label: `${srcObj.type} ${srcObj.id}["${keyLabel}"]`,
                            });
                        }
                    });
                }

                // Check object instance fields
                if (srcObj.fields) {
                    for (const [fieldName, fieldVal] of Object.entries(srcObj.fields)) {
                        if (this._valueMatchesTarget(fieldVal, targetObjectId)) {
                            addReferrer({
                                sourceKind: 'object',
                                sourceObjectId: srcObj.id,
                                sourceType: srcObj.type,
                                name: fieldName,
                                label: `${srcObj.type} ${srcObj.id}.${fieldName}`,
                            });
                        }
                    }
                }
            }
        }

        return referrers;
    }

    /**
     * Calculate outbound references from a target heap object.
     * @param {string} objectId
     * @returns {Array<object>} Outbound reference descriptors
     */
    getOutboundReferences(objectId) {
        const obj = this.getObject(objectId);
        if (!obj) return [];

        const refs = [];

        const checkValue = (val, slotLabel) => {
            if (val && typeof val === 'object' && val.kind === 'reference' && val.objectId) {
                const targetObj = this.getObject(val.objectId);
                refs.push({
                    slot: slotLabel,
                    targetObjectId: val.objectId,
                    targetType: targetObj ? targetObj.type : val.type || 'object',
                    targetClassName: targetObj ? targetObj.className : 'object',
                });
            }
        };

        if (Array.isArray(obj.elements)) {
            obj.elements.forEach((elem, idx) => checkValue(elem, `[${idx}]`));
        }
        if (Array.isArray(obj.entries)) {
            obj.entries.forEach(entry => {
                const keyLabel = typeof entry.key === 'object' ? (entry.key.value || entry.key.objectId || 'key') : entry.key;
                checkValue(entry.value, `["${keyLabel}"]`);
            });
        }
        if (obj.fields) {
            for (const [k, v] of Object.entries(obj.fields)) {
                checkValue(v, `.${k}`);
            }
        }

        return refs;
    }

    /**
     * Get an expandable representation of an object with cycle protection.
     *
     * @param {string} objectId
     * @param {Set<string>} [visited=new Set()]
     * @returns {object} Tree node representation
     */
    getObjectTree(objectId, visited = new Set()) {
        const obj = this.getObject(objectId);
        if (!obj) {
            return { objectId, exists: false };
        }

        if (visited.has(objectId)) {
            return {
                objectId,
                type: obj.type,
                className: obj.className,
                isCycle: true,
                preview: `${obj.id} ↩ cycle`,
                children: [],
            };
        }

        const nextVisited = new Set(visited);
        nextVisited.add(objectId);

        const children = [];

        if (Array.isArray(obj.elements)) {
            obj.elements.forEach((elem, idx) => {
                if (elem && typeof elem === 'object' && elem.kind === 'reference' && elem.objectId) {
                    children.push({
                        slot: `[${idx}]`,
                        kind: 'reference',
                        child: this.getObjectTree(elem.objectId, nextVisited),
                    });
                } else {
                    children.push({
                        slot: `[${idx}]`,
                        kind: 'primitive',
                        value: elem?.value ?? elem,
                    });
                }
            });
        } else if (Array.isArray(obj.entries)) {
            obj.entries.forEach(entry => {
                const keyStr = typeof entry.key === 'object' ? (entry.key.value || entry.key.objectId || 'key') : entry.key;
                if (entry.value && typeof entry.value === 'object' && entry.value.kind === 'reference' && entry.value.objectId) {
                    children.push({
                        slot: `["${keyStr}"]`,
                        kind: 'reference',
                        child: this.getObjectTree(entry.value.objectId, nextVisited),
                    });
                } else {
                    children.push({
                        slot: `["${keyStr}"]`,
                        kind: 'primitive',
                        value: entry.value?.value ?? entry.value,
                    });
                }
            });
        } else if (obj.fields) {
            for (const [k, v] of Object.entries(obj.fields)) {
                if (v && typeof v === 'object' && v.kind === 'reference' && v.objectId) {
                    children.push({
                        slot: `.${k}`,
                        kind: 'reference',
                        child: this.getObjectTree(v.objectId, nextVisited),
                    });
                } else {
                    children.push({
                        slot: `.${k}`,
                        kind: 'primitive',
                        value: v?.value ?? v,
                    });
                }
            }
        }

        return {
            objectId: obj.id,
            type: obj.type,
            className: obj.className,
            isCycle: false,
            preview: this._generatePreview(obj),
            children,
        };
    }

    /**
     * Get summary overview of all heap objects in current runtime state.
     * @returns {Array<object>} Array of heap object overview items
     */
    getHeapOverview() {
        if (!this.heap) return [];

        return this.heap.getAllObjects().map(obj => {
            const boundVars = this._getBoundVariables(obj.id);
            return {
                objectId: obj.id,
                type: obj.type,
                className: obj.className || obj.type,
                size: this._calculateObjectSize(obj),
                preview: this._generatePreview(obj),
                boundVariables: boundVars,
            };
        });
    }

    /**
     * Search heap objects matching query by ID, type, variable name, or value text.
     * @param {string} query
     * @returns {Array<object>} Array of matching object inspection details
     */
    search(query) {
        if (!query || typeof query !== 'string' || !this.heap) return [];
        const q = query.trim().toLowerCase();
        if (!q) return [];

        const matches = [];
        for (const obj of this.heap.getAllObjects()) {
            const bound = this._getBoundVariables(obj.id);
            const matchesId = obj.id.toLowerCase().includes(q);
            const matchesType = (obj.type || '').toLowerCase().includes(q) || (obj.className || '').toLowerCase().includes(q);
            const matchesVar = bound.some(v => v.toLowerCase().includes(q));

            if (matchesId || matchesType || matchesVar) {
                matches.push(this.getObjectDetails(obj.id));
            }
        }
        return matches;
    }

    /**
     * Directed reference path search between two objects or from a variable to an object.
     * @param {string} fromId - Source object ID or variable name
     * @param {string} toId - Target object ID
     * @returns {Array<string>|null} Array of IDs representing the path, or null if no path
     */
    getPath(fromId, toId) {
        if (!this.heap || !toId) return null;

        let startObjId = fromId;
        if (!this.heap.hasObject(fromId)) {
            // Check if fromId is a variable name
            const binding = this._runtimeState ? this._runtimeState.getVariable(fromId) : null;
            if (binding && binding.kind === 'reference') {
                startObjId = binding.objectId;
            } else {
                return null;
            }
        }

        if (startObjId === toId) return [startObjId];

        const queue = [[startObjId]];
        const visited = new Set([startObjId]);

        while (queue.length > 0) {
            const path = queue.shift();
            const currId = path[path.length - 1];

            const outbound = this.getOutboundReferences(currId);
            for (const ref of outbound) {
                const nextId = ref.targetObjectId;
                if (nextId === toId) {
                    return [...path, nextId];
                }
                if (!visited.has(nextId)) {
                    visited.add(nextId);
                    queue.push([...path, nextId]);
                }
            }
        }

        return null;
    }

    /**
     * Compare two objects or state snapshots for differences (diff-ready architecture).
     * @param {HeapObject|object} objA
     * @param {HeapObject|object} objB
     * @returns {object} Diff analysis descriptor
     */
    compareObjects(objA, objB) {
        if (!objA && !objB) return { equal: true, changes: [] };
        if (!objA || !objB) return { equal: false, changes: ['existence_mismatch'] };

        const idA = objA.id || objA.objectId;
        const idB = objB.id || objB.objectId;
        if (idA !== idB) return { equal: false, changes: ['id_mismatch'] };

        const changes = [];
        if (objA.type !== objB.type) changes.push('type_changed');

        const elementsA = objA.elements || [];
        const elementsB = objB.elements || [];
        if (elementsA.length !== elementsB.length) {
            changes.push(`length_changed:${elementsA.length}->${elementsB.length}`);
        }

        return {
            equal: changes.length === 0,
            changes,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Helper Utilities
    // ─────────────────────────────────────────────────────────────────────────────

    _valueMatchesTarget(val, targetObjectId) {
        if (!val || typeof val !== 'object') return false;
        return val.kind === 'reference' && val.objectId === targetObjectId;
    }

    _calculateObjectSize(obj) {
        if (!obj) return 0;
        if (Array.isArray(obj.elements)) return obj.elements.length;
        if (Array.isArray(obj.entries)) return obj.entries.length;
        if (obj.fields) return Object.keys(obj.fields).length;
        return 0;
    }

    _generatePreview(obj) {
        if (!obj) return 'None';
        if (obj.type === 'list' || obj.type === 'tuple') {
            const count = obj.elements ? obj.elements.length : 0;
            return `${obj.type}[${count}]`;
        }
        if (obj.type === 'dict') {
            const count = obj.entries ? obj.entries.length : 0;
            return `dict[${count}]`;
        }
        if (obj.type === 'set') {
            const count = obj.elements ? obj.elements.length : 0;
            return `set[${count}]`;
        }
        return `${obj.className || obj.type} (${obj.id})`;
    }

    _getBoundVariables(objectId) {
        if (!this._runtimeState) return [];
        const vars = new Set();

        for (const frame of this._runtimeState.callStack) {
            for (const [k, v] of Object.entries(frame.scope.bindings)) {
                if (this._valueMatchesTarget(v, objectId)) vars.add(k);
            }
        }
        if (this._runtimeState.globals) {
            for (const [k, v] of Object.entries(this._runtimeState.globals.bindings)) {
                if (this._valueMatchesTarget(v, objectId)) vars.add(k);
            }
        }

        return Array.from(vars);
    }
}
