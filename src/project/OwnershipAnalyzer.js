/**
 * OwnershipAnalyzer.js
 * Analyzes team responsibility coverage, detects orphaned components lacking owners, and calculates ownership concentration.
 */

export class OwnershipAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   * @param {import('./ProjectOwnership.js').ProjectOwnership} ownership
   */
  analyze(graph, ownership) {
    if (!graph || !ownership) throw new Error('OwnershipAnalyzer requires graph and ownership');
    const nodes = graph.getNodes();
    const unownedEntities = [];
    const teamDistribution = new Map();

    for (const node of nodes) {
      const resp = ownership.responsibilityMap.getResponsibility(node.id);
      if (!resp || !resp.primaryOwnerTeam) {
        unownedEntities.push(node.id);
      } else {
        teamDistribution.set(
          resp.primaryOwnerTeam, 
          (teamDistribution.get(resp.primaryOwnerTeam) || 0) + 1
        );
      }
    }

    const totalNodes = Math.max(1, nodes.length);
    const ownedCount = nodes.length - unownedEntities.length;
    const ownershipCoverage = Number((ownedCount / totalNodes).toFixed(4));

    return {
      timestamp: Date.now(),
      totalEntities: nodes.length,
      ownedEntitiesCount: ownedCount,
      unownedEntitiesCount: unownedEntities.length,
      ownershipCoverage,
      unownedEntities,
      teamDistribution: Object.fromEntries(teamDistribution),
      hasCompleteOwnership: unownedEntities.length === 0
    };
  }
}
