import { EvidenceNode } from './EvidenceNode.js';
import { EvidenceEdge } from './EvidenceEdge.js';

export class EvidenceGraph {
  constructor() {
    this.nodes = new Map(); // id -> EvidenceNode
    this.outgoing = new Map(); // id -> Array of EvidenceEdge
    this.incoming = new Map(); // id -> Array of EvidenceEdge
  }

  addNode(node) {
    this.nodes.set(node.id, node);
    if (!this.outgoing.has(node.id)) this.outgoing.set(node.id, []);
    if (!this.incoming.has(node.id)) this.incoming.set(node.id, []);
    return this;
  }

  addEdge(edge) {
    if (!this.nodes.has(edge.from)) {
      this.addNode(new EvidenceNode({ id: edge.from, type: 'UNKNOWN' }));
    }
    if (!this.nodes.has(edge.to)) {
      this.addNode(new EvidenceNode({ id: edge.to, type: 'UNKNOWN' }));
    }

    this.outgoing.get(edge.from).push(edge);
    this.incoming.get(edge.to).push(edge);
    return this;
  }

  getNode(id) {
    return this.nodes.get(id) || null;
  }

  getOutgoingEdges(id) {
    return this.outgoing.get(id) || [];
  }

  getIncomingEdges(id) {
    return this.incoming.get(id) || [];
  }

  getSupportingNodes(id) {
    const inc = this.getIncomingEdges(id);
    return inc.filter(e => e.relation === 'SUPPORTS').map(e => this.getNode(e.from)).filter(Boolean);
  }

  getContradictingNodes(id) {
    const inc = this.getIncomingEdges(id);
    return inc.filter(e => e.relation === 'REFUTES').map(e => this.getNode(e.from)).filter(Boolean);
  }

  toJSON() {
    const allEdges = [];
    for (const edges of this.outgoing.values()) {
      for (const e of edges) allEdges.push(e.toJSON());
    }
    return {
      nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
      edges: allEdges
    };
  }
}
