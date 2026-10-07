/**
 * ProjectVerificationGapAnalyzer.js
 * Scans public APIs, security boundaries, and high-risk entities to uncover verification gaps.
 */

import { ProjectVerificationGap } from './ProjectVerificationGap.js';
import { ProjectRelationKind } from './ProjectRelation.js';

export class ProjectVerificationGapAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   */
  analyze(graph) {
    if (!graph) throw new Error('ProjectVerificationGapAnalyzer requires graph');
    const nodes = graph.getNodes();
    const gaps = [];

    for (const node of nodes) {
      // 1. Missing contracts on public APIs
      if (node.kind === 'API' && !node.attributes.hasContract) {
        const contracts = graph.getIncomingEdges(node.id, ProjectRelationKind.DEFINES_CONTRACT);
        if (contracts.length === 0) {
          gaps.push(new ProjectVerificationGap({
            id: `GAP_API_${node.id}`,
            entityId: node.id,
            gapKind: 'MISSING_CONTRACT',
            description: `Public API ${node.name || node.id} has no formal verification contract`,
            criticality: 'HIGH'
          }));
        }
      }

      // 2. Security boundaries without threat models or proofs
      if (node.kind === 'SECURITY_BOUNDARY' && !node.attributes.isVerified) {
        gaps.push(new ProjectVerificationGap({
          id: `GAP_SEC_${node.id}`,
          entityId: node.id,
          gapKind: 'MISSING_SECURITY_VERIFICATION',
          description: `Security boundary ${node.name || node.id} lacks complete adversarial verification evidence`,
          criticality: 'CRITICAL'
        }));
      }

      // 3. Obligations that are stale or unverified
      if (node.kind === 'VERIFICATION_OBLIGATION') {
        const incoming = graph.getIncomingEdges(node.id, ProjectRelationKind.VERIFIES);
        if (node.attributes.isStale) {
          gaps.push(new ProjectVerificationGap({
            id: `GAP_STALE_${node.id}`,
            entityId: node.id,
            gapKind: 'STALE_EVIDENCE',
            description: `Verification obligation ${node.name || node.id} has invalidated or stale evidence`,
            criticality: 'HIGH'
          }));
        } else if (incoming.length === 0 && !node.attributes.isVerified) {
          gaps.push(new ProjectVerificationGap({
            id: `GAP_UNVERIF_${node.id}`,
            entityId: node.id,
            gapKind: 'UNVERIFIED_OBLIGATION',
            description: `Verification obligation ${node.name || node.id} is unverified`,
            criticality: 'MEDIUM'
          }));
        }
      }
    }

    return {
      timestamp: Date.now(),
      gapCount: gaps.length,
      criticalGapsCount: gaps.filter(g => g.criticality === 'CRITICAL').length,
      gaps
    };
  }
}
