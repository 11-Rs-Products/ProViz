/**
 * EvidenceArtifact.js
 * Addressable evidence artifact capturing confidence, provenance, category, freshness, and assumptions.
 */

export const EvidenceCategory = Object.freeze({
  FORMAL: 'FORMAL',
  SYMBOLIC: 'SYMBOLIC',
  STATIC: 'STATIC',
  DYNAMIC: 'DYNAMIC',
  CONCOLIC: 'CONCOLIC',
  TEST: 'TEST',
  MUTATION: 'MUTATION',
  PROBABILISTIC: 'PROBABILISTIC',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
  RELIABILITY: 'RELIABILITY',
  CONCURRENCY: 'CONCURRENCY',
  TEMPORAL: 'TEMPORAL',
  ARCHITECTURAL: 'ARCHITECTURAL',
  GOVERNANCE: 'GOVERNANCE',
  HISTORICAL: 'HISTORICAL'
});

export class EvidenceArtifact {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.category - from EvidenceCategory
   * @param {string} options.targetEntityId
   * @param {number} [options.confidence=1.0] - [0.0, 1.0]
   * @param {boolean} [options.isFormalProof=false]
   * @param {Object} options.claim
   * @param {Object} [options.data={}]
   * @param {string[]} [options.assumptions=[]]
   * @param {Object} [options.provenance={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    id,
    category,
    targetEntityId,
    confidence = 1.0,
    isFormalProof = false,
    claim,
    data = {},
    assumptions = [],
    provenance = {},
    timestamp = Date.now()
  }) {
    if (!id || !category || !targetEntityId) {
      throw new Error('EvidenceArtifact requires id, category, and targetEntityId');
    }
    this.id = id;
    this.category = category;
    this.targetEntityId = targetEntityId;
    this.confidence = confidence;
    // Invariant: Empirical/Probabilistic evidence can never declare isFormalProof = true
    this.isFormalProof = Boolean(isFormalProof && (category === EvidenceCategory.FORMAL || category === EvidenceCategory.SYMBOLIC));
    this.claim = Object.freeze({ ...claim });
    this.data = Object.freeze({ ...data });
    this.assumptions = Object.freeze([...assumptions]);
    this.provenance = Object.freeze({ ...provenance });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      category: this.category,
      targetEntityId: this.targetEntityId,
      confidence: this.confidence,
      isFormalProof: this.isFormalProof,
      claim: this.claim,
      data: this.data,
      assumptions: [...this.assumptions],
      provenance: this.provenance,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new EvidenceArtifact(json);
  }
}
