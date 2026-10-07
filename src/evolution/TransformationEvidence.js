/**
 * TransformationEvidence.js
 * Stores empirical and formal evidence supporting or refuting a candidate transformation.
 */

export const TransformationEvidenceType = Object.freeze({
  STATIC_PROOF: 'STATIC_PROOF',
  SYMBOLIC_PROOF: 'SYMBOLIC_PROOF',
  CONCRETE_EXECUTION: 'CONCRETE_EXECUTION',
  CONCOLIC_EXECUTION: 'CONCOLIC_EXECUTION',
  TEST_RESULT: 'TEST_RESULT',
  REGRESSION_RESULT: 'REGRESSION_RESULT',
  MUTATION_RESULT: 'MUTATION_RESULT',
  CONTRACT_CHECK: 'CONTRACT_CHECK',
  SEMANTIC_COMPARISON: 'SEMANTIC_COMPARISON',
  PERFORMANCE_MEASUREMENT: 'PERFORMANCE_MEASUREMENT',
  SECURITY_ANALYSIS: 'SECURITY_ANALYSIS'
});

export class TransformationEvidence {
  /**
   * @param {Object} options
   * @param {string} options.id - Deterministic evidence ID
   * @param {string} options.type - TransformationEvidenceType
   * @param {string} options.candidateId - Targeted transformation candidate
   * @param {boolean} options.supports - True if supports candidate, false if refutes
   * @param {number} [options.confidence=1.0] - Probability / strength in [0.0, 1.0]
   * @param {string} [options.summary='']
   * @param {Object} [options.details={}]
   */
  constructor({
    id,
    type = TransformationEvidenceType.TEST_RESULT,
    candidateId,
    supports = true,
    confidence = 1.0,
    summary = '',
    details = null
  }) {
    if (!id || !candidateId) {
      throw new Error('TransformationEvidence requires id and candidateId');
    }

    this.id = id;
    this.type = type;
    this.candidateId = candidateId;
    this.supports = Boolean(supports);
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 1.0));
    this.summary = summary;
    this.details = details ? Object.freeze({ ...details }) : Object.freeze({});

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      candidateId: this.candidateId,
      supports: this.supports,
      confidence: this.confidence,
      summary: this.summary,
      details: this.details
    };
  }

  static fromJSON(json) {
    return new TransformationEvidence(json);
  }
}
