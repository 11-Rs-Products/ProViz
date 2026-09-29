/**
 * ImpactGraph — Directed cycle-safe graph representing program entities and their impact dependencies.
 */

import { ImpactNode } from './ImpactNode.js';
import { ImpactEdge } from './ImpactEdge.js';

export class ImpactGraph {
    /**
     * @param {object} [params]
     * @param {Array<ImpactNode|object>} [params.nodes=[]]
     * @param {Array<ImpactEdge|object>} [params.edges=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        nodes = [],
        edges = [],
        metadata = {},
    } = {}) {
        this._nodes = new Map();
        this._outgoing = new Map();
        this._incoming = new Map();
        this.metadata = Object.freeze({ ...metadata });

        for (const n of nodes) {
            this.addNode(n);
        }
        for (const e of edges) {
            this.addEdge(e);
        }
    }

    addNode(node) {
        const n = node instanceof ImpactNode ? node : ImpactNode.fromJSON(node);
        if (!n || !n.id) return this;
        this._nodes.set(n.id, n);
        if (!this._outgoing.has(n.id)) this._outgoing.set(n.id, []);
        if (!this._incoming.has(n.id)) this._incoming.set(n.id, []);
        return this;
    }

    addEdge(edge) {
        const e = edge instanceof ImpactEdge ? edge : ImpactEdge.fromJSON(edge);
        if (!e) return this;

        // Auto-create missing nodes if needed
        if (!this._nodes.has(e.fromId)) {
            this.addNode(new ImpactNode({ id: e.fromId }));
        }
        if (!this._nodes.has(e.toId)) {
            this.addNode(new ImpactNode({ id: e.toId }));
        }

        const outList = this._outgoing.get(e.fromId);
        if (!outList.some(existing => existing.toId === e.toId && existing.kind === e.kind)) {
            outList.push(e);
        }

        const inList = this._incoming.get(e.toId);
        if (!inList.some(existing => existing.fromId === e.fromId && existing.kind === e.kind)) {
            inList.push(e);
        }

        return this;
    }

    getNode(id) {
        return this._nodes.get(String(id)) || null;
    }

    hasNode(id) {
        return this._nodes.has(String(id));
    }

    getAllNodes() {
        return Array.from(this._nodes.values());
    }

    getAllEdges() {
        const edges = [];
        for (const list of this._outgoing.values()) {
            edges.push(...list);
        }
        return edges;
    }

    getOutgoingEdges(nodeId) {
        return this._outgoing.get(String(nodeId)) || [];
    }

    getIncomingEdges(nodeId) {
        return this._incoming.get(String(nodeId)) || [];
    }

    get nodeCount() {
        return this._nodes.size;
    }

    get edgeCount() {
        let count = 0;
        for (const list of this._outgoing.values()) count += list.length;
        return count;
    }

    clone() {
        return new ImpactGraph({
            nodes: this.getAllNodes(),
            edges: this.getAllEdges(),
            metadata: this.metadata,
        });
    }

    toJSON() {
        return {
            nodes: this.getAllNodes().map(n => n.toJSON()),
            edges: this.getAllEdges().map(e => e.toJSON()),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ImpactGraph({
            nodes: (json.nodes || []).map(n => ImpactNode.fromJSON(n)),
            edges: (json.edges || []).map(e => ImpactEdge.fromJSON(e)),
            metadata: json.metadata,
        });
    }
}
