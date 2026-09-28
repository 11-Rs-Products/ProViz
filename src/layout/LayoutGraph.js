/**
 * LayoutGraph — Intermediate graph optimized for spatial analysis and topology detection.
 *
 * Preserves SceneGraph semantic identity while providing fast topological querying
 * (depths, connected components, cycles, parent-child hierarchies).
 */

import { LayoutNode } from './LayoutNode.js';
import { SceneGraph } from '../scene/SceneGraph.js';
import { NODE_TYPES } from '../scene/SceneNode.js';
import { RELATIONSHIP_TYPES } from '../scene/SceneRelationship.js';

export class LayoutGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.adjacency = new Map();
        this.inbound = new Map();
        this.children = new Map();
        this.parents = new Map();
    }

    addNode(node) {
        if (!node || !node.id) return null;
        const lNode = node instanceof LayoutNode ? node : new LayoutNode(node);
        this.nodes.set(lNode.id, lNode);
        if (!this.adjacency.has(lNode.id)) this.adjacency.set(lNode.id, new Set());
        if (!this.inbound.has(lNode.id)) this.inbound.set(lNode.id, new Set());
        if (!this.children.has(lNode.id)) this.children.set(lNode.id, []);
        return lNode;
    }

    getNode(id) {
        return this.nodes.get(id) || null;
    }

    hasNode(id) {
        return this.nodes.has(id);
    }

    getAllNodes() {
        const sortedIds = Array.from(this.nodes.keys()).sort();
        return sortedIds.map(id => this.nodes.get(id));
    }

    addEdge(edge) {
        if (!edge || !edge.fromId || !edge.toId) return;
        this.edges.push({
            fromId: edge.fromId,
            toId: edge.toId,
            type: edge.type || 'references',
            label: edge.label || '',
            metadata: { ...(edge.metadata || {}) },
        });

        if (!this.adjacency.has(edge.fromId)) this.adjacency.set(edge.fromId, new Set());
        if (!this.inbound.has(edge.toId)) this.inbound.set(edge.toId, new Set());
        if (!this.children.has(edge.fromId)) this.children.set(edge.fromId, []);

        this.adjacency.get(edge.fromId).add(edge.toId);
        this.inbound.get(edge.toId).add(edge.fromId);

        if (edge.type === RELATIONSHIP_TYPES.CONTAINS || edge.type === 'owns') {
            this.children.get(edge.fromId).push(edge.toId);
            this.parents.set(edge.toId, edge.fromId);
        }
    }

    getNeighbors(id) {
        const outSet = this.adjacency.get(id) || new Set();
        const inSet = this.inbound.get(id) || new Set();
        return new Set([...outSet, ...inSet]);
    }

    getChildren(id) {
        return this.children.get(id) || [];
    }

    getParents(id) {
        const p = this.parents.get(id);
        return p ? [p] : [];
    }

    getOutboundEdges(fromId) {
        return this.edges.filter(e => e.fromId === fromId);
    }

    getInboundEdges(toId) {
        return this.edges.filter(e => e.toId === toId);
    }

    /**
     * Compute hierarchy depth from root nodes with cycle protection.
     * @param {string} id
     * @returns {number}
     */
    getDepth(id) {
        let depth = 0;
        let curr = id;
        const visited = new Set([curr]);

        while (curr) {
            const parent = this.parents.get(curr);
            if (!parent || visited.has(parent)) break;
            visited.add(parent);
            depth++;
            curr = parent;
        }

        return depth;
    }

    /**
     * Compute connected components deterministically.
     * @returns {Array<string[]>} List of connected component node ID arrays (sorted)
     */
    getConnectedComponents() {
        const visited = new Set();
        const components = [];
        const allIds = Array.from(this.nodes.keys()).sort();

        for (const rootId of allIds) {
            if (visited.has(rootId)) continue;

            const component = [];
            const queue = [rootId];
            visited.add(rootId);

            while (queue.length > 0) {
                const curr = queue.shift();
                component.push(curr);

                const neighbors = Array.from(this.getNeighbors(curr)).sort();
                for (const n of neighbors) {
                    if (!visited.has(n)) {
                        visited.add(n);
                        queue.push(n);
                    }
                }
            }

            component.sort();
            components.push(component);
        }

        return components;
    }

    /**
     * Pure factory: converts a SceneGraph into a LayoutGraph.
     *
     * @param {SceneGraph} sceneGraph
     * @param {object} [config={}]
     * @returns {LayoutGraph}
     */
    static fromSceneGraph(sceneGraph, config = {}) {
        const layoutGraph = new LayoutGraph();
        if (!(sceneGraph instanceof SceneGraph)) {
            return layoutGraph;
        }

        const sceneNodes = sceneGraph.getAllNodes();
        for (const sNode of sceneNodes) {
            let layer = 'heap';
            let region = 'Heap';

            if (sNode.type === NODE_TYPES.CALL_FRAME) {
                layer = 'stack';
                region = 'CallStack';
            } else if (sNode.type === NODE_TYPES.VARIABLE) {
                if (sNode.metadata?.scope === 'global') {
                    layer = 'globals';
                    region = 'Globals';
                } else {
                    layer = 'stack';
                    region = 'CallStack';
                }
            }

            layoutGraph.addNode(new LayoutNode({
                id: sNode.id,
                position: { ...sNode.transform.position },
                rotation: { ...sNode.transform.rotation },
                scale: { ...sNode.transform.scale },
                size: { x: 2.4, y: 1.2, z: 1.0 },
                layer,
                region,
                metadata: {
                    type: sNode.type,
                    semanticId: sNode.semanticId,
                    label: sNode.label,
                    scope: sNode.metadata?.scope,
                    varName: sNode.metadata?.varName,
                    depth: sNode.metadata?.depth ?? 0,
                    valueType: sNode.metadata?.type,
                },
            }));
        }

        for (const rel of sceneGraph.getRelationships()) {
            layoutGraph.addEdge(rel);
        }

        // Update hierarchy depths
        for (const lNode of layoutGraph.nodes.values()) {
            lNode.depth = layoutGraph.getDepth(lNode.id);
        }

        return layoutGraph;
    }
}
