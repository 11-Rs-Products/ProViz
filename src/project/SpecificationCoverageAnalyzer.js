/**
 * SpecificationCoverageAnalyzer.js
 * Analyzes requirement entities, formal specifications, and implementation mappings.
 */

import { RequirementCoverage } from './RequirementCoverage.js';
import { ProjectRelationKind } from './ProjectRelation.js';

export class SpecificationCoverageAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('SpecificationCoverageAnalyzer requires graph');
    const nodes = graph.getNodes();
    const requirements = nodes.filter(n => n.kind === 'SPECIFICATION' && n.attributes.isRequirement);
    const totalRequirements = requirements.length;

    let specified = 0;
    let implemented = 0;
    let verified = 0;

    const details = {};

    for (const req of requirements) {
      const outgoingConstrains = graph.getOutgoingEdges(req.id, ProjectRelationKind.CONSTRAINS);
      const incomingVerifies = graph.getIncomingEdges(req.id, ProjectRelationKind.VERIFIES);

      const isSpecified = req.attributes.hasFormalSpec || outgoingConstrains.length > 0;
      const isImplemented = outgoingConstrains.some(e => graph.getNode(e.to)?.kind === 'MODULE' || graph.getNode(e.to)?.kind === 'FILE');
      const isVerified = incomingVerifies.length > 0 || req.attributes.isVerified;

      if (isSpecified) specified++;
      if (isImplemented) implemented++;
      if (isVerified) verified++;

      details[req.id] = {
        isSpecified,
        isImplemented,
        isVerified,
        targets: outgoingConstrains.map(e => e.to)
      };
    }

    return new RequirementCoverage({
      totalRequirements,
      specifiedRequirements: specified,
      implementedRequirements: implemented,
      verifiedRequirements: verified,
      details
    });
  }
}
