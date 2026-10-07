/**
 * TraceabilityAnalyzer.js
 * Builds a project-wide TraceabilityMatrix connecting requirements, specifications, implementations, tests, verification obligations, and evidence.
 */

import { TraceabilityMatrix, TraceabilityLink } from './TraceabilityMatrix.js';
import { ProjectRelationKind } from './ProjectRelation.js';

export class TraceabilityAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('TraceabilityAnalyzer requires graph');
    const nodes = graph.getNodes();
    const requirements = nodes.filter(n => n.kind === 'SPECIFICATION' && n.attributes.isRequirement);
    const implementations = nodes.filter(n => n.kind === 'MODULE' || n.kind === 'FILE');

    const linkedImpls = new Set();
    const links = [];
    const orphanRequirements = [];

    for (const req of requirements) {
      const outEdges = graph.getOutgoingEdges(req.id);
      const specEdge = outEdges.find(e => graph.getNode(e.to)?.kind === 'SPECIFICATION');
      const specId = specEdge ? specEdge.to : (req.attributes.specificationId || null);

      const implEdges = outEdges.filter(e => {
        const target = graph.getNode(e.to);
        return target && (target.kind === 'MODULE' || target.kind === 'FILE');
      });
      const implIds = implEdges.map(e => e.to);
      implIds.forEach(id => linkedImpls.add(id));

      const testEdges = outEdges.filter(e => graph.getNode(e.to)?.kind === 'TEST');
      const testIds = testEdges.map(e => e.to);

      const obEdges = outEdges.filter(e => graph.getNode(e.to)?.kind === 'VERIFICATION_OBLIGATION');
      const obIds = obEdges.map(e => e.to);

      // Incoming evidence
      const evEdges = graph.getIncomingEdges(req.id, ProjectRelationKind.VERIFIES);
      const evIds = evEdges.map(e => e.from);

      if (implIds.length === 0 && !specId) {
        orphanRequirements.push(req.id);
      }

      links.push(new TraceabilityLink({
        requirementId: req.id,
        specificationId: specId,
        implementationIds: implIds,
        testIds,
        obligationIds: obIds,
        evidenceIds: evIds,
        certificateId: req.attributes.certificateId || null
      }));
    }

    const orphanImplementations = [];
    for (const impl of implementations) {
      if (!linkedImpls.has(impl.id) && !impl.attributes.isInternalUtility) {
        orphanImplementations.push(impl.id);
      }
    }

    return new TraceabilityMatrix({
      links,
      orphanRequirements,
      orphanImplementations
    });
  }
}
