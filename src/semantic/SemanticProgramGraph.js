/**
 * SemanticProgramGraph.js
 * Central graph combining AST, CFG, SSA, PDG, Call Graph, Type Graph, Heap Graph,
 * and Verification artifacts into a unified, indexed, queryable semantic model.
 */

import { SemanticNode } from './SemanticNode.js';
import { SemanticEdge } from './SemanticEdge.js';

export class SemanticProgramGraph {
  constructor() {
    this._nodes = new Map(); // id -> SemanticNode
    this._edges = new Map(); // id -> SemanticEdge

    // Adjacency
    this._outgoing = new Map(); // nodeId -> Set of edgeId
    this._incoming = new Map(); // nodeId -> Set of edgeId

    // Multi-index
    this._kindIndex = new Map(); // kind -> Set of nodeId
    this._fileIndex = new Map(); // file -> Set of nodeId
    this._scopeIndex = new Map(); // scopeId -> Set of nodeId
    this._nameIndex = new Map(); // name -> Set of nodeId
    this._relationIndex = new Map(); // relation -> Set of edgeId
  }

  get nodeCount() {
    return this._nodes.size;
  }

  get edgeCount() {
    return this._edges.size;
  }

  addNode(node) {
    if (!(node instanceof SemanticNode)) {
      node = new SemanticNode(node);
    }
    const existing = this._nodes.get(node.id);
    if (existing) {
      this._unindexNode(existing);
    }

    this._nodes.set(node.id, node);
    if (!this._outgoing.has(node.id)) this._outgoing.set(node.id, new Set());
    if (!this._incoming.has(node.id)) this._incoming.set(node.id, new Set());

    this._indexNode(node);
    return this;
  }

  getNode(id) {
    return this._nodes.get(id) || null;
  }

  hasNode(id) {
    return this._nodes.has(id);
  }

  removeNode(id) {
    const node = this._nodes.get(id);
    if (!node) return false;

    // Remove connected edges
    const outEdges = this.getOutgoingEdges(id);
    for (const e of outEdges) this.removeEdge(e.id);
    const inEdges = this.getIncomingEdges(id);
    for (const e of inEdges) this.removeEdge(e.id);

    this._outgoing.delete(id);
    this._incoming.delete(id);
    this._unindexNode(node);
    this._nodes.delete(id);
    return true;
  }

  addEdge(edge) {
    if (!(edge instanceof SemanticEdge)) {
      edge = new SemanticEdge(edge);
    }
    if (!this._nodes.has(edge.sourceId) || !this._nodes.has(edge.targetId)) {
      throw new Error(`Cannot add edge ${edge.id}: source (${edge.sourceId}) or target (${edge.targetId}) node does not exist`);
    }

    const existing = this._edges.get(edge.id);
    if (existing) {
      this._unindexEdge(existing);
    }

    this._edges.set(edge.id, edge);
    this._outgoing.get(edge.sourceId).add(edge.id);
    this._incoming.get(edge.targetId).add(edge.id);

    this._indexEdge(edge);
    return this;
  }

  getEdge(id) {
    return this._edges.get(id) || null;
  }

  removeEdge(id) {
    const edge = this._edges.get(id);
    if (!edge) return false;

    if (this._outgoing.has(edge.sourceId)) {
      this._outgoing.get(edge.sourceId).delete(id);
    }
    if (this._incoming.has(edge.targetId)) {
      this._incoming.get(edge.targetId).delete(id);
    }

    this._unindexEdge(edge);
    this._edges.delete(id);
    return true;
  }

  getOutgoingEdges(nodeId, relationFilter = null) {
    const edgeIds = this._outgoing.get(nodeId);
    if (!edgeIds) return [];
    const edges = [];
    for (const id of edgeIds) {
      const edge = this._edges.get(id);
      if (edge && (!relationFilter || edge.relation === relationFilter)) {
        edges.push(edge);
      }
    }
    return edges;
  }

  getIncomingEdges(nodeId, relationFilter = null) {
    const edgeIds = this._incoming.get(nodeId);
    if (!edgeIds) return [];
    const edges = [];
    for (const id of edgeIds) {
      const edge = this._edges.get(id);
      if (edge && (!relationFilter || edge.relation === relationFilter)) {
        edges.push(edge);
      }
    }
    return edges;
  }

  getNeighbors(nodeId, direction = 'BOTH', relationFilter = null) {
    const result = new Set();
    if (direction === 'OUT' || direction === 'BOTH') {
      for (const e of this.getOutgoingEdges(nodeId, relationFilter)) {
        const node = this._nodes.get(e.targetId);
        if (node) result.add(node);
      }
    }
    if (direction === 'IN' || direction === 'BOTH') {
      for (const e of this.getIncomingEdges(nodeId, relationFilter)) {
        const node = this._nodes.get(e.sourceId);
        if (node) result.add(node);
      }
    }
    return Array.from(result);
  }

  getAncestors(nodeId, maxDepth = 50, relationFilter = null) {
    const visited = new Set();
    const queue = [{ id: nodeId, depth: 0 }];
    const ancestors = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      for (const edge of this.getIncomingEdges(id, relationFilter)) {
        if (!visited.has(edge.sourceId) && edge.sourceId !== nodeId) {
          visited.add(edge.sourceId);
          const parentNode = this._nodes.get(edge.sourceId);
          if (parentNode) {
            ancestors.push(parentNode);
            queue.push({ id: edge.sourceId, depth: depth + 1 });
          }
        }
      }
    }
    return ancestors;
  }

  getDescendants(nodeId, maxDepth = 50, relationFilter = null) {
    const visited = new Set();
    const queue = [{ id: nodeId, depth: 0 }];
    const descendants = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      for (const edge of this.getOutgoingEdges(id, relationFilter)) {
        if (!visited.has(edge.targetId) && edge.targetId !== nodeId) {
          visited.add(edge.targetId);
          const childNode = this._nodes.get(edge.targetId);
          if (childNode) {
            descendants.push(childNode);
            queue.push({ id: edge.targetId, depth: depth + 1 });
          }
        }
      }
    }
    return descendants;
  }

  findPath(startId, endId, maxDepth = 50) {
    if (startId === endId) return [startId];
    const visited = new Set([startId]);
    const queue = [[startId]];

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (path.length > maxDepth) continue;

      for (const edge of this.getOutgoingEdges(current)) {
        if (edge.targetId === endId) {
          return [...path, endId];
        }
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push([...path, edge.targetId]);
        }
      }
    }
    return null;
  }

  queryNodes(filter = {}) {
    let candidateIds = null;

    if (filter.kind) {
      const ids = this._kindIndex.get(filter.kind) || new Set();
      candidateIds = new Set(ids);
    }
    if (filter.file) {
      const ids = this._fileIndex.get(filter.file) || new Set();
      candidateIds = candidateIds ? intersect(candidateIds, ids) : new Set(ids);
    }
    if (filter.scope) {
      const ids = this._scopeIndex.get(filter.scope) || new Set();
      candidateIds = candidateIds ? intersect(candidateIds, ids) : new Set(ids);
    }
    if (filter.name) {
      const ids = this._nameIndex.get(filter.name) || new Set();
      candidateIds = candidateIds ? intersect(candidateIds, ids) : new Set(ids);
    }

    const source = candidateIds ? candidateIds : this._nodes.keys();
    const result = [];

    for (const id of source) {
      const node = this._nodes.get(id);
      if (!node) continue;

      if (filter.verificationState && node.verificationState !== filter.verificationState) continue;
      if (filter.predicate && !filter.predicate(node)) continue;

      result.push(node);
    }

    return result;
  }

  queryEdges(filter = {}) {
    let candidateIds = null;

    if (filter.relation) {
      const ids = this._relationIndex.get(filter.relation) || new Set();
      candidateIds = new Set(ids);
    }

    const source = candidateIds ? candidateIds : this._edges.keys();
    const result = [];

    for (const id of source) {
      const edge = this._edges.get(id);
      if (!edge) continue;

      if (filter.sourceId && edge.sourceId !== filter.sourceId) continue;
      if (filter.targetId && edge.targetId !== filter.targetId) continue;
      if (filter.minConfidence && edge.confidence < filter.minConfidence) continue;
      if (filter.scope && edge.scope !== filter.scope) continue;
      if (filter.predicate && !filter.predicate(edge)) continue;

      result.push(edge);
    }

    return result;
  }

  _indexNode(node) {
    if (!this._kindIndex.has(node.kind)) this._kindIndex.set(node.kind, new Set());
    this._kindIndex.get(node.kind).add(node.id);

    if (node.sourceRange && node.sourceRange.file) {
      if (!this._fileIndex.has(node.sourceRange.file)) this._fileIndex.set(node.sourceRange.file, new Set());
      this._fileIndex.get(node.sourceRange.file).add(node.id);
    }

    if (node.owningScope) {
      if (!this._scopeIndex.has(node.owningScope)) this._scopeIndex.set(node.owningScope, new Set());
      this._scopeIndex.get(node.owningScope).add(node.id);
    }

    if (node.name) {
      if (!this._nameIndex.has(node.name)) this._nameIndex.set(node.name, new Set());
      this._nameIndex.get(node.name).add(node.id);
    }
  }

  _unindexNode(node) {
    if (this._kindIndex.has(node.kind)) this._kindIndex.get(node.kind).delete(node.id);
    if (node.sourceRange && node.sourceRange.file && this._fileIndex.has(node.sourceRange.file)) {
      this._fileIndex.get(node.sourceRange.file).delete(node.id);
    }
    if (node.owningScope && this._scopeIndex.has(node.owningScope)) {
      this._scopeIndex.get(node.owningScope).delete(node.id);
    }
    if (node.name && this._nameIndex.has(node.name)) {
      this._nameIndex.get(node.name).delete(node.id);
    }
  }

  _indexEdge(edge) {
    if (!this._relationIndex.has(edge.relation)) this._relationIndex.set(edge.relation, new Set());
    this._relationIndex.get(edge.relation).add(edge.id);
  }

  _unindexEdge(edge) {
    if (this._relationIndex.has(edge.relation)) {
      this._relationIndex.get(edge.relation).delete(edge.id);
    }
  }

  toJSON() {
    return {
      nodes: Array.from(this._nodes.values()).map(n => n.toJSON()),
      edges: Array.from(this._edges.values()).map(e => e.toJSON())
    };
  }

  static fromJSON(json) {
    const graph = new SemanticProgramGraph();
    if (json && json.nodes) {
      for (const n of json.nodes) {
        graph.addNode(SemanticNode.fromJSON(n));
      }
    }
    if (json && json.edges) {
      for (const e of json.edges) {
        graph.addEdge(SemanticEdge.fromJSON(e));
      }
    }
    return graph;
  }
}

function intersect(setA, setB) {
  const res = new Set();
  for (const item of setA) {
    if (setB.has(item)) res.add(item);
  }
  return res;
}
