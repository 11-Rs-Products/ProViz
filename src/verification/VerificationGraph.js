/**
 * VerificationGraph — Directed semantic graph connecting findings, properties, CFG, SSA, dataflow, and runtime observations.
 */

import { VerificationNode } from './VerificationNode.js';
import { VerificationEdge } from './VerificationEdge.js';

export class VerificationGraph {
    constructor() {
        this._nodes = new Map();
        this._edges = new Map();
        this._outgoing = new Map();
        this._incoming = new Map();
    }

    addNode(node) {
        if (!(node instanceof VerificationNode)) {
            throw new Error('Expected instance of VerificationNode');
        }
        this._nodes.set(node.id, node);
        if (!this._outgoing.has(node.id)) this._outgoing.set(node.id, []);
        if (!this._incoming.has(node.id)) this._incoming.set(node.id, []);
        return node;
    }

    getNode(id) {
        return this._nodes.get(id) || null;
    }

    getNodes() {
        return Array.from(this._nodes.values()).sort((a, b) => a.id.localeCompare(b.id));
    }

    addEdge(edge) {
        if (!(edge instanceof VerificationEdge)) {
            throw new Error('Expected instance of VerificationEdge');
        }
        this._edges.set(edge.id, edge);

        if (!this._outgoing.has(edge.from)) this._outgoing.set(edge.from, []);
        this._outgoing.get(edge.from).push(edge);

        if (!this._incoming.has(edge.to)) this._incoming.set(edge.to, []);
        this._incoming.get(edge.to).push(edge);

        return edge;
    }

    getEdges() {
        return Array.from(this._edges.values()).sort((a, b) => a.id.localeCompare(b.id));
    }

    getIncoming(nodeId) {
        return this._incoming.get(nodeId) || [];
    }

    getOutgoing(nodeId) {
        return this._outgoing.get(nodeId) || [];
    }

    findPath(fromId, toId, maxDepth = 20) {
        if (fromId === toId) return { found: true, path: [fromId], edges: [] };

        const queue = [{ current: fromId, path: [fromId], edges: [] }];
        const visited = new Set([fromId]);

        while (queue.length > 0) {
            const { current, path, edges } = queue.shift();
            if (path.length > maxDepth) continue;

            const outgoing = this.getOutgoing(current);
            for (const edge of outgoing) {
                if (edge.to === toId) {
                    return {
                        found: true,
                        path: [...path, edge.to],
                        edges: [...edges, edge],
                    };
                }
                if (!visited.has(edge.to)) {
                    visited.add(edge.to);
                    queue.push({
                        current: edge.to,
                        path: [...path, edge.to],
                        edges: [...edges, edge],
                    });
                }
            }
        }

        return { found: false, path: [], edges: [] };
    }

    toJSON() {
        return {
            nodes: this.getNodes().map(n => n.toJSON()),
            edges: this.getEdges().map(e => e.toJSON()),
        };
    }

    static fromJSON(json) {
        const graph = new VerificationGraph();
        if (!json) return graph;
        for (const n of json.nodes || []) {
            graph.addNode(VerificationNode.fromJSON(n));
        }
        for (const e of json.edges || []) {
            graph.addEdge(VerificationEdge.fromJSON(e));
        }
        return graph;
    }
}
