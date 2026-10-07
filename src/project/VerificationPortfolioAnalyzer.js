/**
 * VerificationPortfolioAnalyzer.js
 * Scans project nodes, contracts, continuous verification history, and obligations to synthesize VerificationPortfolio.
 */

import { VerificationPortfolio } from './VerificationPortfolio.js';
import { ProjectRelationKind } from './ProjectRelation.js';

export class VerificationPortfolioAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('VerificationPortfolioAnalyzer requires graph');
    const nodes = graph.getNodes();
    const obligations = nodes.filter(n => n.kind === 'VERIFICATION_OBLIGATION');

    let verified = 0;
    let failed = 0;
    let unverified = 0;
    let stale = 0;

    const engineBreakdown = {};
    const obligationDetails = {};

    for (const ob of obligations) {
      const incomingEvidence = graph.getIncomingEdges(ob.id, ProjectRelationKind.VERIFIES);
      const isStale = Boolean(ob.attributes.isStale);
      const isFailed = Boolean(ob.attributes.isFailed);
      const isVerified = incomingEvidence.length > 0 && !isStale && !isFailed;

      const engine = ob.attributes.engine || 'default';
      engineBreakdown[engine] = (engineBreakdown[engine] || 0) + 1;

      if (isFailed) failed++;
      else if (isStale) stale++;
      else if (isVerified) verified++;
      else unverified++;

      obligationDetails[ob.id] = {
        name: ob.name,
        engine,
        isVerified,
        isFailed,
        isStale,
        evidenceCount: incomingEvidence.length
      };
    }

    return new VerificationPortfolio({
      totalObligations: obligations.length,
      verifiedObligations: verified,
      failedObligations: failed,
      unverifiedObligations: unverified,
      staleObligations: stale,
      engineBreakdown,
      obligationDetails
    });
  }
}
