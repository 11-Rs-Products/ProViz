import { RootCauseCandidate } from './RootCauseCandidate.js';

/**
 * Multi-step root-cause intelligence engine traversing causal chains back to foundational triggers
 */
export class RootCauseAnalyzer {
  constructor(causalGraph, knowledgeGraph = null) {
    this.causalGraph = causalGraph;
    this.knowledgeGraph = knowledgeGraph;
  }

  analyze(effectId, maxDepth = 10) {
    const chain = this.causalGraph.getCausalChain(effectId, maxDepth);
    if (!chain || chain.length === 0) {
      return {
        targetEffect: effectId,
        chain: [effectId],
        candidates: [],
        primaryCause: null,
        explanation: `No causal links found leading to '${effectId}'`
      };
    }

    const candidates = [];

    // Traverse all nodes in causal chain
    for (let i = 0; i < chain.length - 1; i++) {
      const node = chain[i];
      const entity = this.knowledgeGraph ? this.knowledgeGraph.getEntity(node) : null;
      const desc = entity ? `${entity.kind}: ${entity.name}` : `Entity '${node}'`;

      const candidate = new RootCauseCandidate({
        entityId: node,
        description: desc,
        causalStrength: 1.0 - (i * 0.05),
        evidenceSupport: 0.95,
        coverage: 1.0,
        temporalConsistency: 1.0,
        confoundingRisk: 0.05 * i,
        causalPath: chain.slice(i)
      });
      candidates.push(candidate);
    }

    // Sort deterministically: highest score first, then tie-breaking by entityId
    candidates.sort((a, b) => {
      const diff = b.score - a.score;
      if (Math.abs(diff) > 1e-6) return diff;
      return a.entityId.localeCompare(b.entityId);
    });

    const primaryCause = candidates.length > 0 ? candidates[0] : null;

    const explanation = primaryCause
      ? `Root cause for '${effectId}' identified as '${primaryCause.entityId}' (${primaryCause.description}) with causal score ${primaryCause.score.toFixed(4)} along chain: ${chain.join(' -> ')}`
      : `Single point occurrence for '${effectId}'`;

    return {
      targetEffect: effectId,
      chain,
      candidates,
      primaryCause,
      explanation
    };
  }
}
