/**
 * Conflict categories in the verification knowledge graph
 */
export const KnowledgeConflictKind = Object.freeze({
  FACTUAL_CONFLICT: 'FACTUAL_CONFLICT',
  TEMPORAL_CONFLICT: 'TEMPORAL_CONFLICT',
  SCOPE_CONFLICT: 'SCOPE_CONFLICT',
  CAUSAL_CONFLICT: 'CAUSAL_CONFLICT',
  PROVENANCE_CONFLICT: 'PROVENANCE_CONFLICT',
  DEPENDENCY_CONFLICT: 'DEPENDENCY_CONFLICT',
  SPECIFICATION_CONFLICT: 'SPECIFICATION_CONFLICT',
  ENVIRONMENT_CONFLICT: 'ENVIRONMENT_CONFLICT',
  SEMANTIC_CONFLICT: 'SEMANTIC_CONFLICT',
  EVIDENCE_CONFLICT: 'EVIDENCE_CONFLICT'
});

export class KnowledgeConflict {
  constructor({
    conflictId,
    conflictKind = KnowledgeConflictKind.EVIDENCE_CONFLICT,
    entityAId,
    entityBId,
    claim = '',
    scopeA = 'GLOBAL',
    scopeB = 'GLOBAL',
    environmentA = null,
    environmentB = null,
    details = {},
    timestamp = Date.now()
  } = {}) {
    this.conflictId = conflictId || `conflict-${Math.random().toString(36).slice(2, 9)}`;
    this.conflictKind = conflictKind;
    this.entityAId = entityAId;
    this.entityBId = entityBId;
    this.claim = claim;
    this.scopeA = scopeA;
    this.scopeB = scopeB;
    this.environmentA = environmentA;
    this.environmentB = environmentB;
    this.details = Object.freeze({ ...details });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      conflictId: this.conflictId,
      conflictKind: this.conflictKind,
      entityAId: this.entityAId,
      entityBId: this.entityBId,
      claim: this.claim,
      scopeA: this.scopeA,
      scopeB: this.scopeB,
      environmentA: this.environmentA,
      environmentB: this.environmentB,
      details: { ...this.details },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json = {}) {
    return new KnowledgeConflict(json);
  }
}

/**
 * Generates structured semantic explanations for knowledge conflicts
 */
export class ConflictExplanation {
  static explain(conflict) {
    if (!conflict) return 'No conflict to explain';

    const reasons = [];
    if (conflict.scopeA !== conflict.scopeB) {
      reasons.push(`Analysis scopes differ: '${conflict.scopeA}' vs '${conflict.scopeB}'`);
    }
    if (conflict.environmentA && conflict.environmentB && conflict.environmentA !== conflict.environmentB) {
      reasons.push(`Execution environments differ: '${conflict.environmentA}' vs '${conflict.environmentB}'`);
    }

    let likelyResolution = 'Conduct targeted cross-validation with aligned assumptions';
    if (conflict.conflictKind === KnowledgeConflictKind.SCOPE_CONFLICT) {
      likelyResolution = 'Scope proof boundaries and do not generalize local proof to global context';
    } else if (conflict.conflictKind === KnowledgeConflictKind.ENVIRONMENT_CONFLICT) {
      likelyResolution = 'Reverify in normalized environment container';
    } else if (conflict.conflictKind === KnowledgeConflictKind.CAUSAL_CONFLICT) {
      likelyResolution = 'Simulate counterfactuals to isolate active causal branch';
    }

    return {
      conflictId: conflict.conflictId,
      kind: conflict.conflictKind,
      affectedEntities: [conflict.entityAId, conflict.entityBId],
      claim: conflict.claim,
      differingAssumptions: reasons,
      likelyResolution,
      summary: `Conflict (${conflict.conflictKind}) between '${conflict.entityAId}' and '${conflict.entityBId}' regarding '${conflict.claim}'. Resolution: ${likelyResolution}.`
    };
  }
}
