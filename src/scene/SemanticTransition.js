/**
 * SemanticTransition — Classifies SceneDiff into high-level semantic execution transitions
 * and produces a renderer-independent transition plan.
 *
 * Guaranteed Properties:
 *  1. Pure & Deterministic: Same SceneDiff always produces identical SemanticTransitionPlan.
 *  2. Renderer-Independent: Zero Three.js / WebGL / DOM dependencies.
 *  3. Bidirectional: Works forwards, backwards, and across non-adjacent historical frames.
 */

import { SceneDiff, getRelationshipKey } from './SceneDiff.js';
import { NODE_TYPES } from './SceneNode.js';
import { RELATIONSHIP_TYPES } from './SceneRelationship.js';
import { SceneGraph } from './SceneGraph.js';

/**
 * Stable Semantic Event Vocabulary
 */
export const SEMANTIC_EVENT_TYPES = Object.freeze({
    // Node Lifecycle
    NODE_ADDED: 'node_added',
    NODE_REMOVED: 'node_removed',
    NODE_UPDATED: 'node_updated',

    // Variable Events
    VARIABLE_CREATED: 'variable_created',
    VARIABLE_REMOVED: 'variable_removed',
    VARIABLE_REBOUND: 'variable_rebound',
    VARIABLE_VALUE_CHANGED: 'variable_value_changed',

    // Object / Heap Events
    OBJECT_CREATED: 'object_created',
    OBJECT_REMOVED: 'object_removed',
    OBJECT_MUTATED: 'object_mutated',

    // Collection / Structure Field Events
    COLLECTION_ELEMENT_ADDED: 'collection_element_added',
    COLLECTION_ELEMENT_REMOVED: 'collection_element_removed',
    COLLECTION_ELEMENT_CHANGED: 'collection_element_changed',
    OBJECT_FIELD_ADDED: 'object_field_added',
    OBJECT_FIELD_REMOVED: 'object_field_removed',
    OBJECT_FIELD_CHANGED: 'object_field_changed',

    // Relationship & Reference Events
    RELATIONSHIP_ADDED: 'relationship_added',
    RELATIONSHIP_REMOVED: 'relationship_removed',
    RELATIONSHIP_TARGET_CHANGED: 'relationship_target_changed',
    RELATIONSHIP_UPDATED: 'relationship_updated',

    // Aliasing Events
    ALIAS_CREATED: 'alias_created',
    ALIAS_REMOVED: 'alias_removed',

    // Scope & Call Frame Events
    CALL_FRAME_ENTERED: 'call_frame_entered',
    CALL_FRAME_EXITED: 'call_frame_exited',
    SCOPE_ENTERED: 'scope_entered',
    SCOPE_EXITED: 'scope_exited',

    // Layout / Visual Style Events
    NODE_TRANSFORM_CHANGED: 'node_transform_changed',
    NODE_STYLE_CHANGED: 'node_style_changed',
});

/**
 * Renderer-Independent Transition Operations
 */
export const TRANSITION_OP_TYPES = Object.freeze({
    CREATE_NODE: 'create_node',
    REMOVE_NODE: 'remove_node',
    UPDATE_NODE: 'update_node',
    ADD_RELATIONSHIP: 'add_relationship',
    REMOVE_RELATIONSHIP: 'remove_relationship',
    UPDATE_RELATIONSHIP: 'update_relationship',
    REBIND_VARIABLE: 'rebind_variable',
    MUTATE_OBJECT: 'mutate_object',
    ENTER_FRAME: 'enter_frame',
    EXIT_FRAME: 'exit_frame',
    HIGHLIGHT_NODE: 'highlight_node',
});

/**
 * SemanticTransitionPlan — Container for classified semantic events and renderer operations.
 */
export class SemanticTransitionPlan {
    /**
     * @param {object} params
     * @param {number|null} [params.fromFrame=null]
     * @param {number|null} [params.toFrame=null]
     * @param {SceneDiff|null} [params.diff=null]
     * @param {Array<object>} [params.events=[]]
     * @param {Array<object>} [params.operations=[]]
     * @param {string} [params.summary='']
     * @param {object} [params.metadata={}]
     */
    constructor({
        fromFrame = null,
        toFrame = null,
        diff = null,
        events = [],
        operations = [],
        summary = '',
        metadata = {},
    } = {}) {
        this.fromFrame = fromFrame;
        this.toFrame = toFrame;
        this.diff = diff;
        this.events = events;
        this.operations = operations;
        this.summary = summary;
        this.metadata = { ...metadata };
    }

    /**
     * Whether this transition represents a no-op (no visual or semantic changes).
     * @returns {boolean}
     */
    get isNoOp() {
        return this.events.length === 0 && this.operations.length === 0;
    }

    /**
     * Filter events by semantic type.
     * @param {string} type
     * @returns {Array<object>}
     */
    getEventsByType(type) {
        return this.events.filter(e => e.type === type);
    }

    /**
     * Filter operations by operation type.
     * @param {string} type
     * @returns {Array<object>}
     */
    getOperationsByType(type) {
        return this.operations.filter(op => op.type === type);
    }

    /**
     * Check if a specific semantic event type occurred.
     * @param {string} type
     * @returns {boolean}
     */
    hasEventType(type) {
        return this.events.some(e => e.type === type);
    }

    toJSON() {
        return {
            fromFrame: this.fromFrame,
            toFrame: this.toFrame,
            events: this.events,
            operations: this.operations,
            summary: this.summary,
            metadata: this.metadata,
        };
    }
}

/**
 * TransitionPlanner — Analyzes structural SceneDiff and constructs a semantic transition plan.
 */
export class TransitionPlanner {
    /**
     * Plan a semantic transition from a SceneDiff and the underlying SceneGraphs.
     *
     * @param {SceneDiff} diff - Structural diff
     * @param {SceneGraph|null} [fromGraph=null] - Preceding SceneGraph
     * @param {SceneGraph|null} [toGraph=null] - Succeeding SceneGraph
     * @param {object} [options={}]
     * @returns {SemanticTransitionPlan} Deterministic plan
     */
    static plan(diff, fromGraph = null, toGraph = null, options = {}) {
        if (!diff) {
            return new SemanticTransitionPlan();
        }

        const events = [];
        const operations = [];

        const fromNodes = fromGraph instanceof SceneGraph ? fromGraph.nodes : {};
        const toNodes = toGraph instanceof SceneGraph ? toGraph.nodes : {};

        // Track variables that are rebound to avoid emitting duplicate events
        const reboundVarIds = new Set();

        // ─────────────────────────────────────────────────────────────────────
        // 1. Process Removed Nodes
        // ─────────────────────────────────────────────────────────────────────
        for (const node of diff.removedNodes) {
            events.push({
                type: SEMANTIC_EVENT_TYPES.NODE_REMOVED,
                nodeId: node.id,
                nodeType: node.type,
                label: node.label,
            });

            operations.push({
                type: TRANSITION_OP_TYPES.REMOVE_NODE,
                nodeId: node.id,
            });

            if (node.type === NODE_TYPES.CALL_FRAME) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.CALL_FRAME_EXITED,
                    nodeId: node.id,
                    functionName: node.metadata?.functionName,
                    depth: node.metadata?.depth,
                });
                events.push({
                    type: SEMANTIC_EVENT_TYPES.SCOPE_EXITED,
                    scopeId: node.id,
                    functionName: node.metadata?.functionName,
                });
                operations.push({
                    type: TRANSITION_OP_TYPES.EXIT_FRAME,
                    frameNodeId: node.id,
                    functionName: node.metadata?.functionName,
                });
            } else if (node.type === NODE_TYPES.OBJECT) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.OBJECT_REMOVED,
                    nodeId: node.id,
                    objectId: node.semanticId,
                    label: node.label,
                });
            } else if (node.type === NODE_TYPES.VARIABLE) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.VARIABLE_REMOVED,
                    nodeId: node.id,
                    varName: node.metadata?.varName || node.semanticId,
                    scope: node.metadata?.scope,
                });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. Process Added Nodes
        // ─────────────────────────────────────────────────────────────────────
        for (const node of diff.addedNodes) {
            events.push({
                type: SEMANTIC_EVENT_TYPES.NODE_ADDED,
                nodeId: node.id,
                nodeType: node.type,
                label: node.label,
            });

            operations.push({
                type: TRANSITION_OP_TYPES.CREATE_NODE,
                nodeId: node.id,
                nodeType: node.type,
                label: node.label,
                value: node.value,
                transform: node.transform,
                style: node.style,
                metadata: node.metadata,
            });

            if (node.type === NODE_TYPES.CALL_FRAME) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.CALL_FRAME_ENTERED,
                    nodeId: node.id,
                    functionName: node.metadata?.functionName,
                    depth: node.metadata?.depth,
                });
                events.push({
                    type: SEMANTIC_EVENT_TYPES.SCOPE_ENTERED,
                    scopeId: node.id,
                    functionName: node.metadata?.functionName,
                });
                operations.push({
                    type: TRANSITION_OP_TYPES.ENTER_FRAME,
                    frameNodeId: node.id,
                    functionName: node.metadata?.functionName,
                    depth: node.metadata?.depth,
                });
            } else if (node.type === NODE_TYPES.OBJECT) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.OBJECT_CREATED,
                    nodeId: node.id,
                    objectId: node.semanticId,
                    objectType: node.metadata?.type || node.value?.type,
                    className: node.metadata?.className || node.value?.className,
                    label: node.label,
                });
            } else if (node.type === NODE_TYPES.VARIABLE) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.VARIABLE_CREATED,
                    nodeId: node.id,
                    varName: node.metadata?.varName || node.semanticId,
                    scope: node.metadata?.scope,
                    value: node.value,
                    isReference: node.style?.category === 'reference_variable',
                });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 3. Process Updated Relationships (Target & Slot Changes)
        // ─────────────────────────────────────────────────────────────────────
        for (const updatedRel of diff.updatedRelationships) {
            const rel = updatedRel.relationship;
            const prevRel = updatedRel.previousRelationship;

            events.push({
                type: SEMANTIC_EVENT_TYPES.RELATIONSHIP_UPDATED,
                fromId: rel.fromId,
                toId: rel.toId,
                previousToId: prevRel.toId,
                relationshipType: rel.type,
                label: rel.label,
                changes: updatedRel.changes,
            });

            if (updatedRel.targetChanged) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.RELATIONSHIP_TARGET_CHANGED,
                    fromId: rel.fromId,
                    fromTarget: prevRel.toId,
                    toTarget: rel.toId,
                    relationshipType: rel.type,
                    label: rel.label,
                });

                // Variable Rebound
                if (rel.fromId.startsWith('scene_var_') && rel.type === RELATIONSHIP_TYPES.REFERENCES) {
                    reboundVarIds.add(rel.fromId);
                    const varNode = toNodes[rel.fromId];
                    events.push({
                        type: SEMANTIC_EVENT_TYPES.VARIABLE_REBOUND,
                        nodeId: rel.fromId,
                        varName: varNode?.metadata?.varName || rel.label,
                        fromTarget: prevRel.toId,
                        toTarget: rel.toId,
                    });
                    operations.push({
                        type: TRANSITION_OP_TYPES.REBIND_VARIABLE,
                        variableNodeId: rel.fromId,
                        fromTarget: prevRel.toId,
                        toTarget: rel.toId,
                    });
                }

                // Collection Element Reference Changed
                if (prevRel.metadata?.index !== undefined) {
                    events.push({
                        type: SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_CHANGED,
                        containerId: rel.fromId,
                        index: prevRel.metadata.index,
                        fromTargetId: prevRel.toId,
                        toTargetId: rel.toId,
                    });
                } else if (prevRel.metadata?.key !== undefined) {
                    events.push({
                        type: SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_CHANGED,
                        containerId: rel.fromId,
                        key: prevRel.metadata.key,
                        fromTargetId: prevRel.toId,
                        toTargetId: rel.toId,
                    });
                } else if (prevRel.metadata?.field !== undefined) {
                    events.push({
                        type: SEMANTIC_EVENT_TYPES.OBJECT_FIELD_CHANGED,
                        objectId: rel.fromId,
                        field: prevRel.metadata.field,
                        fromTargetId: prevRel.toId,
                        toTargetId: rel.toId,
                    });
                }
            }

            operations.push({
                type: TRANSITION_OP_TYPES.UPDATE_RELATIONSHIP,
                fromId: rel.fromId,
                toId: rel.toId,
                previousToId: prevRel.toId,
                relationshipType: rel.type,
                label: rel.label,
                metadata: rel.metadata,
            });
        }

        // ─────────────────────────────────────────────────────────────────────
        // 4. Process Removed Relationships
        // ─────────────────────────────────────────────────────────────────────
        for (const rel of diff.removedRelationships) {
            events.push({
                type: SEMANTIC_EVENT_TYPES.RELATIONSHIP_REMOVED,
                fromId: rel.fromId,
                toId: rel.toId,
                relationshipType: rel.type,
                label: rel.label,
            });

            operations.push({
                type: TRANSITION_OP_TYPES.REMOVE_RELATIONSHIP,
                fromId: rel.fromId,
                toId: rel.toId,
                relationshipType: rel.type,
                label: rel.label,
            });

            if (rel.fromId.startsWith('scene_var_') && rel.type === RELATIONSHIP_TYPES.REFERENCES) {
                // Variable unlinked from object (e.g. rebound to primitive or deleted)
                if (toNodes[rel.fromId] && !reboundVarIds.has(rel.fromId)) {
                    reboundVarIds.add(rel.fromId);
                    const varNode = toNodes[rel.fromId];
                    events.push({
                        type: SEMANTIC_EVENT_TYPES.VARIABLE_REBOUND,
                        nodeId: rel.fromId,
                        varName: varNode.metadata?.varName || rel.label,
                        fromTarget: rel.toId,
                        toTarget: null,
                        toValue: varNode.value,
                    });
                    operations.push({
                        type: TRANSITION_OP_TYPES.REBIND_VARIABLE,
                        variableNodeId: rel.fromId,
                        fromTarget: rel.toId,
                        toTarget: null,
                    });
                }
            }

            if (rel.metadata?.index !== undefined) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_REMOVED,
                    containerId: rel.fromId,
                    index: rel.metadata.index,
                    previousTargetId: rel.toId,
                });
            } else if (rel.metadata?.key !== undefined) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_REMOVED,
                    containerId: rel.fromId,
                    key: rel.metadata.key,
                    previousTargetId: rel.toId,
                });
            } else if (rel.metadata?.field !== undefined) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.OBJECT_FIELD_REMOVED,
                    objectId: rel.fromId,
                    field: rel.metadata.field,
                    previousTargetId: rel.toId,
                });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 5. Process Added Relationships
        // ─────────────────────────────────────────────────────────────────────
        for (const rel of diff.addedRelationships) {
            events.push({
                type: SEMANTIC_EVENT_TYPES.RELATIONSHIP_ADDED,
                fromId: rel.fromId,
                toId: rel.toId,
                relationshipType: rel.type,
                label: rel.label,
            });

            operations.push({
                type: TRANSITION_OP_TYPES.ADD_RELATIONSHIP,
                fromId: rel.fromId,
                toId: rel.toId,
                relationshipType: rel.type,
                label: rel.label,
                metadata: rel.metadata,
            });

            if (rel.fromId.startsWith('scene_var_') && rel.type === RELATIONSHIP_TYPES.REFERENCES) {
                // Variable newly linked to object (e.g. rebound from primitive)
                if (fromNodes[rel.fromId] && !reboundVarIds.has(rel.fromId)) {
                    reboundVarIds.add(rel.fromId);
                    const varNode = toNodes[rel.fromId];
                    events.push({
                        type: SEMANTIC_EVENT_TYPES.VARIABLE_REBOUND,
                        nodeId: rel.fromId,
                        varName: varNode?.metadata?.varName || rel.label,
                        fromTarget: null,
                        toTarget: rel.toId,
                    });
                    operations.push({
                        type: TRANSITION_OP_TYPES.REBIND_VARIABLE,
                        variableNodeId: rel.fromId,
                        fromTarget: null,
                        toTarget: rel.toId,
                    });
                }
            }

            if (rel.metadata?.index !== undefined) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_ADDED,
                    containerId: rel.fromId,
                    index: rel.metadata.index,
                    targetId: rel.toId,
                });
            } else if (rel.metadata?.key !== undefined) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.COLLECTION_ELEMENT_ADDED,
                    containerId: rel.fromId,
                    key: rel.metadata.key,
                    targetId: rel.toId,
                });
            } else if (rel.metadata?.field !== undefined) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.OBJECT_FIELD_ADDED,
                    objectId: rel.fromId,
                    field: rel.metadata.field,
                    targetId: rel.toId,
                });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 6. Process Updated Nodes (Value, Transform, Style)
        // ─────────────────────────────────────────────────────────────────────
        for (const update of diff.updatedNodes) {
            const { node, previousNode, changes } = update;

            events.push({
                type: SEMANTIC_EVENT_TYPES.NODE_UPDATED,
                nodeId: node.id,
                nodeType: node.type,
                changes,
            });

            operations.push({
                type: TRANSITION_OP_TYPES.UPDATE_NODE,
                nodeId: node.id,
                changes,
                label: node.label,
                style: node.style,
                transform: node.transform,
            });

            if (changes.transform) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.NODE_TRANSFORM_CHANGED,
                    nodeId: node.id,
                    from: changes.transform.from,
                    to: changes.transform.to,
                });
            }

            if (changes.style) {
                events.push({
                    type: SEMANTIC_EVENT_TYPES.NODE_STYLE_CHANGED,
                    nodeId: node.id,
                    from: changes.style.from,
                    to: changes.style.to,
                });
            }

            if (node.type === NODE_TYPES.VARIABLE) {
                if (changes.value) {
                    const fromIsRef = previousNode.style?.category === 'reference_variable';
                    const toIsRef = node.style?.category === 'reference_variable';

                    if (!fromIsRef && !toIsRef) {
                        events.push({
                            type: SEMANTIC_EVENT_TYPES.VARIABLE_VALUE_CHANGED,
                            nodeId: node.id,
                            varName: node.metadata?.varName || node.semanticId,
                            fromValue: changes.value.from,
                            toValue: changes.value.to,
                        });
                    } else if (!reboundVarIds.has(node.id)) {
                        reboundVarIds.add(node.id);
                        events.push({
                            type: SEMANTIC_EVENT_TYPES.VARIABLE_REBOUND,
                            nodeId: node.id,
                            varName: node.metadata?.varName || node.semanticId,
                            fromTarget: previousNode.value?.objectId ? `scene_${previousNode.value.objectId}` : null,
                            toTarget: node.value?.objectId ? `scene_${node.value.objectId}` : null,
                            fromValue: changes.value.from,
                            toValue: changes.value.to,
                        });
                        operations.push({
                            type: TRANSITION_OP_TYPES.REBIND_VARIABLE,
                            variableNodeId: node.id,
                            fromTarget: previousNode.value?.objectId ? `scene_${previousNode.value.objectId}` : null,
                            toTarget: node.value?.objectId ? `scene_${node.value.objectId}` : null,
                        });
                    }
                }
            } else if (node.type === NODE_TYPES.OBJECT) {
                if (changes.value || changes.label) {
                    events.push({
                        type: SEMANTIC_EVENT_TYPES.OBJECT_MUTATED,
                        nodeId: node.id,
                        objectId: node.semanticId,
                        previousValue: previousNode.value,
                        currentValue: node.value,
                        label: node.label,
                        changes,
                    });

                    operations.push({
                        type: TRANSITION_OP_TYPES.MUTATE_OBJECT,
                        objectNodeId: node.id,
                        changes,
                        newLabel: node.label,
                    });
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 7. Detect Aliasing Transitions
        // ─────────────────────────────────────────────────────────────────────
        // Inspect all candidate target objects involved in edge/node transitions
        const candidateTargetIds = new Set();
        for (const r of diff.addedRelationships) candidateTargetIds.add(r.toId);
        for (const r of diff.removedRelationships) candidateTargetIds.add(r.toId);
        for (const u of diff.updatedRelationships) {
            candidateTargetIds.add(u.relationship.toId);
            candidateTargetIds.add(u.previousRelationship.toId);
        }

        const sortedTargetIds = Array.from(candidateTargetIds).sort();
        for (const targetId of sortedTargetIds) {
            const fromRefs = fromGraph ? fromGraph.getRelationshipsTo(targetId).filter(r => r.type === RELATIONSHIP_TYPES.REFERENCES).map(r => r.fromId).sort() : [];
            const toRefs = toGraph ? toGraph.getRelationshipsTo(targetId).filter(r => r.type === RELATIONSHIP_TYPES.REFERENCES).map(r => r.fromId).sort() : [];

            const hadAlias = fromRefs.length >= 2;
            const hasAlias = toRefs.length >= 2;

            if (!hadAlias && hasAlias) {
                // New alias created
                events.push({
                    type: SEMANTIC_EVENT_TYPES.ALIAS_CREATED,
                    targetObjectId: targetId,
                    referrers: toRefs,
                    newReferrers: toRefs.filter(r => !fromRefs.includes(r)),
                });
            } else if (hadAlias && !hasAlias) {
                // Alias broken/removed
                events.push({
                    type: SEMANTIC_EVENT_TYPES.ALIAS_REMOVED,
                    targetObjectId: targetId,
                    remainingReferrers: toRefs,
                    removedReferrers: fromRefs.filter(r => !toRefs.includes(r)),
                });
            } else if (hadAlias && hasAlias) {
                // Alias set modified
                const added = toRefs.filter(r => !fromRefs.includes(r));
                const removed = fromRefs.filter(r => !toRefs.includes(r));

                if (added.length > 0) {
                    events.push({
                        type: SEMANTIC_EVENT_TYPES.ALIAS_CREATED,
                        targetObjectId: targetId,
                        referrers: toRefs,
                        newReferrers: added,
                    });
                }
                if (removed.length > 0) {
                    events.push({
                        type: SEMANTIC_EVENT_TYPES.ALIAS_REMOVED,
                        targetObjectId: targetId,
                        remainingReferrers: toRefs,
                        removedReferrers: removed,
                    });
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 8. Construct Human-Readable Summary
        // ─────────────────────────────────────────────────────────────────────
        const summaryParts = [];
        if (diff.fromFrame !== null && diff.toFrame !== null) {
            summaryParts.push(`Frame ${diff.fromFrame} → ${diff.toFrame}:`);
        }

        const addedObjs = diff.addedNodes.filter(n => n.type === NODE_TYPES.OBJECT);
        const removedObjs = diff.removedNodes.filter(n => n.type === NODE_TYPES.OBJECT);
        const mutatedObjs = events.filter(e => e.type === SEMANTIC_EVENT_TYPES.OBJECT_MUTATED);
        const reboundVars = events.filter(e => e.type === SEMANTIC_EVENT_TYPES.VARIABLE_REBOUND);
        const changedVars = events.filter(e => e.type === SEMANTIC_EVENT_TYPES.VARIABLE_VALUE_CHANGED);

        if (addedObjs.length > 0) summaryParts.push(`+ ${addedObjs.map(n => n.label || n.id).join(', ')}`);
        if (removedObjs.length > 0) summaryParts.push(`- ${removedObjs.map(n => n.label || n.id).join(', ')}`);
        if (mutatedObjs.length > 0) summaryParts.push(`~ ${mutatedObjs.map(e => e.label || e.nodeId).join(', ')}`);
        if (reboundVars.length > 0) summaryParts.push(`↪ rebound ${reboundVars.map(e => e.varName).join(', ')}`);
        if (changedVars.length > 0) summaryParts.push(`✎ ${changedVars.map(e => `${e.varName} = ${JSON.stringify(e.toValue)}`).join(', ')}`);

        if (summaryParts.length === 0 || (summaryParts.length === 1 && diff.fromFrame !== null)) {
            summaryParts.push(diff.isEmpty ? 'No changes' : `${diff.totalChanges} structural changes`);
        }

        const summary = summaryParts.join(' ');

        return new SemanticTransitionPlan({
            fromFrame: diff.fromFrame,
            toFrame: diff.toFrame,
            diff,
            events,
            operations,
            summary,
            metadata: options.metadata || {},
        });
    }

    /**
     * Compute transition plan directly between two SceneGraphs.
     *
     * @param {SceneGraph|null} fromGraph
     * @param {SceneGraph|null} toGraph
     * @param {object} [options={}]
     * @returns {SemanticTransitionPlan}
     */
    static computeTransition(fromGraph, toGraph, options = {}) {
        const diff = SceneDiff.compute(fromGraph, toGraph, options);
        return TransitionPlanner.plan(diff, fromGraph, toGraph, options);
    }
}
