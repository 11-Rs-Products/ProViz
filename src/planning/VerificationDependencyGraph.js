import { VerificationDependency } from './VerificationDependency.js';

export class VerificationDependencyGraph {
  constructor() {
    this.nodes = new Set();
    this.outgoing = new Map(); // id -> Array of VerificationDependency
    this.incoming = new Map(); // id -> Array of VerificationDependency
  }

  addNode(id) {
    const sId = String(id);
    this.nodes.add(sId);
    if (!this.outgoing.has(sId)) this.outgoing.set(sId, []);
    if (!this.incoming.has(sId)) this.incoming.set(sId, []);
    return this;
  }

  addDependency(dep) {
    const d = dep instanceof VerificationDependency ? dep : new VerificationDependency(dep);
    this.addNode(d.sourceId);
    this.addNode(d.targetId);

    this.outgoing.get(d.sourceId).push(d);
    this.incoming.get(d.targetId).push(d);
    return this;
  }

  getDependencies(id) {
    return this.outgoing.get(String(id)) || [];
  }

  getDependenciesFor(id) {
    return this.getDependencies(id);
  }

  getDependents(id) {
    return this.incoming.get(String(id)) || [];
  }

  toJSON() {
    const edges = [];
    for (const deps of this.outgoing.values()) {
      for (const d of deps) edges.push(d.toJSON());
    }
    return {
      nodes: Array.from(this.nodes),
      dependencies: edges
    };
  }
}
