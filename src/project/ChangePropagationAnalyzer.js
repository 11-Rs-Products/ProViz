/**
 * ChangePropagationAnalyzer.js
 * Analyzes how historical changes have rippled through the architecture and invalidates downstream verification evidence.
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class ChangePropagationAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  constructor(graph) {
    this.graph = graph;
  }

  /**
   * Compute blast radius and affected evidence for a set of changed entities
   * @param {string[]} changedEntityIds
   */
  propagate(changedEntityIds) {
    if (!this.graph) throw new Error('ChangePropagationAnalyzer requires graph');
    const affectedEntities = new Set(changedEntityIds);
    const affectedObligations = new Set();
    const queue = [...changedEntityIds];

    while (queue.length > 0) {
      const current = queue.shift();

      // Transitive dependents
      const dependents = this.graph.getIncomingEdges(current, ProjectRelationKind.DEPENDS_ON);
      for (const edge of dependents) {
        if (!affectedEntities.has(edge.from)) {
          affectedEntities.add(edge.from);
          queue.push(edge.from);
        }
      }

      // Verification obligations constrained or linked to current
      const obligations = this.graph.getIncomingEdges(current, ProjectRelationKind.CONSTRAINS);
      for (const o of obligations) {
        affectedObligations.add(o.from);
      }
    }

    return {
      primaryChangedCount: changedEntityIds.length,
      totalBlastRadiusCount: affectedEntities.size,
      affectedEntities: Array.from(affectedEntities),
      invalidatedObligations: Array.from(affectedObligations)
    };
  }
}
