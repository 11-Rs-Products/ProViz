/**
 * IncrementalVerifier.js
 * Computes the minimal necessary revalidation set using dependency closure and change blast radius.
 */

export class IncrementalVerifier {
  /**
   * Calculates the minimal affected verification scope from changed entities and dependency graph.
   * @param {Array<string>} changedEntities
   * @param {Map<string, Array<string>>|Object} dependencyGraph entity -> dependencies / dependents
   * @returns {{ changedEntities: Array<string>, transitiveClosure: Array<string>, minimalRevalidationSet: Array<string> }}
   */
  computeAffectedScope(changedEntities, dependencyGraph = {}) {
    const depMap = dependencyGraph instanceof Map ? dependencyGraph : new Map(Object.entries(dependencyGraph));
    const affected = new Set(changedEntities);
    const queue = [...changedEntities];

    while (queue.length > 0) {
      const curr = queue.shift();
      const dependents = depMap.get(curr) || [];
      for (const dep of dependents) {
        if (!affected.has(dep)) {
          affected.add(dep);
          queue.push(dep);
        }
      }
    }

    const transitiveClosure = Array.from(affected);
    return {
      changedEntities: [...changedEntities],
      transitiveClosure,
      minimalRevalidationSet: transitiveClosure
    };
  }
}
