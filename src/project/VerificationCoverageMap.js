/**
 * VerificationCoverageMap.js
 * Visualizable mapping of verification completeness across modules and packages.
 */

import { ProjectRelationKind } from './ProjectRelation.js';

export class VerificationCoverageMap {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  constructor(graph) {
    this.graph = graph;
  }

  generateMap() {
    if (!this.graph) throw new Error('VerificationCoverageMap requires graph');
    const nodes = this.graph.getNodes();
    const modules = nodes.filter(n => n.kind === 'MODULE' || n.kind === 'FILE');

    const coverageMap = {};
    let totalVerified = 0;

    for (const mod of modules) {
      const obligations = this.graph.getIncomingEdges(mod.id, ProjectRelationKind.CONSTRAINS)
        .map(e => this.graph.getNode(e.from))
        .filter(n => n && n.kind === 'VERIFICATION_OBLIGATION');

      const verifiedCount = obligations.filter(o => o.attributes.isVerified).length;
      const isVerified = obligations.length > 0 ? (verifiedCount === obligations.length) : Boolean(mod.attributes.isVerified);

      if (isVerified) totalVerified++;

      coverageMap[mod.id] = {
        name: mod.name,
        path: mod.path,
        totalObligations: obligations.length,
        verifiedObligations: verifiedCount,
        isFullyVerified: isVerified
      };
    }

    const total = Math.max(1, modules.length);
    const overallRate = Number((totalVerified / total).toFixed(4));

    return {
      timestamp: Date.now(),
      totalModules: modules.length,
      verifiedModulesCount: totalVerified,
      overallCoverageRate: overallRate,
      moduleCoverage: coverageMap
    };
  }
}
