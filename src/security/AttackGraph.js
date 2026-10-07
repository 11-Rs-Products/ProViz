/**
 * AttackGraph.js
 * Adversarial graph built over the semantic program model and threat boundaries.
 */

export class AttackNode {
  constructor({ id, type = 'STATE', targetSemanticId = '', attributes = {} }) {
    if (!id) throw new Error('AttackNode requires id');
    this.id = id;
    this.type = type;
    this.targetSemanticId = targetSemanticId;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      targetSemanticId: this.targetSemanticId,
      attributes: { ...this.attributes }
    };
  }
}

export class AttackEdge {
  constructor({ id, source, target, action = 'FLOW', cost = 1.0, probability = 0.8, attributes = {} }) {
    if (!id || !source || !target) throw new Error('AttackEdge requires id, source, and target');
    this.id = id;
    this.source = source;
    this.target = target;
    this.action = action;
    this.cost = cost;
    this.probability = probability;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      source: this.source,
      target: this.target,
      action: this.action,
      cost: this.cost,
      probability: this.probability,
      attributes: { ...this.attributes }
    };
  }
}

export class AttackGraph {
  constructor({ nodes = [], edges = [] } = {}) {
    this._nodes = new Map();
    this._edges = new Map();
    this._outgoing = new Map();
    this._incoming = new Map();

    for (const n of nodes) this.addNode(n instanceof AttackNode ? n : new AttackNode(n));
    for (const e of edges) this.addEdge(e instanceof AttackEdge ? e : new AttackEdge(e));
  }

  addNode(node) {
    const n = node instanceof AttackNode ? node : new AttackNode(node);
    this._nodes.set(n.id, n);
    if (!this._outgoing.has(n.id)) this._outgoing.set(n.id, []);
    if (!this._incoming.has(n.id)) this._incoming.set(n.id, []);
    return this;
  }

  getNode(id) {
    return this._nodes.get(id) || null;
  }

  getNodes() {
    return Array.from(this._nodes.values());
  }

  addEdge(edge) {
    const e = edge instanceof AttackEdge ? edge : new AttackEdge(edge);
    this._edges.set(e.id, e);
    if (!this._nodes.has(e.source)) this.addNode(new AttackNode({ id: e.source }));
    if (!this._nodes.has(e.target)) this.addNode(new AttackNode({ id: e.target }));

    this._outgoing.get(e.source).push(e);
    this._incoming.get(e.target).push(e);
    return this;
  }

  getEdge(id) {
    return this._edges.get(id) || null;
  }

  getEdges() {
    return Array.from(this._edges.values());
  }

  getOutgoingEdges(nodeId) {
    return this._outgoing.get(nodeId) || [];
  }

  getIncomingEdges(nodeId) {
    return this._incoming.get(nodeId) || [];
  }

  nodeCount() {
    return this._nodes.size;
  }

  edgeCount() {
    return this._edges.size;
  }

  toJSON() {
    return {
      nodes: this.getNodes().map(n => n.toJSON()),
      edges: this.getEdges().map(e => e.toJSON())
    };
  }

  static fromJSON(json) {
    return new AttackGraph({
      nodes: (json.nodes || []).map(n => new AttackNode(n)),
      edges: (json.edges || []).map(e => new AttackEdge(e))
    });
  }
}
