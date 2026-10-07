/**
 * SecurityEvidence.js
 * Immutable evidence model supporting static proofs, symbolic proofs, counterexamples,
 * concolic execution, adversarial execution, security tests, and mutation results.
 */

export const SecurityEvidenceType = Object.freeze({
  STATIC_PROOF: 'STATIC_PROOF',
  SYMBOLIC_PROOF: 'SYMBOLIC_PROOF',
  COUNTEREXAMPLE: 'COUNTEREXAMPLE',
  CONCOLIC_EXECUTION: 'CONCOLIC_EXECUTION',
  ADVERSARIAL_EXECUTION: 'ADVERSARIAL_EXECUTION',
  SECURITY_TEST: 'SECURITY_TEST',
  MUTATION_RESULT: 'MUTATION_RESULT',
  FLOW_ANALYSIS: 'FLOW_ANALYSIS'
});

export class SecurityEvidence {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.type - SecurityEvidenceType
   * @param {string} options.targetNodeOrProperty
   * @param {boolean} options.provesSafety - true if proves defense, false if demonstrates vulnerability
   * @param {number} [options.confidence=0.9]
   * @param {string} [options.summary='']
   * @param {Object} [options.details={}]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    type = SecurityEvidenceType.FLOW_ANALYSIS,
    targetNodeOrProperty,
    provesSafety = true,
    confidence = 0.9,
    summary = '',
    details = {},
    timestamp = Date.now()
  }) {
    if (!id || !targetNodeOrProperty) {
      throw new Error('SecurityEvidence requires id and targetNodeOrProperty');
    }
    this.id = id;
    this.type = type;
    this.targetNodeOrProperty = targetNodeOrProperty;
    this.provesSafety = Boolean(provesSafety);
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 0.9));
    this.summary = summary || `Security evidence: ${type}`;
    this.details = Object.freeze({ ...details });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      targetNodeOrProperty: this.targetNodeOrProperty,
      provesSafety: this.provesSafety,
      confidence: this.confidence,
      summary: this.summary,
      details: { ...this.details },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new SecurityEvidence(json);
  }
}
