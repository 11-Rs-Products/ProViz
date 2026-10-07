/**
 * CycleAnalyzer.js
 * Detects and classifies cycles in the semantic program graph (Tarjan's algorithm / DFS).
 */

import { DependencyCycle, CycleClassification } from './DependencyCycle.js';
import { SemanticEntityKind } from './SemanticEntityKind.js';

export class CycleAnalyzer {
  /**
   * Detects cycles in a SemanticProgramGraph.
   */
  detectCycles(programGraph) {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];

    const nodes = programGraph.queryNodes ? programGraph.queryNodes() : [];

    const dfs = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outEdges = programGraph.getOutgoingEdges ? programGraph.getOutgoingEdges(nodeId) : [];
      for (const edge of outEdges) {
        const neighborId = edge.targetId;

        if (!visited.has(neighborId)) {
          dfs(neighborId);
        } else if (recursionStack.has(neighborId)) {
          // Found cycle
          const cycleStartIndex = path.indexOf(neighborId);
          if (cycleStartIndex !== -1) {
            const cycleNodes = path.slice(cycleStartIndex);
            const cycleId = `cycle:${cycleNodes.join('->')}`;

            // Check if already recorded
            if (!cycles.some(c => c.id === cycleId)) {
              let classification = CycleClassification.BENIGN;
              const hasArchitecture = cycleNodes.some(id => {
                const n = programGraph.getNode(id);
                return n && (n.kind === SemanticEntityKind.MODULE || n.kind === SemanticEntityKind.PACKAGE);
              });
              const hasVerification = cycleNodes.some(id => {
                const n = programGraph.getNode(id);
                return n && (n.kind === SemanticEntityKind.PROOF || n.kind === SemanticEntityKind.EVIDENCE);
              });

              if (hasArchitecture) classification = CycleClassification.ARCHITECTURAL;
              else if (hasVerification) classification = CycleClassification.VERIFICATION;
              else classification = CycleClassification.CONTROL;

              cycles.push(new DependencyCycle({
                id: cycleId,
                nodes: [...cycleNodes, neighborId],
                classification,
                description: `Cycle detected between ${cycleNodes.length} entities`
              }));
            }
          }
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return cycles;
  }
}
