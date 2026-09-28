/**
 * DataflowGraph — Canonical container and index for the Program Dependency Graph (PDG).
 *
 * Guaranteed Properties:
 *  1. Deterministic & Derived: Pure semantic layer constructed from execution traces.
 *  2. Indexed: Fast O(1) / O(log N) lookup for variables, objects, frames, definitions, uses, aliases, mutations.
 *  3. Bounded Traversal: Path-finding and dependency queries are cycle-safe and respect depth/node limits.
 *  4. Serializable: Complete round-trip to/from JSON.
 */

import { DataflowNode } from './DataflowNode.js';
import { DataflowEdge, DATAFLOW_EDGE_TYPES } from './DataflowEdge.js';
import { Definition } from './Definition.js';
import { Use } from './Use.js';
import { AliasSet } from './AliasSet.js';
import { MutationRecord } from './MutationRecord.js';

export class DataflowGraph {
    constructor() {
        this.nodes = new Map(); // id -> DataflowNode
        this.edges = new Map(); // id -> DataflowEdge

        this.incomingEdges = new Map(); // nodeId -> Set<edgeId>
        this.outgoingEdges = new Map(); // nodeId -> Set<edgeId>

        this.definitions = new Map(); // defId -> Definition
        this.uses = new Map(); // useId -> Use
        this.aliasSets = new Map(); // objectId -> AliasSet
        this.mutations = []; // Array<MutationRecord>

        // Secondary query indexes
        this.definitionsByVar = new Map(); // varName -> Definition[]
        this.definitionsByFrame = new Map(); // frameIndex -> Definition[]
        this.usesByVar = new Map(); // varName -> Use[]
        this.usesByFrame = new Map(); // frameIndex -> Use[]
        this.mutationsByObject = new Map(); // objectId -> MutationRecord[]
        this.mutationsByFrame = new Map(); // frameIndex -> MutationRecord[]
        this.nodesByVariable = new Map(); // varName -> DataflowNode[]
        this.nodesByObject = new Map(); // objectId -> DataflowNode[]
        this.nodesByFrame = new Map(); // frameIndex -> DataflowNode[]
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Node Management
    // ─────────────────────────────────────────────────────────────────────────────

    addNode(node) {
        if (!node || !node.id) return node;
        const dfNode = node instanceof DataflowNode ? node : new DataflowNode(node);
        this.nodes.set(dfNode.id, dfNode);

        if (!this.incomingEdges.has(dfNode.id)) this.incomingEdges.set(dfNode.id, new Set());
        if (!this.outgoingEdges.has(dfNode.id)) this.outgoingEdges.set(dfNode.id, new Set());

        if (dfNode.variableId) {
            if (!this.nodesByVariable.has(dfNode.variableId)) this.nodesByVariable.set(dfNode.variableId, []);
            this.nodesByVariable.get(dfNode.variableId).push(dfNode);
        }

        if (dfNode.objectId) {
            if (!this.nodesByObject.has(dfNode.objectId)) this.nodesByObject.set(dfNode.objectId, []);
            this.nodesByObject.get(dfNode.objectId).push(dfNode);
        }

        if (typeof dfNode.frameIndex === 'number') {
            if (!this.nodesByFrame.has(dfNode.frameIndex)) this.nodesByFrame.set(dfNode.frameIndex, []);
            this.nodesByFrame.get(dfNode.frameIndex).push(dfNode);
        }

        return dfNode;
    }

    getNode(id) {
        return this.nodes.get(id) || null;
    }

    hasNode(id) {
        return this.nodes.has(id);
    }

    getNodes() {
        return Array.from(this.nodes.values());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Edge Management
    // ─────────────────────────────────────────────────────────────────────────────

    addEdge(edge) {
        if (!edge) return null;
        const dfEdge = edge instanceof DataflowEdge ? edge : new DataflowEdge(edge);
        this.edges.set(dfEdge.id, dfEdge);

        if (!this.outgoingEdges.has(dfEdge.fromId)) this.outgoingEdges.set(dfEdge.fromId, new Set());
        if (!this.incomingEdges.has(dfEdge.toId)) this.incomingEdges.set(dfEdge.toId, new Set());

        this.outgoingEdges.get(dfEdge.fromId).add(dfEdge.id);
        this.incomingEdges.get(dfEdge.toId).add(dfEdge.id);

        return dfEdge;
    }

    getEdge(id) {
        return this.edges.get(id) || null;
    }

    hasEdge(id) {
        return this.edges.has(id);
    }

    getEdges() {
        return Array.from(this.edges.values());
    }

    getIncoming(nodeId) {
        const edgeIds = this.incomingEdges.get(nodeId);
        if (!edgeIds) return [];
        return Array.from(edgeIds).map(id => this.edges.get(id)).filter(Boolean);
    }

    getOutgoing(nodeId) {
        const edgeIds = this.outgoingEdges.get(nodeId);
        if (!edgeIds) return [];
        return Array.from(edgeIds).map(id => this.edges.get(id)).filter(Boolean);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Definitions & Uses Management
    // ─────────────────────────────────────────────────────────────────────────────

    addDefinition(def) {
        const d = def instanceof Definition ? def : new Definition(def);
        this.definitions.set(d.id, d);

        if (!this.definitionsByVar.has(d.variableName)) this.definitionsByVar.set(d.variableName, []);
        this.definitionsByVar.get(d.variableName).push(d);

        if (!this.definitionsByFrame.has(d.frameIndex)) this.definitionsByFrame.set(d.frameIndex, []);
        this.definitionsByFrame.get(d.frameIndex).push(d);

        return d;
    }

    getDefinition(id) {
        return this.definitions.get(id) || null;
    }

    getDefinitions(varName = null, frameIndex = null) {
        if (varName && frameIndex !== null) {
            const list = this.definitionsByVar.get(varName) || [];
            return list.filter(d => d.frameIndex <= frameIndex);
        }
        if (varName) {
            return this.definitionsByVar.get(varName) || [];
        }
        if (frameIndex !== null) {
            return Array.from(this.definitions.values()).filter(d => d.frameIndex <= frameIndex);
        }
        return Array.from(this.definitions.values());
    }

    addUse(use) {
        const u = use instanceof Use ? use : new Use(use);
        this.uses.set(u.id, u);

        if (!this.usesByVar.has(u.variableName)) this.usesByVar.set(u.variableName, []);
        this.usesByVar.get(u.variableName).push(u);

        if (!this.usesByFrame.has(u.frameIndex)) this.usesByFrame.set(u.frameIndex, []);
        this.usesByFrame.get(u.frameIndex).push(u);

        return u;
    }

    getUse(id) {
        return this.uses.get(id) || null;
    }

    getUses(varName = null, frameIndex = null) {
        if (varName && frameIndex !== null) {
            const list = this.usesByVar.get(varName) || [];
            return list.filter(u => u.frameIndex <= frameIndex);
        }
        if (varName) {
            return this.usesByVar.get(varName) || [];
        }
        if (frameIndex !== null) {
            return Array.from(this.uses.values()).filter(u => u.frameIndex <= frameIndex);
        }
        return Array.from(this.uses.values());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Aliases & Mutations
    // ─────────────────────────────────────────────────────────────────────────────

    addAlias(objectId, variableName, frameIndex = 0, scopeId = 'local', fileId = 'main.py') {
        if (!this.aliasSets.has(objectId)) {
            this.aliasSets.set(objectId, new AliasSet({ objectId, firstSeenFrame: frameIndex }));
        }
        const aliasSet = this.aliasSets.get(objectId);
        aliasSet.addAlias(variableName, frameIndex, scopeId, fileId);
        return aliasSet;
    }

    getAliasSet(objectId) {
        return this.aliasSets.get(objectId) || null;
    }

    getAliases(objectId, frameIndex = null) {
        const aliasSet = this.aliasSets.get(objectId);
        if (!aliasSet) return [];
        return aliasSet.getVariables(frameIndex);
    }

    addMutation(mutation) {
        const m = mutation instanceof MutationRecord ? mutation : new MutationRecord(mutation);
        this.mutations.push(m);

        if (!this.mutationsByObject.has(m.objectId)) this.mutationsByObject.set(m.objectId, []);
        this.mutationsByObject.get(m.objectId).push(m);

        if (!this.mutationsByFrame.has(m.frameIndex)) this.mutationsByFrame.set(m.frameIndex, []);
        this.mutationsByFrame.get(m.frameIndex).push(m);

        return m;
    }

    getMutations(objectId = null, { fromFrame = 0, toFrame = Infinity } = {}) {
        let list = [];
        if (objectId) {
            list = this.mutationsByObject.get(objectId) || [];
        } else {
            list = this.mutations;
        }
        return list.filter(m => m.frameIndex >= fromFrame && m.frameIndex <= toFrame);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Graph Pathfinding & Traversal
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Finds the shortest semantic data path from source node to target node.
     *
     * @param {string} fromId - Starting node ID
     * @param {string} toId - Target node ID
     * @param {object} [limits]
     * @param {number} [limits.maxDepth=32]
     * @param {number} [limits.timeoutMs=200]
     * @returns {{ found: boolean, nodes: DataflowNode[], edges: DataflowEdge[], sourceLocations: object[], frameRange: object }}
     */
    findPath(fromId, toId, { maxDepth = 32, timeoutMs = 200 } = {}) {
        const startMs = performance.now();
        if (!this.hasNode(fromId) || !this.hasNode(toId)) {
            return { found: false, nodes: [], edges: [], sourceLocations: [], frameRange: { min: 0, max: 0 } };
        }

        if (fromId === toId) {
            const node = this.getNode(fromId);
            return {
                found: true,
                nodes: [node],
                edges: [],
                sourceLocations: node.sourceLocation ? [node.sourceLocation] : [],
                frameRange: { min: node.frameIndex || 0, max: node.frameIndex || 0 },
            };
        }

        // BFS with cycle prevention
        const queue = [{ nodeId: fromId, pathNodes: [fromId], pathEdges: [] }];
        const visited = new Set([fromId]);

        while (queue.length > 0) {
            if (performance.now() - startMs > timeoutMs) break;
            const current = queue.shift();

            if (current.pathNodes.length > maxDepth) continue;

            const outgoing = this.getOutgoing(current.nodeId);
            for (const edge of outgoing) {
                const nextId = edge.toId;
                if (nextId === toId) {
                    const finalNodeIds = [...current.pathNodes, nextId];
                    const finalEdgeIds = [...current.pathEdges, edge.id];
                    const nodes = finalNodeIds.map(id => this.getNode(id)).filter(Boolean);
                    const edges = finalEdgeIds.map(id => this.getEdge(id)).filter(Boolean);
                    const sourceLocations = nodes.map(n => n.sourceLocation).filter(Boolean);
                    const frameIndices = nodes.map(n => n.frameIndex).filter(f => typeof f === 'number');

                    return {
                        found: true,
                        nodes,
                        edges,
                        sourceLocations,
                        frameRange: {
                            min: frameIndices.length ? Math.min(...frameIndices) : 0,
                            max: frameIndices.length ? Math.max(...frameIndices) : 0,
                        },
                    };
                }

                if (!visited.has(nextId)) {
                    visited.add(nextId);
                    queue.push({
                        nodeId: nextId,
                        pathNodes: [...current.pathNodes, nextId],
                        pathEdges: [...current.pathEdges, edge.id],
                    });
                }
            }
        }

        return { found: false, nodes: [], edges: [], sourceLocations: [], frameRange: { min: 0, max: 0 } };
    }

    /**
     * Backward dependency traversal (what does this node depend on?)
     *
     * @param {string} nodeId
     * @param {object} [options]
     * @param {number} [options.maxDepth=16]
     * @param {number} [options.maxNodes=256]
     * @returns {DataflowNode[]}
     */
    getDependencies(nodeId, { maxDepth = 16, maxNodes = 256 } = {}) {
        const results = [];
        const visited = new Set([nodeId]);
        const queue = [{ id: nodeId, depth: 0 }];

        while (queue.length > 0) {
            const { id, depth } = queue.shift();
            if (depth >= maxDepth || results.length >= maxNodes) continue;

            const incoming = this.getIncoming(id);
            for (const edge of incoming) {
                const producerId = edge.fromId;
                if (!visited.has(producerId)) {
                    visited.add(producerId);
                    const node = this.getNode(producerId);
                    if (node) {
                        results.push(node);
                        queue.push({ id: producerId, depth: depth + 1 });
                    }
                }
            }
        }

        return results;
    }

    /**
     * Forward dependency traversal (what depends on this node?)
     *
     * @param {string} nodeId
     * @param {object} [options]
     * @param {number} [options.maxDepth=16]
     * @param {number} [options.maxNodes=256]
     * @returns {DataflowNode[]}
     */
    getDependents(nodeId, { maxDepth = 16, maxNodes = 256 } = {}) {
        const results = [];
        const visited = new Set([nodeId]);
        const queue = [{ id: nodeId, depth: 0 }];

        while (queue.length > 0) {
            const { id, depth } = queue.shift();
            if (depth >= maxDepth || results.length >= maxNodes) continue;

            const outgoing = this.getOutgoing(id);
            for (const edge of outgoing) {
                const consumerId = edge.toId;
                if (!visited.has(consumerId)) {
                    visited.add(consumerId);
                    const node = this.getNode(consumerId);
                    if (node) {
                        results.push(node);
                        queue.push({ id: consumerId, depth: depth + 1 });
                    }
                }
            }
        }

        return results;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Serialization
    // ─────────────────────────────────────────────────────────────────────────────

    toJSON() {
        return {
            nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
            edges: Array.from(this.edges.values()).map(e => e.toJSON()),
            definitions: Array.from(this.definitions.values()).map(d => d.toJSON()),
            uses: Array.from(this.uses.values()).map(u => u.toJSON()),
            aliasSets: Array.from(this.aliasSets.values()).map(a => a.toJSON()),
            mutations: this.mutations.map(m => m.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        const graph = new DataflowGraph();

        if (Array.isArray(json.nodes)) {
            json.nodes.forEach(n => graph.addNode(DataflowNode.fromJSON(n)));
        }
        if (Array.isArray(json.edges)) {
            json.edges.forEach(e => graph.addEdge(DataflowEdge.fromJSON(e)));
        }
        if (Array.isArray(json.definitions)) {
            json.definitions.forEach(d => graph.addDefinition(Definition.fromJSON(d)));
        }
        if (Array.isArray(json.uses)) {
            json.uses.forEach(u => graph.addUse(Use.fromJSON(u)));
        }
        if (Array.isArray(json.aliasSets)) {
            json.aliasSets.forEach(a => {
                const set = AliasSet.fromJSON(a);
                if (set) graph.aliasSets.set(set.objectId, set);
            });
        }
        if (Array.isArray(json.mutations)) {
            json.mutations.forEach(m => graph.addMutation(MutationRecord.fromJSON(m)));
        }

        return graph;
    }
}
