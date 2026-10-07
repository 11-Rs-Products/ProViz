/**
 * DependencyHotspotAnalyzer.js
 * Identifies architectural dependency bottlenecks, high fan-in hubs, and high blast-radius nodes.
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class DependencyHotspotAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('DependencyHotspotAnalyzer requires graph');
    const nodes = graph.getNodes();
    const hotspots = [];

    for (const node of nodes) {
      const fanIn = graph.getFanIn(node.id, ProjectRelationKind.DEPENDS_ON);
      const fanOut = graph.getFanOut(node.id, ProjectRelationKind.DEPENDS_ON);
      const blastRadius = graph.getTransitiveClosure(node.id, 'in', ProjectRelationKind.DEPENDS_ON).length;

      const isHub = fanIn >= 5;
      const isGodModule = fanOut >= 10;
      const isBottleneck = blastRadius >= Math.max(3, Math.floor(nodes.length * 0.25));

      if (isHub || isGodModule || isBottleneck) {
        hotspots.push({
          id: node.id,
          fanIn,
          fanOut,
          blastRadius,
          isHub,
          isGodModule,
          isBottleneck,
          severity: (isHub && isBottleneck) ? 'CRITICAL' : 'WARNING'
        });
      }
    }

    hotspots.sort((a, b) => b.blastRadius - a.blastRadius);

    return {
      timestamp: Date.now(),
      hotspotCount: hotspots.length,
      hotspots
    };
  }
}
