/**
 * CohesionAnalyzer.js
 * Measures module cohesion and identifies fragmented responsibilities.
 */

export class CohesionAnalyzer {
  /**
   * Evaluates cohesion of a module or class based on internal variable/method access sharing.
   */
  analyze(scopeId, programGraph) {
    const memberNodes = programGraph.queryNodes ? programGraph.queryNodes({ scope: scopeId }) : [];
    if (memberNodes.length <= 1) {
      return {
        scopeId,
        cohesionScore: 1.0,
        isCohesive: true,
        summary: 'Trivially cohesive single/empty module'
      };
    }

    let internalLinks = 0;
    const memberIds = new Set(memberNodes.map(m => m.id));

    for (const member of memberNodes) {
      const outEdges = programGraph.getOutgoingEdges ? programGraph.getOutgoingEdges(member.id) : [];
      for (const edge of outEdges) {
        if (memberIds.has(edge.targetId)) {
          internalLinks++;
        }
      }
    }

    const maxPossibleInternalLinks = memberNodes.length * (memberNodes.length - 1);
    const cohesionScore = maxPossibleInternalLinks > 0
      ? Math.min(1.0, internalLinks / maxPossibleInternalLinks)
      : 1.0;

    return {
      scopeId,
      memberCount: memberNodes.length,
      internalLinks,
      cohesionScore,
      isCohesive: cohesionScore >= 0.25,
      summary: cohesionScore >= 0.25 ? 'Strong cohesion' : 'Low cohesion (fragmented module responsibilities)'
    };
  }
}
