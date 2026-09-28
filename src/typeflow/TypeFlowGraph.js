/**
 * TypeFlowGraph — Canonical container and query interface for the Type & Value Flow Graph.
 */

import { TypeFlowNode } from './TypeFlowNode.js';
import { TypeFlowEdge } from './TypeFlowEdge.js';

export class TypeFlowGraph {
    constructor({ functionId = '<module>', moduleId = 'main', fileId = 'main.py' } = {}) {
        this.functionId = functionId;
        this.moduleId = moduleId;
        this.fileId = fileId;

        this.nodes = new Map(); // id -> TypeFlowNode
        this.edges = new Map(); // id -> TypeFlowEdge
        this.incomingEdges = new Map(); // nodeId -> Set<edgeId>
        this.outgoingEdges = new Map(); // nodeId -> Set<edgeId>
    }

    addNode(node) {
        if (!node || !node.id) return node;
        const tfn = node instanceof TypeFlowNode ? node : new TypeFlowNode(node);
        this.nodes.set(tfn.id, tfn);
        if (!this.incomingEdges.has(tfn.id)) this.incomingEdges.set(tfn.id, new Set());
        if (!this.outgoingEdges.has(tfn.id)) this.outgoingEdges.set(tfn.id, new Set());
        return tfn;
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

    addEdge(edge) {
        if (!edge || !edge.fromId || !edge.toId) return edge;
        const tfe = edge instanceof TypeFlowEdge ? edge : new TypeFlowEdge(edge);
        this.edges.set(tfe.id, tfe);

        if (!this.incomingEdges.has(tfe.toId)) this.incomingEdges.set(tfe.toId, new Set());
        if (!this.outgoingEdges.has(tfe.fromId)) this.outgoingEdges.set(tfe.fromId, new Set());

        this.incomingEdges.get(tfe.toId).add(tfe.id);
        this.outgoingEdges.get(tfe.fromId).add(tfe.id);
        return tfe;
    }

    getEdge(id) {
        return this.edges.get(id) || null;
    }

    getEdges() {
        return Array.from(this.edges.values());
    }

    getIncoming(nodeId) {
        const edgeIds = this.incomingEdges.get(nodeId);
        if (!edgeIds) return [];
        return Array.from(edgeIds).map(id => this.getEdge(id)).filter(Boolean);
    }

    getOutgoing(nodeId) {
        const edgeIds = this.outgoingEdges.get(nodeId);
        if (!edgeIds) return [];
        return Array.from(edgeIds).map(id => this.getEdge(id)).filter(Boolean);
    }

    findPath(fromId, toId, { maxDepth = 32 } = {}) {
        if (!this.hasNode(fromId) || !this.hasNode(toId)) return { found: false, nodes: [], edges: [] };
        if (fromId === toId) return { found: true, nodes: [this.getNode(fromId)], edges: [] };

        const queue = [{ nodeId: fromId, pathNodes: [fromId], pathEdges: [] }];
        const visited = new Set([fromId]);

        while (queue.length > 0) {
            const cur = queue.shift();
            if (cur.pathNodes.length > maxDepth) continue;

            for (const edge of this.getOutgoing(cur.nodeId)) {
                if (edge.toId === toId) {
                    const nodes = [...cur.pathNodes, edge.toId].map(id => this.getNode(id)).filter(Boolean);
                    const edges = [...cur.pathEdges, edge.id].map(id => this.getEdge(id)).filter(Boolean);
                    return { found: true, nodes, edges };
                }
                if (!visited.has(edge.toId)) {
                    visited.add(edge.toId);
                    queue.push({
                        nodeId: edge.toId,
                        pathNodes: [...cur.pathNodes, edge.toId],
                        pathEdges: [...cur.pathEdges, edge.id],
                    });
                }
            }
        }
        return { found: false, nodes: [], edges: [] };
    }

    toJSON() {
        return {
            functionId: this.functionId,
            moduleId: this.moduleId,
            fileId: this.fileId,
            nodes: this.getNodes().map(n => n.toJSON()),
            edges: this.getEdges().map(e => e.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        const graph = new TypeFlowGraph(json);
        for (const n of json.nodes || []) graph.addNode(TypeFlowNode.fromJSON(n));
        for (const e of json.edges || []) graph.addEdge(TypeFlowEdge.fromJSON(e));
        return graph;
    }
}
