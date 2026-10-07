/**
 * AttackPathAnalyzer.js
 * Searches, extracts, and validates reachability of attack paths across the AttackGraph and Semantic Program Model.
 */

import { AttackPath } from './AttackPath.js';

export class AttackPathAnalyzer {
  /**
   * Discovers reachable attack paths between entry points and sensitive sinks.
   * @param {AttackGraph} attackGraph
   * @param {string} entryId
   * @param {string} sinkId
   * @param {Object} [options]
   * @returns {Array<AttackPath>}
   */
  findAttackPaths(attackGraph, entryId, sinkId, options = {}) {
    const maxDepth = options.maxDepth || 15;
    const paths = [];

    const queue = [{ current: entryId, visited: [entryId], crossedBoundaries: [] }];

    while (queue.length > 0) {
      const { current, visited, crossedBoundaries } = queue.shift();

      if (current === sinkId) {
        const pathId = `ap:${entryId}->${sinkId}_${paths.length}`;
        const intermediate = visited.slice(1, -1);
        paths.push(new AttackPath({
          pathId,
          entryNodeId: entryId,
          sinkNodeId: sinkId,
          stepNodeIds: intermediate,
          crossedBoundaries,
          exploitabilityScore: Math.max(0.2, 1.0 - (visited.length * 0.05)),
          impactScore: 0.9,
          description: `Discovered path: ${visited.join(' -> ')}`
        }));
        if (paths.length >= (options.maxPaths || 20)) break;
        continue;
      }

      if (visited.length >= maxDepth) continue;

      const outgoing = attackGraph.getOutgoingEdges(current);
      for (const edge of outgoing) {
        if (!visited.includes(edge.target)) {
          const nextBoundaries = [...crossedBoundaries];
          if (edge.attributes?.boundaryId) {
            nextBoundaries.push(edge.attributes.boundaryId);
          }
          queue.push({
            current: edge.target,
            visited: [...visited, edge.target],
            crossedBoundaries: nextBoundaries
          });
        }
      }
    }

    // Sort descending by attack value
    paths.sort((a, b) => b.attackValue - a.attackValue || a.pathId.localeCompare(b.pathId));
    return paths;
  }
}
