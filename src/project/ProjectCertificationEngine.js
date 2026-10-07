/**
 * ProjectCertificationEngine.js
 * Generates official ProjectCertificates by synthesizing governance decisions, verification portfolios, and risk audits.
 */

import { ProjectCertificate } from './ProjectCertificate.js';
import { ProjectCertificateScope } from './ProjectCertificateScope.js';

export class ProjectCertificationEngine {
  /**
   * Issue a project certificate
   * @param {Object} params
   * @param {string} params.projectId
   * @param {number} params.revision
   * @param {import('./ProjectGraph.js').ProjectGraph} params.graph
   * @param {import('./GovernanceDecision.js').GovernanceDecision} params.governanceDecision
   * @param {import('./EngineeringHealth.js').EngineeringHealth} [params.health]
   * @param {Object} [params.verificationPortfolio]
   * @param {Object[]} [params.knownGaps=[]]
   * @param {Object[]} [params.knownRisks=[]]
   * @param {string[]} [params.assumptions=[]]
   */
  certify(params) {
    const {
      projectId,
      revision = 1,
      graph,
      governanceDecision,
      health,
      verificationPortfolio,
      knownGaps = [],
      knownRisks = [],
      assumptions = [
        'Deterministic hardware execution model',
        'Standard memory consistency guarantees',
        'Unmodified third-party compiler invariants'
      ]
    } = params;

    if (!projectId || !governanceDecision) {
      throw new Error('ProjectCertificationEngine requires projectId and governanceDecision');
    }

    const modules = graph ? graph.getNodes().filter(n => n.kind === 'MODULE').map(n => n.id) : [];

    const scope = new ProjectCertificateScope({
      projectId,
      revision,
      modules,
      assumptions
    });

    let status = 'REJECTED';
    if (governanceDecision.isPassed && (!health || health.isHealthy)) {
      status = 'CERTIFIED';
    } else if (governanceDecision.outcome === 'CONDITIONALLY_PASSED' || (governanceDecision.violations.length > 0 && !governanceDecision.isBlocked)) {
      status = 'CONDITIONALLY_CERTIFIED';
    }

    const evidenceSummary = {
      healthScore: health ? health.getCompositeScore() : 1.0,
      verificationRate: verificationPortfolio ? verificationPortfolio.verificationRate : 1.0,
      violationsCount: governanceDecision.violations.length,
      timestamp: Date.now()
    };

    return new ProjectCertificate({
      id: `CERT_${projectId}_REV${revision}_${Date.now()}`,
      scope,
      status,
      governanceDecision: governanceDecision.toJSON(),
      evidenceSummary,
      knownGaps,
      knownRisks,
      assumptions,
      provenance: {
        engine: 'ProViz.ProjectCertificationEngine',
        version: '1.0.0'
      },
      timestamp: Date.now()
    });
  }
}
