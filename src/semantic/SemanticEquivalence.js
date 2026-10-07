/**
 * SemanticEquivalence.js
 * Represents semantic equivalence classifications between program variants.
 */

export const EquivalenceKind = Object.freeze({
  EXACT_EQUIVALENCE: 'EXACT_EQUIVALENCE',
  OBSERVATIONAL_EQUIVALENCE: 'OBSERVATIONAL_EQUIVALENCE',
  BEHAVIORAL_EQUIVALENCE: 'BEHAVIORAL_EQUIVALENCE',
  CONTRACT_EQUIVALENCE: 'CONTRACT_EQUIVALENCE',
  PARTIAL_EQUIVALENCE: 'PARTIAL_EQUIVALENCE',
  UNKNOWN: 'UNKNOWN'
});

export class SemanticEquivalence {
  /**
   * @param {Object} options
   * @param {string} options.sourceId
   * @param {string} options.targetId
   * @param {string} options.kind - EquivalenceKind
   * @param {number} [options.confidence=1.0]
   * @param {Array<string>} [options.evidence=[]]
   * @param {Object} [options.assumptions={}]
   */
  constructor({
    sourceId,
    targetId,
    kind = EquivalenceKind.UNKNOWN,
    confidence = 1.0,
    evidence = [],
    assumptions = {}
  }) {
    if (!sourceId || !targetId) {
      throw new Error('SemanticEquivalence requires sourceId and targetId');
    }

    this.sourceId = sourceId;
    this.targetId = targetId;
    this.kind = kind;
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 1.0));
    this.evidence = Object.freeze([...evidence]);
    this.assumptions = Object.freeze({ ...assumptions });

    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceId: this.sourceId,
      targetId: this.targetId,
      kind: this.kind,
      confidence: this.confidence,
      evidence: [...this.evidence],
      assumptions: this.assumptions
    };
  }

  static fromJSON(json) {
    return new SemanticEquivalence(json);
  }
}
