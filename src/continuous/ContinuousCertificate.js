/**
 * ContinuousCertificate.js
 * Scoped verification certificate generated continuously as project state evolves.
 */

export class ContinuousCertificate {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.revision
   * @param {string} [options.status='VERIFIED_CONTINUOUSLY']
   * @param {Object} [options.scope={}]
   * @param {Array<Object>} [options.obligationsSatisfied=[]]
   * @param {Array<Object>} [options.evidenceList=[]]
   * @param {number} [options.confidence=1.0]
   * @param {Array<string>} [options.assumptions=[]]
   * @param {number} [options.issuedAt=Date.now()]
   */
  constructor({
    id,
    revision,
    status = 'VERIFIED_CONTINUOUSLY',
    scope = {},
    obligationsSatisfied = [],
    evidenceList = [],
    confidence = 1.0,
    assumptions = [],
    issuedAt = Date.now()
  }) {
    if (!id || !revision) throw new Error('ContinuousCertificate requires id and revision');
    this.id = id;
    this.revision = revision;
    this.status = status;
    this.scope = Object.freeze({ ...scope });
    this.obligationsSatisfied = Object.freeze([...obligationsSatisfied]);
    this.evidenceList = Object.freeze([...evidenceList]);
    this.confidence = confidence;
    this.assumptions = Object.freeze([...assumptions]);
    this.issuedAt = issuedAt;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      revision: this.revision,
      status: this.status,
      scope: { ...this.scope },
      obligationsCount: this.obligationsSatisfied.length,
      evidenceCount: this.evidenceList.length,
      confidence: this.confidence,
      assumptions: [...this.assumptions],
      issuedAt: this.issuedAt
    };
  }
}
