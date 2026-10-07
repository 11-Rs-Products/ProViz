/**
 * TransformationEquivalence.js
 * Scoped equivalence classification between original and transformed program fragments.
 */

export const TransformationEquivalenceScope = Object.freeze({
  EXACT: 'EXACT',
  OBSERVATIONAL: 'OBSERVATIONAL',
  BEHAVIORAL: 'BEHAVIORAL',
  CONTRACT: 'CONTRACT',
  API: 'API',
  STATE: 'STATE',
  TRACE: 'TRACE',
  PARTIAL: 'PARTIAL'
});

export class TransformationEquivalence {
  /**
   * @param {Object} options
   * @param {string} options.sourceId
   * @param {string} options.targetId
   * @param {string} options.scope - TransformationEquivalenceScope
   * @param {boolean} options.isEquivalent
   * @param {number} [options.confidence=1.0]
   * @param {Array<string>} [options.evidence=[]]
   */
  constructor({
    sourceId,
    targetId,
    scope = TransformationEquivalenceScope.BEHAVIORAL,
    isEquivalent = true,
    confidence = 1.0,
    evidence = []
  }) {
    if (!sourceId || !targetId) {
      throw new Error('TransformationEquivalence requires sourceId and targetId');
    }

    this.sourceId = sourceId;
    this.targetId = targetId;
    this.scope = scope;
    this.isEquivalent = Boolean(isEquivalent);
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 1.0));
    this.evidence = Object.freeze([...evidence]);

    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceId: this.sourceId,
      targetId: this.targetId,
      scope: this.scope,
      isEquivalent: this.isEquivalent,
      confidence: this.confidence,
      evidence: [...this.evidence]
    };
  }

  static fromJSON(json) {
    return new TransformationEquivalence(json);
  }
}
