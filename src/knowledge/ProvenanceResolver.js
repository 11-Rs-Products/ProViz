import { ProvenanceArtifact } from './ProvenanceArtifact.js';
import { ProvenanceChain } from './ProvenanceChain.js';
import { KnowledgeRelationKind } from './KnowledgeRelationKind.js';

/**
 * Automatically traces and resolves complete cross-stage provenance chains
 */
export class ProvenanceResolver {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
  }

  resolveChain(entityId) {
    const targetEntity = this.knowledgeGraph.getEntity(entityId);
    if (!targetEntity) return null;

    const targetArtifact = new ProvenanceArtifact({
      artifactId: targetEntity.id,
      entityKind: targetEntity.kind,
      stage: targetEntity.creationStage,
      sourceFile: targetEntity.sourceLocation?.file || targetEntity.sourceArtifact,
      sourceLocation: targetEntity.sourceLocation,
      fingerprint: targetEntity.semanticFingerprint
    });

    // Traverse ancestor relationships (DERIVES_FROM, DEPENDS_ON, CAUSES, VALIDATES)
    const visited = new Set([entityId]);
    const links = [];
    const queue = [entityId];

    const provenanceRelations = new Set([
      KnowledgeRelationKind.DERIVES_FROM,
      KnowledgeRelationKind.DEPENDS_ON,
      KnowledgeRelationKind.CAUSES,
      KnowledgeRelationKind.TRIGGERS,
      KnowledgeRelationKind.PROVES,
      KnowledgeRelationKind.SUPPORTS,
      KnowledgeRelationKind.VALIDATES,
      KnowledgeRelationKind.COVERS
    ]);

    while (queue.length > 0) {
      const currentId = queue.shift();
      const incoming = this.knowledgeGraph.getIncomingEdges(currentId);

      for (const edge of incoming) {
        if (provenanceRelations.has(edge.relation)) {
          if (!visited.has(edge.source)) {
            visited.add(edge.source);
            const sourceEntity = this.knowledgeGraph.getEntity(edge.source);
            if (sourceEntity) {
              links.push(new ProvenanceArtifact({
                artifactId: sourceEntity.id,
                entityKind: sourceEntity.kind,
                stage: sourceEntity.creationStage,
                sourceFile: sourceEntity.sourceLocation?.file || sourceEntity.sourceArtifact,
                sourceLocation: sourceEntity.sourceLocation,
                fingerprint: sourceEntity.semanticFingerprint
              }));
              queue.push(edge.source);
            }
          }
        }
      }
    }

    return new ProvenanceChain({
      targetArtifact,
      links
    });
  }
}
