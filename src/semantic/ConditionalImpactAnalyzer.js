/**
 * ConditionalImpactAnalyzer.js
 * Evaluates impact paths under symbolic, environmental, or branch conditions.
 */

import { ConditionalDependency } from './ConditionalDependency.js';

export class ConditionalImpactAnalyzer {
  constructor() {
    this._conditionalDeps = new Map(); // id -> ConditionalDependency
  }

  addConditionalDependency(condDep) {
    if (!(condDep instanceof ConditionalDependency)) {
      condDep = new ConditionalDependency(condDep);
    }
    this._conditionalDeps.set(condDep.id, condDep);
    return this;
  }

  getConditionalDependenciesFor(nodeId) {
    const res = [];
    for (const dep of this._conditionalDeps.values()) {
      if (dep.sourceId === nodeId || dep.targetId === nodeId) {
        res.push(dep);
      }
    }
    return res;
  }

  /**
   * Filters reachable dependent nodes given an active execution/environmental context.
   */
  filterReachableDependents(startId, context = {}) {
    const reachable = new Set([startId]);
    let added = true;

    while (added) {
      added = false;
      for (const dep of this._conditionalDeps.values()) {
        if (reachable.has(dep.sourceId) && !reachable.has(dep.targetId)) {
          if (dep.evaluate(context)) {
            reachable.add(dep.targetId);
            added = true;
          }
        }
      }
    }

    return Array.from(reachable).filter(id => id !== startId);
  }
}
