import { ImpactStatus, KnowledgeChangeKind } from './KnowledgeChange.js';
import { KnowledgeRelationKind } from './KnowledgeRelationKind.js';

/**
 * Computes downstream impact and invalidation across knowledge and evidence graphs
 */
export class ImpactPropagation {
  static propagateImpact(change, knowledgeGraph) {
    if (!change || !knowledgeGraph) {
      return {
        change,
        impactedEntities: new Map()
      };
    }

    const impactedMap = new Map(); // entityId -> ImpactStatus
    impactedMap.set(change.targetEntityId, ImpactStatus.INVALID);

    const queue = [change.targetEntityId];
    const visited = new Set([change.targetEntityId]);

    while (queue.length > 0) {
      const currentId = queue.shift();
      const outgoing = knowledgeGraph.getOutgoingEdges(currentId);

      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);

          let status = ImpactStatus.REQUIRES_REVERIFICATION;
          if (edge.relation === KnowledgeRelationKind.PROVES || edge.relation === KnowledgeRelationKind.DERIVES_FROM) {
            status = ImpactStatus.INVALID;
          } else if (edge.relation === KnowledgeRelationKind.DEPENDS_ON || edge.relation === KnowledgeRelationKind.SUPPORTS) {
            status = ImpactStatus.STALE;
          }

          impactedMap.set(edge.target, status);
          queue.push(edge.target);
        }
      }
    }

    return {
      change,
      impactedEntities: impactedMap,
      invalidCount: Array.from(impactedMap.values()).filter(s => s === ImpactStatus.INVALID).length,
      staleCount: Array.from(impactedMap.values()).filter(s => s === ImpactStatus.STALE).length,
      reverificationCount: Array.from(impactedMap.values()).filter(s => s === ImpactStatus.REQUIRES_REVERIFICATION).length
    };
  }
}

/**
 * Propagates staleness monotonically until explicit reverification
 */
export class StalenessPropagator {
  constructor(evidenceDependencyGraph) {
    this.dependencyGraph = evidenceDependencyGraph;
    this._staleSet = new Set();
    this._invalidSet = new Set();
  }

  markChanged(evidenceId) {
    this._invalidSet.add(evidenceId);
    const downstream = this.dependencyGraph.getInvalidationImpact(evidenceId);
    for (const d of downstream) {
      this._staleSet.add(d);
    }
    return {
      invalidated: [evidenceId],
      stale: downstream
    };
  }

  isStale(evidenceId) {
    return this._staleSet.has(evidenceId);
  }

  isInvalid(evidenceId) {
    return this._invalidSet.has(evidenceId);
  }

  reverify(evidenceId) {
    this._staleSet.delete(evidenceId);
    this._invalidSet.delete(evidenceId);
  }

  getAllStale() {
    return Array.from(this._staleSet);
  }

  getAllInvalid() {
    return Array.from(this._invalidSet);
  }
}
