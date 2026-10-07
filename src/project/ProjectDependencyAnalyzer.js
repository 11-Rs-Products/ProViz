/**
 * ProjectDependencyAnalyzer.js
 * Analyzes overall dependency topology across the project graph.
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class ProjectDependencyAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('ProjectDependencyAnalyzer requires graph');
    const nodes = graph.getNodes();
    const stats = new Map();

    let totalFanIn = 0;
    let totalFanOut = 0;

    for (const node of nodes) {
      const fanIn = graph.getFanIn(node.id, ProjectRelationKind.DEPENDS_ON);
      const fanOut = graph.getFanOut(node.id, ProjectRelationKind.DEPENDS_ON);
      totalFanIn += fanIn;
      totalFanOut += fanOut;

      const transitiveDeps = graph.getTransitiveClosure(node.id, 'out', ProjectRelationKind.DEPENDS_ON, 5);
      const transitiveDependents = graph.getTransitiveClosure(node.id, 'in', ProjectRelationKind.DEPENDS_ON, 5);

      stats.set(node.id, {
        id: node.id,
        fanIn,
        fanOut,
        transitiveDepCount: transitiveDeps.length,
        transitiveDependentCount: transitiveDependents.length,
        depth: transitiveDeps.length
      });
    }

    const n = Math.max(1, nodes.length);
    const avgFanIn = totalFanIn / n;
    const avgFanOut = totalFanOut / n;

    return {
      nodeCount: nodes.length,
      edgeCount: graph.edgeCount,
      averageFanIn: avgFanIn,
      averageFanOut: avgFanOut,
      nodeStats: Array.from(stats.values())
    };
  }
}
