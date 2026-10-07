/**
 * ReliabilityCertificate.js
 * Produces structured, scoped performance and reliability assurance certificates.
 * Explicitly records scope, workload profiles, SLA baselines, evidence IDs, and limitations.
 */

export class ReliabilityCertificate {
  /**
   * @param {Object} options
   * @param {string} options.certificateId
   * @param {string} options.performanceModelId
   * @param {string} [options.scope='GLOBAL']
   * @param {Array<string>} [options.workloadProfiles=[]]
   * @param {Array<string>} [options.verifiedProperties=[]]
   * @param {Array<string>} [options.evidenceIds=[]]
   * @param {Array<string>} [options.limitations=[]]
   * @param {boolean} [options.isCertified=true]
   * @param {number} [options.confidence=0.95]
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    certificateId,
    performanceModelId,
    scope = 'GLOBAL',
    workloadProfiles = [],
    verifiedProperties = [],
    evidenceIds = [],
    limitations = [],
    isCertified = true,
    confidence = 0.95,
    timestamp = Date.now()
  }) {
    if (!certificateId || !performanceModelId) {
      throw new Error('ReliabilityCertificate requires certificateId and performanceModelId');
    }
    this.certificateId = certificateId;
    this.performanceModelId = performanceModelId;
    this.scope = scope;
    this.workloadProfiles = Object.freeze([...workloadProfiles]);
    this.verifiedProperties = Object.freeze([...verifiedProperties]);
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
      performanceModelId: this.performanceModelId,
      scope: this.scope,
      workloadProfiles: [...this.workloadProfiles],
      verifiedProperties: [...this.verifiedProperties],
      evidenceIds: [...this.evidenceIds],
      limitations: [...this.limitations],
      isCertified: this.isCertified,
      confidence: this.confidence,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ReliabilityCertificate(json);
  }
}
