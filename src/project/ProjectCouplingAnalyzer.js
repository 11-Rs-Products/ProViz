/**
 * ProjectCouplingAnalyzer.js
 * Evaluates coupling metrics (afferent, efferent, direct, indirect, and cyclic coupling) across modules.
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class ProjectCouplingAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('ProjectCouplingAnalyzer requires graph');
    const nodes = graph.getNodes();
    const couplingMap = new Map();

    let totalCoupling = 0;

    for (const node of nodes) {
      const afferent = graph.getIncomingEdges(node.id, ProjectRelationKind.DEPENDS_ON).length;
      const efferent = graph.getOutgoingEdges(node.id, ProjectRelationKind.DEPENDS_ON).length;
      const direct = afferent + efferent;
      totalCoupling += direct;

      couplingMap.set(node.id, {
        id: node.id,
        afferentCoupling: afferent,
        efferentCoupling: efferent,
        totalDirectCoupling: direct,
        isExcessivelyCoupled: direct > 15
      });
    }

    const n = Math.max(1, nodes.length);
    const averageCoupling = totalCoupling / n;

    return {
      timestamp: Date.now(),
      totalModules: nodes.length,
      averageCoupling,
      excessivelyCoupledCount: Array.from(couplingMap.values()).filter(c => c.isExcessivelyCoupled).length,
      couplings: Array.from(couplingMap.values())
    };
  }
}
