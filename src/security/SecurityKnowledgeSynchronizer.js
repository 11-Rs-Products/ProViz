/**
 * SecurityKnowledgeSynchronizer.js
 * Bridges Stage 31 security findings, attack graphs, and counterexamples into
 * Stage 28 Knowledge Graph, Stage 29 Semantic Program Model, and Stage 30 Evolution Engine.
 */

import { KnowledgeEntity } from '../knowledge/KnowledgeEntity.js';
import { KnowledgeEdge } from '../knowledge/KnowledgeEdge.js';
import { KnowledgeEntityKind } from '../knowledge/KnowledgeEntityKind.js';
import { KnowledgeRelationKind } from '../knowledge/KnowledgeRelationKind.js';

export class SecurityKnowledgeSynchronizer {
  /**
   * Synchronizes security finding / counterexample to Stage 28 Knowledge Graph.
   * @param {SecurityCounterexample} counterexample
   * @param {KnowledgeGraph} knowledgeGraph
   * @returns {Object}
   */
  syncToKnowledgeGraph(counterexample, knowledgeGraph) {
    if (!counterexample || !knowledgeGraph) return { synced: false };

    // 1. Add Security Finding Entity
    const findingEntity = new KnowledgeEntity({
      id: `finding:${counterexample.id}`,
      kind: KnowledgeEntityKind.FINDING,
      name: `Security Violation: ${counterexample.violatedProperty}`,
      creationStage: 31,
      relatedArtifacts: [counterexample.sensitiveAssetId, counterexample.entryNodeId].filter(Boolean),
      attributes: {
        violatedProperty: counterexample.violatedProperty,
        entry: counterexample.entryNodeId,
        sink: counterexample.sensitiveSinkId
      }
    });
    knowledgeGraph.addEntity(findingEntity);

    // 2. Add Edge from finding to affected asset
    if (counterexample.sensitiveAssetId && knowledgeGraph.getEntity(counterexample.sensitiveAssetId)) {
      knowledgeGraph.addEdge(new KnowledgeEdge({
        id: `edge:finding:${counterexample.id}->affects->${counterexample.sensitiveAssetId}`,
        source: findingEntity.id,
        target: counterexample.sensitiveAssetId,
        relation: KnowledgeRelationKind.VIOLATES,
        confidence: 0.95,
        derivationStage: 31
      }));
    }

    return { synced: true, entityId: findingEntity.id };
  }

  /**
   * Updates Stage 29 Semantic Graph node verification state with security findings.
   * @param {SecurityCounterexample} counterexample
   * @param {SemanticProgramGraph} semanticGraph
   * @returns {Object}
   */
  syncToSemanticModel(counterexample, semanticGraph) {
    if (!counterexample || !semanticGraph) return { updated: false };

    const targetNode = semanticGraph.getNode(counterexample.sensitiveSinkId || counterexample.entryNodeId);
    if (targetNode) {
      const updatedNode = targetNode.withVerificationState('COUNTEREXAMPLE_FOUND');
      semanticGraph.addNode(updatedNode);
      return { updated: true, targetId: targetNode.id };
    }
    return { updated: false };
  }
}
