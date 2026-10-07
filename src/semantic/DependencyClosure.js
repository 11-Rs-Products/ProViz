/**
 * DependencyClosure.js
 * Computes direct, transitive, reverse, and conditional dependency closures
 * across the multi-dimensional semantic graph.
 */

import { DependencyKind } from './DependencyKind.js';
import { DependencyEdge } from './DependencyEdge.js';
import { SemanticRelationKind } from './SemanticRelationKind.js';

export class DependencyClosure {
  constructor() {
    this._dependencies = new Map(); // id -> DependencyEdge
    this._outgoing = new Map();     // sourceId -> Set of DependencyEdge
    this._incoming = new Map();     // targetId -> Set of DependencyEdge
  }

  addDependency(dep) {
    if (!(dep instanceof DependencyEdge)) {
      dep = new DependencyEdge(dep);
    }
    this._dependencies.set(dep.id, dep);

    if (!this._outgoing.has(dep.sourceId)) this._outgoing.set(dep.sourceId, new Set());
    this._outgoing.get(dep.sourceId).add(dep);

    if (!this._incoming.has(dep.targetId)) this._incoming.set(dep.targetId, new Set());
    this._incoming.get(dep.targetId).add(dep);

    return this;
  }

  getDependencies(nodeId, kindFilter = null) {
    const deps = this._outgoing.get(nodeId);
    if (!deps) return [];
    const list = Array.from(deps);
    return kindFilter ? list.filter(d => d.kind === kindFilter) : list;
  }

  getDependents(nodeId, kindFilter = null) {
    const deps = this._incoming.get(nodeId);
    if (!deps) return [];
    const list = Array.from(deps);
    return kindFilter ? list.filter(d => d.kind === kindFilter) : list;
  }

  getTransitiveClosure(nodeId, maxDepth = 50, kindFilter = null) {
    const visited = new Set();
    const queue = [{ id: nodeId, depth: 0 }];
    const closure = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      const direct = this.getDependencies(id, kindFilter);
      for (const dep of direct) {
        if (!visited.has(dep.targetId) && dep.targetId !== nodeId) {
          visited.add(dep.targetId);
          closure.push(dep.targetId);
          queue.push({ id: dep.targetId, depth: depth + 1 });
        }
      }
    }
    return closure;
  }

  getReverseClosure(nodeId, maxDepth = 50, kindFilter = null) {
    const visited = new Set();
    const queue = [{ id: nodeId, depth: 0 }];
    const closure = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      const direct = this.getDependents(id, kindFilter);
      for (const dep of direct) {
        if (!visited.has(dep.sourceId) && dep.sourceId !== nodeId) {
          visited.add(dep.sourceId);
          closure.push(dep.sourceId);
          queue.push({ id: dep.sourceId, depth: depth + 1 });
        }
      }
    }
    return closure;
  }

  getConditionalDependencies(nodeId) {
    const deps = this.getDependencies(nodeId);
    return deps.filter(d => d.conditions !== null && Object.keys(d.conditions).length > 0);
  }

  getSemanticDependencies(nodeId) {
    return this.getDependencies(nodeId, DependencyKind.DATA_FLOW)
      .concat(this.getDependencies(nodeId, DependencyKind.CONTROL_FLOW))
      .concat(this.getDependencies(nodeId, DependencyKind.CALL));
  }

  getVerificationDependencies(nodeId) {
    return this.getDependencies(nodeId, DependencyKind.VERIFICATION)
      .concat(this.getDependencies(nodeId, DependencyKind.EVIDENCE))
      .concat(this.getDependencies(nodeId, DependencyKind.SPECIFICATION));
  }

  getBehavioralDependencies(nodeId) {
    return this.getDependencies(nodeId, DependencyKind.BEHAVIOR)
      .concat(this.getDependencies(nodeId, DependencyKind.RUNTIME));
  }

  static buildFromProgramGraph(graph) {
    const closure = new DependencyClosure();
    const edges = graph.queryEdges ? graph.queryEdges() : [];

    for (const edge of edges) {
      let kind = DependencyKind.DATA_FLOW;
      if (edge.relation === SemanticRelationKind.CALLS) kind = DependencyKind.CALL;
      else if (edge.relation === SemanticRelationKind.FLOWS_TO || edge.relation === SemanticRelationKind.CONTROLS) kind = DependencyKind.CONTROL_FLOW;
      else if (edge.relation === SemanticRelationKind.READS || edge.relation === SemanticRelationKind.WRITES) kind = DependencyKind.DATA_FLOW;
      else if (edge.relation === SemanticRelationKind.ALLOCATES || edge.relation === SemanticRelationKind.POINTS_TO) kind = DependencyKind.MEMORY;
      else if (edge.relation === SemanticRelationKind.AFFECTS_SPECIFICATION) kind = DependencyKind.SPECIFICATION;
      else if (edge.relation === SemanticRelationKind.AFFECTS_PROOF || edge.relation === SemanticRelationKind.AFFECTS_TEST) kind = DependencyKind.VERIFICATION;
      else if (edge.relation === SemanticRelationKind.AFFECTS_BEHAVIOR) kind = DependencyKind.BEHAVIOR;
      else if (edge.relation === SemanticRelationKind.DEPENDS_ON) kind = DependencyKind.SYNTAX;

      closure.addDependency(new DependencyEdge({
        id: `dep:${edge.id}`,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        kind,
        strength: edge.strength,
        conditions: edge.conditions,
        provenance: edge.provenance,
        confidence: edge.confidence
      }));
    }

    return closure;
  }
}
