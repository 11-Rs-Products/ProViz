/**
 * RiskPropagationAnalyzer.js
 * Simulates and calculates how faults or security compromises propagate through the project dependency graph.
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class RiskPropagationAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  constructor(graph) {
    this.graph = graph;
  }

  /**
   * Propagate risk from source entity
   * @param {string} sourceId
   * @param {number} [initialRisk=1.0]
   * @param {number} [attenuationFactor=0.7]
   */
  propagateRisk(sourceId, initialRisk = 1.0, attenuationFactor = 0.7) {
    if (!this.graph) throw new Error('RiskPropagationAnalyzer requires graph');
    const riskMap = new Map();
    riskMap.set(sourceId, initialRisk);

    const queue = [{ id: sourceId, currentRisk: initialRisk, depth: 0 }];
    const visited = new Set([sourceId]);

    while (queue.length > 0) {
      const { id, currentRisk, depth } = queue.shift();
      if (currentRisk < 0.05) continue;

      // Dependent nodes (nodes that depend on current node) will inherit risk
      const dependents = this.graph.getIncomingEdges(id, ProjectRelationKind.DEPENDS_ON);
      for (const edge of dependents) {
        const dependentId = edge.from;
        const propagatedRisk = currentRisk * attenuationFactor;

        const existingRisk = riskMap.get(dependentId) || 0;
        if (propagatedRisk > existingRisk) {
          riskMap.set(dependentId, propagatedRisk);
        }

        if (!visited.has(dependentId)) {
          visited.add(dependentId);
          queue.push({ id: dependentId, currentRisk: propagatedRisk, depth: depth + 1 });
        }
      }
    }

    const affected = [];
    for (const [entityId, propagatedRisk] of riskMap.entries()) {
      affected.push({
        entityId,
        propagatedRisk: Number(propagatedRisk.toFixed(4)),
        isSource: entityId === sourceId
      });
    }

    affected.sort((a, b) => b.propagatedRisk - a.propagatedRisk);

    return {
      sourceId,
      initialRisk,
      affectedEntitiesCount: affected.length,
      affected
    };
  }
}
