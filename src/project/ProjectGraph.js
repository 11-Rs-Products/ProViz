/**
 * ProjectGraph.js
 * Directed multigraph for project entities and their relations.
 */

import { ProjectEntity } from './ProjectEntity.js';
import { ProjectRelation, ProjectRelationKind } from './ProjectRelation.js';

export class ProjectGraph {
  constructor() {
    /** @type {Map<string, ProjectEntity>} */
    this._nodes = new Map();
    /** @type {Map<string, ProjectRelation>} */
    this._edges = new Map();
    /** @type {Map<string, Set<string>>} */
    this._outEdges = new Map();
    /** @type {Map<string, Set<string>>} */
    this._inEdges = new Map();
  }

  addNode(node) {
    const entity = node instanceof ProjectEntity ? node : new ProjectEntity(node);
    this._nodes.set(entity.id, entity);
    return entity;
  }

  addEntity(entity) {
    return this.addNode(entity);
  }

  hasNode(id) {
    return this._nodes.has(id);
  }

  getNode(id) {
    return this._nodes.get(id) || null;
  }

  getNodes() {
    return Array.from(this._nodes.values());
  }

  get nodeCount() {
    return this._nodes.size;
  }

  addEdge(edge) {
    const relation = edge instanceof ProjectRelation ? edge : new ProjectRelation(edge);
    if (!this._nodes.has(relation.from)) {
      this.addNode({ id: relation.from });
    }
    if (!this._nodes.has(relation.to)) {
      this.addNode({ id: relation.to });
    }
    this._edges.set(relation.id, relation);

    let outSet = this._outEdges.get(relation.from);
    if (!outSet) {
      outSet = new Set();
      this._outEdges.set(relation.from, outSet);
    }
    outSet.add(relation.id);

    let inSet = this._inEdges.get(relation.to);
    if (!inSet) {
      inSet = new Set();
      this._inEdges.set(relation.to, inSet);
    }
    inSet.add(relation.id);

    return relation;
  }

  addDependency(fromId, toId, weight = 1.0, metadata = {}) {
    return this.addEdge(new ProjectRelation({
      from: fromId,
      to: toId,
      kind: ProjectRelationKind.DEPENDS_ON,
      weight,
      metadata
    }));
  }

  hasEdge(id) {
    return this._edges.has(id);
  }

  getEdge(id) {
    return this._edges.get(id) || null;
  }

  getEdges() {
    return Array.from(this._edges.values());
  }

  get edgeCount() {
    return this._edges.size;
  }

  getOutgoingEdges(nodeId, kind = null) {
    const edgeIds = this._outEdges.get(nodeId);
    if (!edgeIds) return [];
    const res = [];
    for (const id of edgeIds) {
      const edge = this._edges.get(id);
      if (!kind || edge.kind === kind) res.push(edge);
    }
    return res;
  }

  getIncomingEdges(nodeId, kind = null) {
    const edgeIds = this._inEdges.get(nodeId);
    if (!edgeIds) return [];
    const res = [];
    for (const id of edgeIds) {
      const edge = this._edges.get(id);
      if (!kind || edge.kind === kind) res.push(edge);
    }
    return res;
  }

  getDependencies(nodeId, kind = ProjectRelationKind.DEPENDS_ON) {
    return this.getOutgoingEdges(nodeId, kind).map(e => this._nodes.get(e.to)).filter(Boolean);
  }

  getDependents(nodeId, kind = ProjectRelationKind.DEPENDS_ON) {
    return this.getIncomingEdges(nodeId, kind).map(e => this._nodes.get(e.from)).filter(Boolean);
  }

  getFanOut(nodeId, kind = ProjectRelationKind.DEPENDS_ON) {
    const edgeIds = this._outEdges.get(nodeId);
    if (!edgeIds) return 0;
    if (!kind) return edgeIds.size;
    return this.getOutgoingEdges(nodeId, kind).length;
  }

  getFanIn(nodeId, kind = ProjectRelationKind.DEPENDS_ON) {
    const edgeIds = this._inEdges.get(nodeId);
    if (!edgeIds) return 0;
    if (!kind) return edgeIds.size;
    return this.getIncomingEdges(nodeId, kind).length;
  }

  findCycles(kind = ProjectRelationKind.DEPENDS_ON) {
    const cycles = [];
    const visited = new Set();
    const stack = new Set();
    const path = [];

    const dfs = (nodeId) => {
      visited.add(nodeId);
      stack.add(nodeId);
      path.push(nodeId);

      const outEdges = this.getOutgoingEdges(nodeId, kind);
      for (const edge of outEdges) {
        const neighbor = edge.to;
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (stack.has(neighbor)) {
          const cycleStartIndex = path.indexOf(neighbor);
          if (cycleStartIndex !== -1) {
            cycles.push(path.slice(cycleStartIndex).concat(neighbor));
          }
        }
      }

      path.pop();
      stack.delete(nodeId);
    };

    for (const nodeId of this._nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return cycles;
  }

  findShortestPath(startId, endId, kind = ProjectRelationKind.DEPENDS_ON) {
    if (startId === endId) return [startId];
    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const currentPath = queue.shift();
      const current = currentPath[currentPath.length - 1];

      const outEdges = this.getOutgoingEdges(current, kind);
      for (const edge of outEdges) {
        const next = edge.to;
        if (next === endId) {
          return [...currentPath, next];
        }
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...currentPath, next]);
        }
      }
    }
    return null;
  }

  getTransitiveClosure(startId, direction = 'out', kind = ProjectRelationKind.DEPENDS_ON, maxDepth = 20) {
    const visited = new Set();
    const queue = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const { id: current, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      const edges = direction === 'out' 
        ? this.getOutgoingEdges(current, kind)
        : this.getIncomingEdges(current, kind);

      for (const edge of edges) {
        const target = direction === 'out' ? edge.to : edge.from;
        if (!visited.has(target) && target !== startId) {
          visited.add(target);
          queue.push({ id: target, depth: depth + 1 });
        }
      }
    }

    return Array.from(visited);
  }

  toJSON() {
    return {
      nodes: Array.from(this._nodes.values()).map(n => n.toJSON()),
      edges: Array.from(this._edges.values()).map(e => e.toJSON())
    };
  }

  static fromJSON(json) {
    const graph = new ProjectGraph();
    if (json.nodes) {
      for (const n of json.nodes) graph.addNode(ProjectEntity.fromJSON(n));
    }
    if (json.edges) {
      for (const e of json.edges) graph.addEdge(ProjectRelation.fromJSON(e));
    }
    return graph;
  }
}
