/**
 * DependencyCentralityAnalyzer.js
 * Calculates degree and flow centrality metrics for nodes in the project dependency network.
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class DependencyCentralityAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('DependencyCentralityAnalyzer requires graph');
    const nodes = graph.getNodes();
    const n = nodes.length;
    const centralityMap = new Map();

    if (n === 0) return { centralities: [] };

    const maxPossibleDegree = Math.max(1, n - 1);

    for (const node of nodes) {
      const inDegree = graph.getFanIn(node.id, ProjectRelationKind.DEPENDS_ON);
      const outDegree = graph.getFanOut(node.id, ProjectRelationKind.DEPENDS_ON);
      const totalDegree = inDegree + outDegree;

      const inDegreeCentrality = inDegree / maxPossibleDegree;
      const outDegreeCentrality = outDegree / maxPossibleDegree;
      const degreeCentrality = totalDegree / (2 * maxPossibleDegree);

      // Transitive reach as proxy for betweenness / global influence
      const transitiveDependents = graph.getTransitiveClosure(node.id, 'in', ProjectRelationKind.DEPENDS_ON, 5).length;
      const transitiveDependencies = graph.getTransitiveClosure(node.id, 'out', ProjectRelationKind.DEPENDS_ON, 5).length;
      const reachCentrality = (transitiveDependents + transitiveDependencies) / (2 * maxPossibleDegree);

      const compositeCentrality = (0.5 * inDegreeCentrality) + (0.5 * reachCentrality);

      centralityMap.set(node.id, {
        id: node.id,
        inDegree,
        outDegree,
        totalDegree,
        inDegreeCentrality,
        outDegreeCentrality,
        degreeCentrality,
        reachCentrality,
        centrality: compositeCentrality
      });
    }

    const sorted = Array.from(centralityMap.values()).sort((a, b) => b.centrality - a.centrality);

    return {
      nodeCount: n,
      centralities: sorted,
      topCentralNodes: sorted.slice(0, 10)
    };
  }
}
