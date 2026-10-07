/**
 * Formatted explanation of a verification finding, proof, repair, or decision
 */
export class VerificationExplanation {
  constructor({
    targetEntityId,
    style = 'SUMMARY', // SUMMARY, DETAILED, CAUSAL, PROVENANCE, EVIDENCE, DEBUGGER, MACHINE_READABLE
    text = '',
    causalChain = [],
    supportingEvidence = [],
    origin = null,
    metadata = {}
  } = {}) {
    this.targetEntityId = targetEntityId;
    this.style = style;
    this.text = text;
    this.causalChain = Object.freeze([...causalChain]);
    this.supportingEvidence = Object.freeze([...supportingEvidence]);
    this.origin = origin;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      targetEntityId: this.targetEntityId,
      style: this.style,
      text: this.text,
      causalChain: [...this.causalChain],
      supportingEvidence: [...this.supportingEvidence],
      origin: this.origin,
      metadata: { ...this.metadata }
    };
  }
}

/**
 * Universal explanation engine turning knowledge graph traversals into structured human & debugger explanations
 */
export class KnowledgeExplanationEngine {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
  }

  explain(entityId, style = 'SUMMARY') {
    const entity = this.knowledgeGraph.getEntity(entityId);
    if (!entity) {
      return new VerificationExplanation({
        targetEntityId: entityId,
        style,
        text: `Entity '${entityId}' not found in knowledge graph.`
      });
    }

    const ancestors = this.knowledgeGraph.getAncestors(entityId, { maxDepth: 5 });
    const descendants = this.knowledgeGraph.getDescendants(entityId, { maxDepth: 5 });

    let text = '';
    switch (style) {
      case 'CAUSAL':
        text = `Entity '${entity.name}' (${entity.kind}) causally derived from [${ancestors.map(a => a.name).join(' -> ')}].`;
        break;
      case 'PROVENANCE':
        text = `Provenance chain for '${entity.name}': Origin at stage ${entity.creationStage} (${entity.sourceArtifact || 'workspace'}), linked to ${ancestors.length} upstream ancestors.`;
        break;
      case 'EVIDENCE':
        text = `Evidence basis for '${entity.name}': Supported by ${ancestors.filter(a => a.kind === 'EVIDENCE' || a.kind === 'PROOF').length} verification artifacts.`;
        break;
      case 'DEBUGGER':
        text = `[ProViz Knowledge Debugger] ${entity.kind} '${entity.name}' (Stage ${entity.creationStage}) | In: ${ancestors.length}, Out: ${descendants.length}`;
        break;
      case 'DETAILED':
        text = `Detailed Knowledge Breakdown for '${entity.name}' (${entity.kind}):
- ID: ${entity.id}
- Stage: ${entity.creationStage}
- Upstream Ancestors: ${ancestors.map(a => a.id).join(', ') || 'None'}
- Downstream Descendants: ${descendants.map(d => d.id).join(', ') || 'None'}`;
        break;
      case 'SUMMARY':
      default:
        text = `Knowledge entity '${entity.name}' (${entity.kind}) recorded at Stage ${entity.creationStage}.`;
        break;
    }

    return new VerificationExplanation({
      targetEntityId: entityId,
      style,
      text,
      causalChain: ancestors.map(a => a.id),
      supportingEvidence: ancestors.filter(a => a.kind === 'EVIDENCE').map(a => a.id),
      origin: entity.sourceLocation?.file || entity.sourceArtifact
    });
  }
}
