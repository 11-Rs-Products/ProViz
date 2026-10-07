/**
 * DependencyStabilityAnalyzer.js
 * Analyzes architectural instability using Martin's package metric:
 * Instability I = Ce / (Ca + Ce)
 * where Ca = Afferent Coupling (Fan-in), Ce = Efferent Coupling (Fan-out).
 * I = 0: Completely Stable (hard to change)
 * I = 1: Completely Instable (easy to change)
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class DependencyStabilityAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('DependencyStabilityAnalyzer requires graph');
    const nodes = graph.getNodes();
    const stabilityMetrics = [];

    for (const node of nodes) {
      const ca = graph.getFanIn(node.id, ProjectRelationKind.DEPENDS_ON);
      const ce = graph.getFanOut(node.id, ProjectRelationKind.DEPENDS_ON);
      const totalCoupling = ca + ce;
      const instability = totalCoupling === 0 ? 0.0 : ce / totalCoupling;
      const stability = 1.0 - instability;

      stabilityMetrics.push({
        id: node.id,
        ca,
        ce,
        instability: Number(instability.toFixed(4)),
        stability: Number(stability.toFixed(4)),
        classification: instability === 0 ? 'MAXIMALLY_STABLE' : instability === 1 ? 'MAXIMALLY_INSTABLE' : 'BALANCED'
      });
    }

    return {
      timestamp: Date.now(),
      metrics: stabilityMetrics
    };
  }
}
