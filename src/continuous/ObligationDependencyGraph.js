/**
 * ObligationDependencyGraph.js
 * Directed acyclic graph representing prerequisite relationships between verification obligations.
 */

export class ObligationDependencyGraph {
  constructor() {
    /** @type {Map<string, import('./VerificationObligation.js').VerificationObligation>} */
    this.obligations = new Map();
    /** @type {Map<string, Set<string>>} obligationId -> Set of prerequisite obligationIds */
    this.dependencies = new Map();
    /** @type {Map<string, Set<string>>} obligationId -> Set of dependent obligationIds */
    this.dependents = new Map();
  }

  addObligation(obligation) {
    this.obligations.set(obligation.id, obligation);
    if (!this.dependencies.has(obligation.id)) {
      this.dependencies.set(obligation.id, new Set());
    }
    if (!this.dependents.has(obligation.id)) {
      this.dependents.set(obligation.id, new Set());
    }

    if (obligation.dependencies) {
      for (const depId of obligation.dependencies) {
        this.addDependency(obligation.id, depId);
      }
    }
  }

  addDependency(obligationId, prerequisiteId) {
    if (obligationId === prerequisiteId) return;
    if (!this.dependencies.has(obligationId)) {
      this.dependencies.set(obligationId, new Set());
    }
    if (!this.dependents.has(prerequisiteId)) {
      this.dependents.set(prerequisiteId, new Set());
    }
    this.dependencies.get(obligationId).add(prerequisiteId);
    this.dependents.get(prerequisiteId).add(obligationId);
  }

  getPrerequisites(obligationId) {
    return Array.from(this.dependencies.get(obligationId) || []);
  }

  getDependents(obligationId) {
    return Array.from(this.dependents.get(obligationId) || []);
  }

  getReadyObligations(completedObligationIds = new Set()) {
    const ready = [];
    for (const [id, obl] of this.obligations.entries()) {
      if (completedObligationIds.has(id)) continue;
      const prereqs = this.dependencies.get(id) || new Set();
      const allMet = Array.from(prereqs).every(p => completedObligationIds.has(p));
      if (allMet) {
        ready.push(obl);
      }
    }
    return ready;
  }

  toJSON() {
    const edges = [];
    for (const [oblId, deps] of this.dependencies.entries()) {
      for (const dep of deps) {
        edges.push({ from: dep, to: oblId });
      }
    }
    return {
      obligationsCount: this.obligations.size,
      edges
    };
  }
}
