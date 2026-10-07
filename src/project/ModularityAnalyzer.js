/**
 * ModularityAnalyzer.js
 * Evaluates the modularity, package independence, and boundary insulation of the project.
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class ModularityAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('ModularityAnalyzer requires graph');
    const nodes = graph.getNodes();
    const edges = graph.getEdges().filter(e => e.kind === ProjectRelationKind.DEPENDS_ON);
    const n = Math.max(1, nodes.length);
    const m = Math.max(1, edges.length);

    // Edge density ratio
    const maxPossibleEdges = n * (n - 1);
    const density = maxPossibleEdges === 0 ? 0 : edges.length / maxPossibleEdges;

    // Modularity score: high when graph is decomposed into balanced, low-density components
    const modularity = Math.max(0.0, Math.min(1.0, 1.0 - (density * 5)));

    return {
      timestamp: Date.now(),
      nodeCount: n,
      edgeCount: m,
      density: Number(density.toFixed(4)),
      modularityScore: Number(modularity.toFixed(4)),
      isWellModularized: modularity >= 0.6
    };
  }
}
