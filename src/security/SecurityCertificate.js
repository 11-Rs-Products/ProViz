/**
 * SecurityCertificate.js
 * Produces structured, bounded security-assurance certification documents.
 * Must explicitly state scope, assumptions, explored space, limitations, and evidence.
 */

export class SecurityCertificate {
  /**
   * @param {Object} options
   * @param {string} options.certificateId
   * @param {string} options.threatModelId
   * @param {string} options.scope
   * @param {Array<string>} options.assumptions
   * @param {Array<string>} options.exploredProperties
   * @param {Array<string>} options.evidenceIds
   * @param {Array<string>} options.limitations
   * @param {boolean} options.isCertified
   * @param {number} [options.confidence=0.95]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    certificateId,
    threatModelId,
    scope = 'GLOBAL',
    assumptions = [],
    exploredProperties = [],
    evidenceIds = [],
    limitations = [],
    isCertified = true,
    confidence = 0.95,
    timestamp = Date.now()
  }) {
    if (!certificateId || !threatModelId) {
      throw new Error('SecurityCertificate requires certificateId and threatModelId');
    }
    this.certificateId = certificateId;
    this.threatModelId = threatModelId;
    this.scope = scope;
    this.assumptions = Object.freeze([...assumptions]);
    this.exploredProperties = Object.freeze([...exploredProperties]);
    this.evidenceIds = Object.freeze([...evidenceIds]);
    this.limitations = Object.freeze([...limitations]);
    this.isCertified = Boolean(isCertified);
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 0.95));
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      certificateId: this.certificateId,
      threatModelId: this.threatModelId,
      scope: this.scope,
      assumptions: [...this.assumptions],
      exploredProperties: [...this.exploredProperties],
      evidenceIds: [...this.evidenceIds],
      limitations: [...this.limitations],
      isCertified: this.isCertified,
      confidence: this.confidence,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new SecurityCertificate(json);
  }
}
