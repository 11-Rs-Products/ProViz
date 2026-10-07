/**
 * ProjectCohesionAnalyzer.js
 * Analyzes internal cohesion of packages, modules, and boundaries (ratio of intra-module relations to boundary crossings).
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class ProjectCohesionAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   * @param {import('./ArchitectureModel.js').ArchitectureModel} [architectureModel]
   */
  analyze(graph, architectureModel = null) {
    if (!graph) throw new Error('ProjectCohesionAnalyzer requires graph');
    const nodes = graph.getNodes();
    const cohesionScores = [];

    // Analyze packages or boundaries if architectureModel exists, or analyze module clusters
    if (architectureModel && architectureModel.boundaries.size > 0) {
      for (const boundary of architectureModel.boundaries.values()) {
        const internalModules = new Set(boundary.internalModules);
        let internalEdges = 0;
        let externalEdges = 0;

        for (const modId of internalModules) {
          const outEdges = graph.getOutgoingEdges(modId, ProjectRelationKind.DEPENDS_ON);
          for (const e of outEdges) {
            if (internalModules.has(e.to)) {
              internalEdges++;
            } else {
              externalEdges++;
            }
          }
        }

        const total = internalEdges + externalEdges;
        const cohesion = total === 0 ? 1.0 : internalEdges / total;

        cohesionScores.push({
          id: boundary.id,
          name: boundary.name,
          internalModulesCount: internalModules.size,
          internalEdges,
          externalEdges,
          cohesion: Number(cohesion.toFixed(4)),
          isLowCohesion: cohesion < 0.3
        });
      }
    } else {
      // Default module-level cohesion estimate based on symbol reference locality
      for (const node of nodes) {
        const outEdges = graph.getOutgoingEdges(node.id, ProjectRelationKind.DEPENDS_ON);
        const inEdges = graph.getIncomingEdges(node.id, ProjectRelationKind.DEPENDS_ON);
        const total = outEdges.length + inEdges.length;
        const score = total === 0 ? 1.0 : Math.min(1.0, 1.0 / Math.log2(total + 2));

        cohesionScores.push({
          id: node.id,
          name: node.name,
          totalRelations: total,
          cohesion: Number(score.toFixed(4)),
          isLowCohesion: score < 0.25
        });
      }
    }

    const avgCohesion = cohesionScores.length === 0 ? 1.0 : 
      cohesionScores.reduce((acc, c) => acc + c.cohesion, 0) / cohesionScores.length;

    return {
      timestamp: Date.now(),
      averageCohesion: Number(avgCohesion.toFixed(4)),
      cohesionScores
    };
  }
}
