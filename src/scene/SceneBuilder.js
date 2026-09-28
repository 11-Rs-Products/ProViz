/**
 * SceneBuilder — Converts RuntimeState into a renderer-independent SceneGraph.
 *
 * Guaranteed Properties:
 *  1. Pure & Deterministic: build(state) produces an identical SceneGraph every time.
 *  2. Reference Preservation: Shared references point to the same SceneNode; no duplicate objects.
 *  3. Cycle-Safe: Self-referencing structures (e.g. a.append(a)) produce cyclic relationships safely.
 *  4. Renderer-Independent: Contains zero Three.js, WebGL, or DOM dependencies.
 */

import { SceneGraph } from './SceneGraph.js';
import { SceneNode, NODE_TYPES } from './SceneNode.js';
import { SceneRelationship, RELATIONSHIP_TYPES } from './SceneRelationship.js';
import { stringifyValue, isPrimitive, isReference } from '../runtime/Value.js';

export class SceneBuilder {
    /**
     * @param {object} [options]
     * @param {number} [options.maxDepth=8] - Maximum graph traversal depth
     * @param {number} [options.maxItems=64] - Maximum items to inspect per collection
     */
    constructor(options = {}) {
        this.maxDepth = options.maxDepth || 8;
        this.maxItems = options.maxItems || 64;
    }

    /**
     * Build a complete SceneGraph from a RuntimeState snapshot.
     *
     * @param {import('../runtime/RuntimeState.js').RuntimeState} runtimeState
     * @returns {SceneGraph} Deterministic SceneGraph instance
     */
    build(runtimeState) {
        const sceneGraph = new SceneGraph({
            metadata: {
                sourceLine: runtimeState?.currentSource?.line ?? null,
            },
        });

        if (!runtimeState) {
            return sceneGraph;
        }

        const heap = runtimeState.heap;

        // ─────────────────────────────────────────────────────────────────────
        // 1. Process Heap Objects
        // ─────────────────────────────────────────────────────────────────────
        const heapObjects = heap && typeof heap.getAllObjects === 'function'
            ? heap.getAllObjects()
            : Object.values(heap?.objects || heap || {});

        let heapX = -4.5;
        const heapY = 1.2;
        const heapSpacing = 3.6;

        for (let i = 0; i < heapObjects.length; i++) {
            const obj = heapObjects[i];
            const sceneObjId = `scene_${obj.id}`;

            const labelStr = `${obj.className || obj.type || 'Object'} #${obj.id}`;
            const objNode = new SceneNode({
                id: sceneObjId,
                type: NODE_TYPES.OBJECT,
                semanticId: obj.id,
                label: labelStr,
                value: {
                    type: obj.type,
                    className: obj.className,
                    elementsCount: obj.elements?.length ?? 0,
                    entriesCount: obj.entries?.length ?? 0,
                    fieldsCount: Object.keys(obj.fields || {}).length,
                },
                transform: {
                    position: { x: heapX + i * heapSpacing, y: heapY, z: 0 },
                },
                style: {
                    category: 'heap_object',
                    emphasis: 'default',
                    colorHint: 'BLUE',
                },
                metadata: {
                    type: obj.type,
                    className: obj.className,
                },
            });

            sceneGraph.addNode(objNode);

            // Process outbound references from list/tuple/set elements
            if (Array.isArray(obj.elements)) {
                for (let elIdx = 0; elIdx < Math.min(obj.elements.length, this.maxItems); elIdx++) {
                    const elVal = obj.elements[elIdx];
                    if (isReference(elVal)) {
                        sceneGraph.addRelationship(new SceneRelationship({
                            fromId: sceneObjId,
                            toId: `scene_${elVal.objectId}`,
                            type: RELATIONSHIP_TYPES.REFERENCES,
                            label: `[${elIdx}]`,
                            metadata: { index: elIdx },
                        }));
                    }
                }
            }

            // Process outbound references from dict entries
            if (Array.isArray(obj.entries)) {
                for (let entryIdx = 0; entryIdx < Math.min(obj.entries.length, this.maxItems); entryIdx++) {
                    const entry = obj.entries[entryIdx];
                    const keyStr = stringifyValue(entry.key, heap);
                    if (isReference(entry.value)) {
                        sceneGraph.addRelationship(new SceneRelationship({
                            fromId: sceneObjId,
                            toId: `scene_${entry.value.objectId}`,
                            type: RELATIONSHIP_TYPES.REFERENCES,
                            label: keyStr,
                            metadata: { key: keyStr },
                        }));
                    }
                }
            }

            // Process outbound references from class instance fields
            if (obj.fields && typeof obj.fields === 'object') {
                for (const [fieldName, fieldVal] of Object.entries(obj.fields)) {
                    if (isReference(fieldVal)) {
                        sceneGraph.addRelationship(new SceneRelationship({
                            fromId: sceneObjId,
                            toId: `scene_${fieldVal.objectId}`,
                            type: RELATIONSHIP_TYPES.REFERENCES,
                            label: fieldName,
                            metadata: { field: fieldName },
                        }));
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. Process Call Stack & Scopes
        // ─────────────────────────────────────────────────────────────────────
        const callStack = runtimeState.callStack || [];
        let varCol = 0;
        const varY = -2.6;
        const varSpacing = 2.8;
        const varStartX = -5.5;

        for (let frameIdx = 0; frameIdx < callStack.length; frameIdx++) {
            const frame = callStack[frameIdx];
            const frameNodeId = `scene_frame_${frame.frameId || frameIdx}`;

            const frameNode = new SceneNode({
                id: frameNodeId,
                type: NODE_TYPES.CALL_FRAME,
                semanticId: frame.frameId || `frame_${frameIdx}`,
                label: `${frame.functionName === '<module>' ? '〈module〉' : `${frame.functionName}()`} (line ${frame.source?.line ?? '?'})`,
                transform: {
                    position: { x: 5.5, y: 3.5 - frameIdx * 1.8, z: 0 },
                },
                style: {
                    category: 'call_frame',
                    emphasis: frameIdx === callStack.length - 1 ? 'active' : 'default',
                    colorHint: 'PURPLE',
                },
                metadata: {
                    depth: frame.depth,
                    functionName: frame.functionName,
                    moduleId: frame.source?.moduleId || null,
                    fileId: frame.source?.fileId || null,
                    sourceLocation: frame.source || null,
                },
            });

            sceneGraph.addNode(frameNode);

            // Process local variables inside this call frame
            const bindings = frame.scope?.bindings || frame.locals || {};
            for (const [varName, val] of Object.entries(bindings)) {
                const varNodeId = `scene_var_${frame.frameId || frameIdx}_${varName}`;
                const isRef = isReference(val);
                const displayVal = stringifyValue(val, heap);

                const varNode = new SceneNode({
                    id: varNodeId,
                    type: NODE_TYPES.VARIABLE,
                    semanticId: varName,
                    label: `${varName} = ${displayVal}`,
                    value: val,
                    transform: {
                        position: { x: varStartX + (varCol % 4) * varSpacing, y: varY - Math.floor(varCol / 4) * 1.8, z: 0 },
                    },
                    style: {
                        category: isRef ? 'reference_variable' : 'primitive_variable',
                        emphasis: 'default',
                        colorHint: isRef ? 'CYAN' : 'ORANGE',
                    },
                    metadata: {
                        varName,
                        scope: frame.functionName,
                        declaringModuleId: frame.source?.moduleId || null,
                        declaringFileId: frame.source?.fileId || null,
                    },
                });

                sceneGraph.addNode(varNode);
                frameNode.addChild(varNodeId);

                // Frame CONTAINS variable relationship
                sceneGraph.addRelationship(new SceneRelationship({
                    fromId: frameNodeId,
                    toId: varNodeId,
                    type: RELATIONSHIP_TYPES.CONTAINS,
                    label: varName,
                }));

                // Variable REFERENCES heap object relationship
                if (isRef && val.objectId) {
                    sceneGraph.addRelationship(new SceneRelationship({
                        fromId: varNodeId,
                        toId: `scene_${val.objectId}`,
                        type: RELATIONSHIP_TYPES.REFERENCES,
                        label: varName,
                    }));
                }

                varCol++;
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 3. Process Global Variables (if not shadowed in local frame)
        // ─────────────────────────────────────────────────────────────────────
        const globalBindings = runtimeState.globals?.bindings || {};
        const activeLocalKeys = new Set(Object.keys(runtimeState.activeLocals || {}));

        for (const [gName, gVal] of Object.entries(globalBindings)) {
            if (activeLocalKeys.has(gName)) continue; // avoid duplicate display if shadowed

            const varNodeId = `scene_var_global_${gName}`;
            const isRef = isReference(gVal);
            const displayVal = stringifyValue(gVal, heap);

            const varNode = new SceneNode({
                id: varNodeId,
                type: NODE_TYPES.VARIABLE,
                semanticId: gName,
                label: `${gName} = ${displayVal}`,
                value: gVal,
                transform: {
                    position: { x: varStartX + (varCol % 4) * varSpacing, y: varY - Math.floor(varCol / 4) * 1.8, z: 0 },
                },
                style: {
                    category: isRef ? 'reference_variable' : 'primitive_variable',
                    emphasis: 'default',
                    colorHint: 'DEFAULT',
                },
                metadata: {
                    varName: gName,
                    scope: 'global',
                },
            });

            sceneGraph.addNode(varNode);

            if (isRef && gVal.objectId) {
                sceneGraph.addRelationship(new SceneRelationship({
                    fromId: varNodeId,
                    toId: `scene_${gVal.objectId}`,
                    type: RELATIONSHIP_TYPES.REFERENCES,
                    label: gName,
                }));
            }

            varCol++;
        }

        return sceneGraph;
    }
}
