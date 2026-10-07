/**
 * ConcurrencyCertificate.js
 * Scoped verification certificate explicitly stating property, bounds, scope, and evidence.
 */

export class ConcurrencyCertificate {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.property
   * @param {string} [options.status='VERIFIED_WITHIN_SCOPE']
   * @param {Object} [options.scope={}]
   * @param {Object} [options.bounds={ schedules: 100, depth: 50 }]
   * @param {Array<import('./ConcurrencyEvidence.js').ConcurrencyEvidence>} [options.evidenceList=[]]
   * @param {Array<string>} [options.assumptions=[]]
   * @param {number} [options.issuedAt=Date.now()]
   */
  constructor({
    id,
    property,
    status = 'VERIFIED_WITHIN_SCOPE',
    scope = {},
    bounds = { schedules: 100, depth: 50 },
    evidenceList = [],
    assumptions = [],
    issuedAt = Date.now()
  }) {
    if (!id || !property) throw new Error('ConcurrencyCertificate requires id and property');
    this.id = id;
    this.property = property;
    this.status = status;
    this.scope = Object.freeze({ ...scope });
    this.bounds = Object.freeze({ ...bounds });
    this.evidenceList = Object.freeze([...evidenceList]);
    this.assumptions = Object.freeze([...assumptions]);
    this.issuedAt = issuedAt;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      property: this.property,
      status: this.status,
      scope: { ...this.scope },
      bounds: { ...this.bounds },
      evidenceCount: this.evidenceList.length,
      evidenceList: this.evidenceList.map(e => e.toJSON ? e.toJSON() : e),
      assumptions: [...this.assumptions],
      issuedAt: this.issuedAt
    };
  }
}
