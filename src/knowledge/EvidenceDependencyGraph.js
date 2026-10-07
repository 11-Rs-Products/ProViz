import { EvidenceDependency } from './EvidenceDependency.js';

/**
 * Unified Evidence Dependency Graph supporting closure, support chains,
 * contradiction chains, and invalidation propagation.
 */
export class EvidenceDependencyGraph {
  constructor() {
    this._dependencies = new Map(); // id -> EvidenceDependency
    this._outgoing = new Map();     // sourceEvidenceId -> Set<depId>
    this._incoming = new Map();     // targetEvidenceId -> Set<depId>
  }

  addDependency(dep) {
    const d = dep instanceof EvidenceDependency ? dep : EvidenceDependency.fromJSON(dep);
    const depId = `${d.sourceEvidenceId}->${d.targetEvidenceId}:${d.dependencyType}`;
    this._dependencies.set(depId, d);

    if (!this._outgoing.has(d.sourceEvidenceId)) this._outgoing.set(d.sourceEvidenceId, new Set());
    if (!this._incoming.has(d.targetEvidenceId)) this._incoming.set(d.targetEvidenceId, new Set());

    this._outgoing.get(d.sourceEvidenceId).add(depId);
    this._incoming.get(d.targetEvidenceId).add(depId);
    return d;
  }

  getSupporters(evidenceId) {
    const depIds = this._incoming.get(evidenceId);
    if (!depIds) return [];
    return Array.from(depIds)
      .map(id => this._dependencies.get(id))
      .filter(d => d && (d.dependencyType === 'SUPPORTS' || d.dependencyType === 'VALIDATES'))
      .map(d => d.sourceEvidenceId);
  }

  getDependents(evidenceId) {
    const depIds = this._outgoing.get(evidenceId);
    if (!depIds) return [];
    return Array.from(depIds)
      .map(id => this._dependencies.get(id))
      .filter(d => d && (d.dependencyType === 'SUPPORTS' || d.dependencyType === 'PREREQUISITE'))
      .map(d => d.targetEvidenceId);
  }

  getContradictions(evidenceId) {
    const outgoing = this._outgoing.get(evidenceId) || new Set();
    const incoming = this._incoming.get(evidenceId) || new Set();
    const all = [...outgoing, ...incoming];
    return all
      .map(id => this._dependencies.get(id))
      .filter(d => d && d.dependencyType === 'CONTRADICTS')
      .map(d => (d.sourceEvidenceId === evidenceId ? d.targetEvidenceId : d.sourceEvidenceId));
  }

  getDependencyClosure(evidenceId) {
    const closure = new Set();
    const queue = [evidenceId];

    while (queue.length > 0) {
      const curr = queue.shift();
      const supporters = this.getSupporters(curr);
      for (const s of supporters) {
        if (!closure.has(s)) {
          closure.add(s);
          queue.push(s);
        }
      }
    }

    return Array.from(closure);
  }

  getInvalidationImpact(changedEvidenceId) {
    const impacted = new Set();
    const queue = [changedEvidenceId];

    while (queue.length > 0) {
      const curr = queue.shift();
      const dependents = this.getDependents(curr);
      for (const d of dependents) {
        if (!impacted.has(d)) {
          impacted.add(d);
          queue.push(d);
        }
      }
    }

    return Array.from(impacted);
  }

  toJSON() {
    return {
      dependencies: Array.from(this._dependencies.values()).map(d => d.toJSON())
    };
  }

  static fromJSON(json = {}) {
    const graph = new EvidenceDependencyGraph();
    if (Array.isArray(json.dependencies)) {
      for (const d of json.dependencies) graph.addDependency(EvidenceDependency.fromJSON(d));
    }
    return graph;
  }
}
