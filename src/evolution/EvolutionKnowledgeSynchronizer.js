/**
 * EvolutionKnowledgeSynchronizer.js
 * Bridges Stage 30 transformations and verification evidence into
 * Stage 28 Knowledge Graph and Stage 29 Semantic Program Model.
 */

import { KnowledgeEntity } from '../knowledge/KnowledgeEntity.js';
import { KnowledgeEdge } from '../knowledge/KnowledgeEdge.js';
import { KnowledgeEntityKind } from '../knowledge/KnowledgeEntityKind.js';
import { KnowledgeRelationKind } from '../knowledge/KnowledgeRelationKind.js';

export class EvolutionKnowledgeSynchronizer {
  /**
   * Records transformation and decisions into the Stage 28 Knowledge Graph.
   */
  syncToKnowledgeGraph(candidate, decision, knowledgeGraph) {
    if (!candidate || !decision || !knowledgeGraph) return { synced: false };

    // 1. Add Transformation / Patch Entity
    const transEntity = new KnowledgeEntity({
      id: `trans:${candidate.candidateId}`,
      kind: KnowledgeEntityKind.PATCH,
      name: candidate.transformation.kind,
      creationStage: 30,
      relatedArtifacts: [candidate.transformation.sourceScope],
      attributes: {
        intent: candidate.transformation.semanticIntent,
        decision: decision.outcome
      }
    });
    knowledgeGraph.addEntity(transEntity);

    // 2. Add Edge from transformation to target
    if (knowledgeGraph.getEntity(candidate.transformation.sourceScope)) {
      knowledgeGraph.addEdge(new KnowledgeEdge({
        id: `edge:trans:${candidate.candidateId}->modifies->${candidate.transformation.sourceScope}`,
        source: transEntity.id,
        target: candidate.transformation.sourceScope,
        relation: KnowledgeRelationKind.MODIFIES,
        confidence: decision.confidence,
        derivationStage: 30
      }));
    }

    return { synced: true, entityId: transEntity.id };
  }

  /**
   * Updates Stage 29 Semantic Model with verified transformation outcomes.
   */
  syncToSemanticModel(candidate, semanticGraph) {
    if (!candidate || !semanticGraph) return { updated: false };

    const targetNode = semanticGraph.getNode(candidate.transformation.sourceScope);
    if (targetNode) {
      const updatedNode = targetNode.withVerificationState('VERIFIED');
      semanticGraph.addNode(updatedNode);
      return { updated: true, targetId: targetNode.id };
    }
    return { updated: false };
  }
}
