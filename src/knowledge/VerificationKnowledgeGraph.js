import { KnowledgeEntity } from './KnowledgeEntity.js';
import { KnowledgeEdge } from './KnowledgeEdge.js';
import { KnowledgeGraphIndex } from './KnowledgeGraphIndex.js';

/**
 * Universal Verification Knowledge Graph integrating all entities, edges,
 * causal paths, provenance chains, and evidence dependencies across Stages 1–27.
 */
export class VerificationKnowledgeGraph {
  constructor() {
    this._entities = new Map(); // id -> KnowledgeEntity
    this._edges = new Map();    // id -> KnowledgeEdge
    this._outgoing = new Map(); // sourceId -> Set<edgeId>
    this._incoming = new Map(); // targetId -> Set<edgeId>
    this._index = new KnowledgeGraphIndex();
  }

  addEntity(entity) {
    const verified = entity instanceof KnowledgeEntity ? entity : KnowledgeEntity.fromJSON(entity);
    if (this._entities.has(verified.id)) {
      this._index.unindexEntity(this._entities.get(verified.id));
    }
    this._entities.set(verified.id, verified);
    this._index.indexEntity(verified);
    if (!this._outgoing.has(verified.id)) this._outgoing.set(verified.id, new Set());
    if (!this._incoming.has(verified.id)) this._incoming.set(verified.id, new Set());
    return verified;
  }

  addEdge(edge) {
    const verified = edge instanceof KnowledgeEdge ? edge : KnowledgeEdge.fromJSON(edge);
    if (!this._entities.has(verified.source)) {
      this.addEntity(new KnowledgeEntity({ id: verified.source, name: verified.source }));
    }
    if (!this._entities.has(verified.target)) {
      this.addEntity(new KnowledgeEntity({ id: verified.target, name: verified.target }));
    }

    if (this._edges.has(verified.id)) {
      this._index.unindexEdge(this._edges.get(verified.id));
    }

    this._edges.set(verified.id, verified);
    this._index.indexEdge(verified);
    this._outgoing.get(verified.source).add(verified.id);
    this._incoming.get(verified.target).add(verified.id);
    return verified;
  }

  getEntity(id) {
    return this._entities.get(id) || null;
  }

  getEdge(id) {
    return this._edges.get(id) || null;
  }

  getEntities() {
    return Array.from(this._entities.values());
  }

  getEdges() {
    return Array.from(this._edges.values());
  }

  getOutgoingEdges(entityId) {
    const edgeIds = this._outgoing.get(entityId);
    if (!edgeIds) return [];
    return Array.from(edgeIds).map(id => this._edges.get(id)).filter(Boolean);
  }

  getIncomingEdges(entityId) {
    const edgeIds = this._incoming.get(entityId);
    if (!edgeIds) return [];
    return Array.from(edgeIds).map(id => this._edges.get(id)).filter(Boolean);
  }

  getNeighbors(entityId, { relation = null, direction = 'BOTH' } = {}) {
    const neighborIds = new Set();

    if (direction === 'OUTGOING' || direction === 'BOTH') {
      for (const edge of this.getOutgoingEdges(entityId)) {
        if (!relation || edge.relation === relation) {
          neighborIds.add(edge.target);
        }
      }
    }

    if (direction === 'INCOMING' || direction === 'BOTH') {
      for (const edge of this.getIncomingEdges(entityId)) {
        if (!relation || edge.relation === relation) {
          neighborIds.add(edge.source);
        }
      }
    }

    return Array.from(neighborIds).map(id => this.getEntity(id)).filter(Boolean);
  }

  getAncestors(entityId, { relation = null, maxDepth = 20 } = {}) {
    const visited = new Set();
    const ancestors = [];
    const queue = [{ id: entityId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      for (const edge of this.getIncomingEdges(id)) {
        if (!relation || edge.relation === relation) {
          if (!visited.has(edge.source)) {
            visited.add(edge.source);
            const entity = this.getEntity(edge.source);
            if (entity) ancestors.push(entity);
            queue.push({ id: edge.source, depth: depth + 1 });
          }
        }
      }
    }

    return ancestors;
  }

  getDescendants(entityId, { relation = null, maxDepth = 20 } = {}) {
    const visited = new Set();
    const descendants = [];
    const queue = [{ id: entityId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      for (const edge of this.getOutgoingEdges(id)) {
        if (!relation || edge.relation === relation) {
          if (!visited.has(edge.target)) {
            visited.add(edge.target);
            const entity = this.getEntity(edge.target);
            if (entity) descendants.push(entity);
            queue.push({ id: edge.target, depth: depth + 1 });
          }
        }
      }
    }

    return descendants;
  }

  findPath(fromEntityId, toEntityId, { relation = null, maxDepth = 20 } = {}) {
    if (fromEntityId === toEntityId) return [fromEntityId];
    const visited = new Set([fromEntityId]);
    const queue = [[fromEntityId]];

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];
      if (path.length > maxDepth) continue;

      for (const edge of this.getOutgoingEdges(current)) {
        if (!relation || edge.relation === relation) {
          if (edge.target === toEntityId) {
            return [...path, edge.target];
          }
          if (!visited.has(edge.target)) {
            visited.add(edge.target);
            queue.push([...path, edge.target]);
          }
        }
      }
    }
    return null;
  }

  getEntitiesByKind(kind) {
    const ids = this._index.byKind.get(kind);
    if (!ids) return [];
    return Array.from(ids).map(id => this.getEntity(id)).filter(Boolean);
  }

  getEntitiesByFile(file) {
    const ids = this._index.byFile.get(file);
    if (!ids) return [];
    return Array.from(ids).map(id => this.getEntity(id)).filter(Boolean);
  }

  getEntitiesBySymbol(symbol) {
    const ids = this._index.bySymbol.get(symbol);
    if (!ids) return [];
    return Array.from(ids).map(id => this.getEntity(id)).filter(Boolean);
  }

  getEntitiesByStage(stage) {
    const ids = this._index.byStage.get(stage);
    if (!ids) return [];
    return Array.from(ids).map(id => this.getEntity(id)).filter(Boolean);
  }

  getEdgesByRelation(relation) {
    const ids = this._index.byRelation.get(relation);
    if (!ids) return [];
    return Array.from(ids).map(id => this.getEdge(id)).filter(Boolean);
  }

  get size() {
    return {
      entities: this._entities.size,
      edges: this._edges.size
    };
  }

  clear() {
    this._entities.clear();
    this._edges.clear();
    this._outgoing.clear();
    this._incoming.clear();
    this._index.clear();
  }

  toJSON() {
    return {
      entities: this.getEntities().map(e => e.toJSON()),
      edges: this.getEdges().map(e => e.toJSON())
    };
  }

  static fromJSON(json = {}) {
    const graph = new VerificationKnowledgeGraph();
    if (Array.isArray(json.entities)) {
      for (const e of json.entities) graph.addEntity(KnowledgeEntity.fromJSON(e));
    }
    if (Array.isArray(json.edges)) {
      for (const edge of json.edges) graph.addEdge(KnowledgeEdge.fromJSON(edge));
    }
    return graph;
  }
}
