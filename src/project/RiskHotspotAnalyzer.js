/**
 * RiskHotspotAnalyzer.js
 * Identifies high-risk components and dependencies using:
 * HotspotRisk(n) = ChangeFrequency(n) * BlastRadius(n) * FailureProbability(n) * Impact(n)
 */

import { RiskHotspot } from './RiskHotspot.js';
import { ProjectRelationKind } from './ProjectRelation.js';

export class RiskHotspotAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   * @param {Object} [inputs={}]
   * @param {Object<string, number>} [inputs.changeFrequencies={}]
   * @param {Object<string, number>} [inputs.failureProbabilities={}]
   * @param {Object<string, number>} [inputs.impacts={}]
   */
  analyze(graph, inputs = {}) {
    if (!graph) throw new Error('RiskHotspotAnalyzer requires graph');
    const {
      changeFrequencies = {},
      failureProbabilities = {},
      impacts = {}
    } = inputs;

    const nodes = graph.getNodes();
    const hotspots = [];
    const n = Math.max(1, nodes.length);

    for (const node of nodes) {
      const blastRadiusNodes = graph.getTransitiveClosure(node.id, 'in', ProjectRelationKind.DEPENDS_ON);
      const blastRadius = blastRadiusNodes.length;
      const normalizedBlastRadius = blastRadius / n;

      const changeFreq = changeFrequencies[node.id] !== undefined ? changeFrequencies[node.id] : 0.2;
      const failureProb = failureProbabilities[node.id] !== undefined ? failureProbabilities[node.id] : 0.1;
      const impact = impacts[node.id] !== undefined ? impacts[node.id] : (0.2 + 0.8 * normalizedBlastRadius);

      const riskScore = changeFreq * (0.1 + normalizedBlastRadius) * failureProb * impact;

      const contributingFactors = [];
      if (changeFreq > 0.4) contributingFactors.push('High change frequency');
      if (blastRadius > 3) contributingFactors.push(`Large blast radius (${blastRadius} nodes)`);
      if (failureProb > 0.2) contributingFactors.push('Elevated failure probability');
      if (impact > 0.5) contributingFactors.push('High systemic impact');

      let severity = 'LOW';
      if (riskScore > 0.05) severity = 'CRITICAL';
      else if (riskScore > 0.02) severity = 'HIGH';
      else if (riskScore > 0.005) severity = 'MEDIUM';

      hotspots.push(new RiskHotspot({
        entityId: node.id,
        changeFrequency: changeFreq,
        blastRadius,
        failureProbability: failureProb,
        impact,
        hotspotRisk: riskScore,
        severity,
        contributingFactors
      }));
    }

    hotspots.sort((a, b) => b.hotspotRisk - a.hotspotRisk);

    return {
      timestamp: Date.now(),
      totalAnalyzed: hotspots.length,
      criticalCount: hotspots.filter(h => h.severity === 'CRITICAL').length,
      highCount: hotspots.filter(h => h.severity === 'HIGH').length,
      hotspots,
      topHotspots: hotspots.slice(0, 10)
    };
  }
}
