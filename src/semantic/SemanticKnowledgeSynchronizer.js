/**
 * SemanticKnowledgeSynchronizer.js
 * Manages bidirectional synchronization between Stage 28 VerificationKnowledgeGraph
 * and Stage 29 SemanticProgramGraph.
 */

import { SemanticEntityKind } from './SemanticEntityKind.js';
import { SemanticRelationKind } from './SemanticRelationKind.js';
import { SemanticNode } from './SemanticNode.js';
import { SemanticEdge } from './SemanticEdge.js';

export class SemanticKnowledgeSynchronizer {
  /**
   * Synchronizes knowledge graph artifacts into the semantic program graph.
   */
  syncKnowledgeToSemantic(knowledgeGraph, semanticGraph) {
    if (!knowledgeGraph || !semanticGraph) return { syncedNodes: 0, syncedEdges: 0 };

    let syncedNodes = 0;
    let syncedEdges = 0;

    const entities = knowledgeGraph.getEntities ? knowledgeGraph.getEntities() : (knowledgeGraph.getAllEntities ? knowledgeGraph.getAllEntities() : []);
    for (const entity of entities) {
      if (!semanticGraph.hasNode(entity.id)) {
        semanticGraph.addNode(new SemanticNode({
          id: entity.id,
          kind: entity.kind || SemanticEntityKind.EVIDENCE,
          name: entity.name || entity.id,
          sourceRange: entity.sourceLocation,
          provenanceRefs: entity.relatedArtifacts || [],
          attributes: { stage: entity.creationStage, syncedFrom: 'knowledgeGraph' }
        }));
        syncedNodes++;
      }
    }

    const edges = knowledgeGraph.getEdges ? knowledgeGraph.getEdges() : (knowledgeGraph.getAllEdges ? knowledgeGraph.getAllEdges() : []);
    for (const edge of edges) {
      const source = edge.sourceId || edge.source;
      const target = edge.targetId || edge.target;
      if (source && target && semanticGraph.hasNode(source) && semanticGraph.hasNode(target)) {
        const edgeId = `sync:${edge.id}`;
        if (!semanticGraph.getEdge(edgeId)) {
          semanticGraph.addEdge(new SemanticEdge({
            id: edgeId,
            sourceId: source,
            targetId: target,
            relation: edge.relation || SemanticRelationKind.DEPENDS_ON,
            confidence: edge.confidence || 1.0,
            provenance: edge.provenance || []
          }));
          syncedEdges++;
        }
      }
    }

    return { syncedNodes, syncedEdges };
  }

  /**
   * Propagates semantic invalidation results back into the knowledge graph.
   */
  syncSemanticToKnowledge(semanticGraph, knowledgeGraph) {
    if (!semanticGraph || !knowledgeGraph) return { updatedEntities: 0 };

    let updatedEntities = 0;
    const nodes = semanticGraph.queryNodes ? semanticGraph.queryNodes() : [];

    for (const node of nodes) {
      if (node.verificationState === 'STALE' || node.verificationState === 'INVALID') {
        const kEntity = knowledgeGraph.getEntity ? knowledgeGraph.getEntity(node.id) : null;
        if (kEntity && knowledgeGraph.updateEntityVerificationState) {
          knowledgeGraph.updateEntityVerificationState(node.id, node.verificationState);
          updatedEntities++;
        }
      }
    }

    return { updatedEntities };
  }
}
