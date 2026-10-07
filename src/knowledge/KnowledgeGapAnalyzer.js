/**
 * Identifies semantic gaps in the knowledge graph that become goals for Stage 25 planning
 */
export class KnowledgeGapAnalyzer {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
  }

  detectGaps() {
    const gaps = [];

    const entities = this.knowledgeGraph.getEntities();
    for (const entity of entities) {
      // 1. Orphan Evidence (Evidence without supporting target)
      if (entity.kind === 'EVIDENCE' || entity.kind === 'PROOF') {
        const outgoing = this.knowledgeGraph.getOutgoingEdges(entity.id);
        if (outgoing.length === 0) {
          gaps.push({
            gapKind: 'ORPHAN_EVIDENCE',
            entityId: entity.id,
            description: `Evidence '${entity.id}' does not prove or support any property or goal`,
            severity: 'MEDIUM'
          });
        }
      }

      // 2. Unsupported Claim (Property without incoming proof or evidence)
      if (entity.kind === 'PROPERTY' || entity.kind === 'INVARIANT') {
        const incoming = this.knowledgeGraph.getIncomingEdges(entity.id);
        const hasProof = incoming.some(e => e.relation === 'PROVES' || e.relation === 'SUPPORTS');
        if (!hasProof) {
          gaps.push({
            gapKind: 'UNSUPPORTED_CLAIM',
            entityId: entity.id,
            description: `Property/Invariant '${entity.id}' lacks formal proof or empirical evidence`,
            severity: 'HIGH'
          });
        }
      }

      // 3. Unknown Cause (Finding without causal links)
      if (entity.kind === 'FINDING' || entity.kind === 'ANOMALY') {
        const incoming = this.knowledgeGraph.getIncomingEdges(entity.id);
        const hasCause = incoming.some(e => e.relation === 'CAUSES' || e.relation === 'TRIGGERS');
        if (!hasCause) {
          gaps.push({
            gapKind: 'UNKNOWN_CAUSE',
            entityId: entity.id,
            description: `Finding '${entity.id}' has no identified root cause`,
            severity: 'HIGH'
          });
        }
      }

      // 4. Untraceable Specification
      if (entity.kind === 'SPECIFICATION') {
        const outgoing = this.knowledgeGraph.getOutgoingEdges(entity.id);
        if (outgoing.length === 0) {
          gaps.push({
            gapKind: 'UNTRACEABLE_SPECIFICATION',
            entityId: entity.id,
            description: `Specification '${entity.id}' is not linked to any contract, function or test`,
            severity: 'LOW'
          });
        }
      }
    }

    return gaps;
  }
}
