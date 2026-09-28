/**
 * SceneDiff — Renderer-independent structural difference between two SceneGraphs.
 *
 * Responsibilities:
 *  - Deterministically compares two SceneGraph snapshots (fromScene, toScene)
 *  - Identifies added, removed, and updated SceneNodes
 *  - Identifies added, removed, and updated SceneRelationships
 *  - Provides pure, immutable diff data with zero Three.js/DOM dependencies
 */

import { SceneGraph } from './SceneGraph.js';
import { SceneNode } from './SceneNode.js';
import { SceneRelationship } from './SceneRelationship.js';

/**
 * Generate a deterministic semantic slot key for a SceneRelationship.
 *
 * Used to match corresponding relationship slots across frames (e.g. variable binding,
 * collection index, dict key, class field) to detect target/value changes.
 *
 * @param {SceneRelationship} rel
 * @returns {string} Stable relationship slot key
 */
export function getRelationshipKey(rel) {
    if (!rel) return '';
    const fromId = rel.fromId || '';
    const toId = rel.toId || '';
    const type = rel.type || 'references';
    const label = rel.label || '';
    const meta = rel.metadata || {};

    if (meta.key !== undefined) {
        return `${fromId}|${type}|key:${meta.key}`;
    }
    if (meta.index !== undefined) {
        return `${fromId}|${type}|idx:${meta.index}`;
    }
    if (meta.field !== undefined) {
        return `${fromId}|${type}|field:${meta.field}`;
    }
    if (fromId.startsWith('scene_var_') && type === 'references') {
        return `${fromId}|${type}`;
    }
    return `${fromId}|${type}|${label}|${toId}`;
}

/**
 * Generate a canonical edge identifier for unique edge matching.
 *
 * @param {SceneRelationship} rel
 * @returns {string} Unique edge ID
 */
export function getCanonicalEdgeId(rel) {
    if (!rel) return '';
    return `${rel.fromId}->${rel.toId}:${rel.type}:${rel.label}:${JSON.stringify(rel.metadata || {})}`;
}

export class SceneDiff {
    /**
     * @param {object} params
     * @param {number|null} [params.fromFrame=null]
     * @param {number|null} [params.toFrame=null]
     * @param {SceneNode[]} [params.addedNodes=[]]
     * @param {SceneNode[]} [params.removedNodes=[]]
     * @param {Array<{node: SceneNode, previousNode: SceneNode, changes: object}>} [params.updatedNodes=[]]
     * @param {SceneRelationship[]} [params.addedRelationships=[]]
     * @param {SceneRelationship[]} [params.removedRelationships=[]]
     * @param {Array<{relationship: SceneRelationship, previousRelationship: SceneRelationship, targetChanged?: boolean, changes: object}>} [params.updatedRelationships=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        fromFrame = null,
        toFrame = null,
        addedNodes = [],
        removedNodes = [],
        updatedNodes = [],
        addedRelationships = [],
        removedRelationships = [],
        updatedRelationships = [],
        metadata = {},
    } = {}) {
        this.fromFrame = fromFrame;
        this.toFrame = toFrame;
        this.addedNodes = addedNodes;
        this.removedNodes = removedNodes;
        this.updatedNodes = updatedNodes;
        this.addedRelationships = addedRelationships;
        this.removedRelationships = removedRelationships;
        this.updatedRelationships = updatedRelationships;
        this.metadata = { ...metadata };
    }

    /**
     * Whether this diff contains zero structural changes.
     * @returns {boolean}
     */
    get isEmpty() {
        return (
            this.addedNodes.length === 0 &&
            this.removedNodes.length === 0 &&
            this.updatedNodes.length === 0 &&
            this.addedRelationships.length === 0 &&
            this.removedRelationships.length === 0 &&
            this.updatedRelationships.length === 0
        );
    }

    /**
     * Total count of all node and relationship modifications.
     * @returns {number}
     */
    get totalChanges() {
        return (
            this.addedNodes.length +
            this.removedNodes.length +
            this.updatedNodes.length +
            this.addedRelationships.length +
            this.removedRelationships.length +
            this.updatedRelationships.length
        );
    }

    /**
     * Find change record for a specific node ID.
     * @param {string} nodeId
     * @returns {{ status: 'added'|'removed'|'updated', record: any } | null}
     */
    getNodeChange(nodeId) {
        const added = this.addedNodes.find(n => n.id === nodeId);
        if (added) return { status: 'added', record: added };

        const removed = this.removedNodes.find(n => n.id === nodeId);
        if (removed) return { status: 'removed', record: removed };

        const updated = this.updatedNodes.find(u => u.node.id === nodeId);
        if (updated) return { status: 'updated', record: updated };

        return null;
    }

    /**
     * Pure static constructor: computes the structural diff between two SceneGraphs.
     *
     * Complexity: O(V + E) with stable Map keying.
     *
     * @param {SceneGraph|null} fromGraph - Preceding scene snapshot
     * @param {SceneGraph|null} toGraph - Succeeding scene snapshot
     * @param {object} [options={}]
     * @param {number} [options.fromFrame=null]
     * @param {number} [options.toFrame=null]
     * @param {object} [options.metadata={}]
     * @returns {SceneDiff} Deterministic structural diff
     */
    static compute(fromGraph, toGraph, options = {}) {
        const fromNodes = fromGraph instanceof SceneGraph ? fromGraph.nodes : {};
        const toNodes = toGraph instanceof SceneGraph ? toGraph.nodes : {};

        const fromRels = fromGraph instanceof SceneGraph ? fromGraph.relationships : [];
        const toRels = toGraph instanceof SceneGraph ? toGraph.relationships : [];

        // ─────────────────────────────────────────────────────────────────────
        // 1. Diff Nodes (O(V))
        // ─────────────────────────────────────────────────────────────────────
        const addedNodes = [];
        const removedNodes = [];
        const updatedNodes = [];

        const allNodeIds = new Set([...Object.keys(fromNodes), ...Object.keys(toNodes)]);
        const sortedNodeIds = Array.from(allNodeIds).sort();

        for (const id of sortedNodeIds) {
            const fromNode = fromNodes[id];
            const toNode = toNodes[id];

            if (!fromNode && toNode) {
                addedNodes.push(toNode.clone());
            } else if (fromNode && !toNode) {
                removedNodes.push(fromNode.clone());
            } else if (fromNode && toNode) {
                const changes = {};
                let hasChanges = false;

                // Value change
                if (JSON.stringify(fromNode.value) !== JSON.stringify(toNode.value)) {
                    changes.value = { from: fromNode.value, to: toNode.value };
                    hasChanges = true;
                }

                // Label change
                if (fromNode.label !== toNode.label) {
                    changes.label = { from: fromNode.label, to: toNode.label };
                    hasChanges = true;
                }

                // Transform change (spatial layout)
                if (JSON.stringify(fromNode.transform) !== JSON.stringify(toNode.transform)) {
                    changes.transform = { from: fromNode.transform, to: toNode.transform };
                    hasChanges = true;
                }

                // Style change
                if (JSON.stringify(fromNode.style) !== JSON.stringify(toNode.style)) {
                    changes.style = { from: fromNode.style, to: toNode.style };
                    hasChanges = true;
                }

                // Metadata change
                if (JSON.stringify(fromNode.metadata) !== JSON.stringify(toNode.metadata)) {
                    changes.metadata = { from: fromNode.metadata, to: toNode.metadata };
                    hasChanges = true;
                }

                // Children change
                if (JSON.stringify(fromNode.children) !== JSON.stringify(toNode.children)) {
                    changes.children = { from: [...fromNode.children], to: [...toNode.children] };
                    hasChanges = true;
                }

                if (hasChanges) {
                    updatedNodes.push({
                        node: toNode.clone(),
                        previousNode: fromNode.clone(),
                        changes,
                    });
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. Diff Relationships (O(E))
        // ─────────────────────────────────────────────────────────────────────
        const addedRelationships = [];
        const removedRelationships = [];
        const updatedRelationships = [];

        // Build slot-based lookup maps
        const fromSlotMap = new Map();
        for (const rel of fromRels) {
            const slotKey = getRelationshipKey(rel);
            fromSlotMap.set(slotKey, rel);
        }

        const toSlotMap = new Map();
        for (const rel of toRels) {
            const slotKey = getRelationshipKey(rel);
            toSlotMap.set(slotKey, rel);
        }

        const allSlotKeys = new Set([...fromSlotMap.keys(), ...toSlotMap.keys()]);
        const sortedSlotKeys = Array.from(allSlotKeys).sort();

        for (const slotKey of sortedSlotKeys) {
            const fromRel = fromSlotMap.get(slotKey);
            const toRel = toSlotMap.get(slotKey);

            if (!fromRel && toRel) {
                addedRelationships.push(toRel.clone());
            } else if (fromRel && !toRel) {
                removedRelationships.push(fromRel.clone());
            } else if (fromRel && toRel) {
                if (!fromRel.equals(toRel)) {
                    const changes = {};
                    let targetChanged = false;

                    if (fromRel.toId !== toRel.toId) {
                        changes.toId = { from: fromRel.toId, to: toRel.toId };
                        targetChanged = true;
                    }
                    if (fromRel.fromId !== toRel.fromId) {
                        changes.fromId = { from: fromRel.fromId, to: toRel.fromId };
                    }
                    if (fromRel.label !== toRel.label) {
                        changes.label = { from: fromRel.label, to: toRel.label };
                    }
                    if (JSON.stringify(fromRel.metadata) !== JSON.stringify(toRel.metadata)) {
                        changes.metadata = { from: fromRel.metadata, to: toRel.metadata };
                    }

                    updatedRelationships.push({
                        relationship: toRel.clone(),
                        previousRelationship: fromRel.clone(),
                        targetChanged,
                        changes,
                    });
                }
            }
        }

        // Deterministic relationship sorting
        const sortRel = (a, b) => {
            const idA = `${a.fromId}->${a.toId}:${a.type}:${a.label}`;
            const idB = `${b.fromId}->${b.toId}:${b.type}:${b.label}`;
            return idA.localeCompare(idB);
        };

        addedRelationships.sort(sortRel);
        removedRelationships.sort(sortRel);
        updatedRelationships.sort((a, b) => sortRel(a.relationship, b.relationship));

        return new SceneDiff({
            fromFrame: options.fromFrame ?? null,
            toFrame: options.toFrame ?? null,
            addedNodes,
            removedNodes,
            updatedNodes,
            addedRelationships,
            removedRelationships,
            updatedRelationships,
            metadata: options.metadata || {},
        });
    }

    toJSON() {
        return {
            fromFrame: this.fromFrame,
            toFrame: this.toFrame,
            addedNodes: this.addedNodes.map(n => n.toJSON()),
            removedNodes: this.removedNodes.map(n => n.toJSON()),
            updatedNodes: this.updatedNodes.map(u => ({
                node: u.node.toJSON(),
                previousNode: u.previousNode.toJSON(),
                changes: u.changes,
            })),
            addedRelationships: this.addedRelationships.map(r => r.toJSON()),
            removedRelationships: this.removedRelationships.map(r => r.toJSON()),
            updatedRelationships: this.updatedRelationships.map(u => ({
                relationship: u.relationship.toJSON(),
                previousRelationship: u.previousRelationship.toJSON(),
                targetChanged: u.targetChanged,
                changes: u.changes,
            })),
            metadata: this.metadata,
        };
    }
}
