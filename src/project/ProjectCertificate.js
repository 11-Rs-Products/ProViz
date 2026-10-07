/**
 * ProjectCertificate.js
 * Scoped, evidence-backed certificate of project-level governance and verification compliance.
 * Invariant: Never implies universal correctness. Expresses compliance within declared scope and explicit assumptions.
 */

import { ProjectCertificateScope } from './ProjectCertificateScope.js';

export class ProjectCertificate {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {ProjectCertificateScope} options.scope
   * @param {string} options.status - 'CERTIFIED' | 'CONDITIONALLY_CERTIFIED' | 'REJECTED'
   * @param {Object} options.governanceDecision
   * @param {Object} options.evidenceSummary
   * @param {Object[]} [options.knownGaps=[]]
   * @param {Object[]} [options.knownRisks=[]]
   * @param {string[]} [options.assumptions=[]]
   * @param {Object} [options.provenance={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    id,
    scope,
    status,
    governanceDecision,
    evidenceSummary,
    knownGaps = [],
    knownRisks = [],
    assumptions = [],
    provenance = {},
    timestamp = Date.now()
  }) {
    if (!id || !scope || !status) throw new Error('ProjectCertificate requires id, scope, and status');
    this.id = id;
    this.scope = scope instanceof ProjectCertificateScope ? scope : new ProjectCertificateScope(scope);
    this.status = status;
    this.governanceDecision = Object.freeze({ ...governanceDecision });
    this.evidenceSummary = Object.freeze({ ...evidenceSummary });
    this.knownGaps = Object.freeze([...knownGaps]);
    this.knownRisks = Object.freeze([...knownRisks]);
    this.assumptions = Object.freeze([...assumptions]);
    this.provenance = Object.freeze({ ...provenance });
    this.timestamp = timestamp;
    this.disclaimer = 'Within the declared scope and assumptions, the available evidence satisfies the declared project-level verification and governance criteria. This does not imply universal absence of defects.';
    Object.freeze(this);
  }

  get isCertified() {
    return this.status === 'CERTIFIED';
  }

  toJSON() {
    return {
      id: this.id,
      scope: this.scope.toJSON(),
      status: this.status,
      isCertified: this.isCertified,
      governanceDecision: this.governanceDecision,
      evidenceSummary: this.evidenceSummary,
      knownGaps: [...this.knownGaps],
      knownRisks: [...this.knownRisks],
      assumptions: [...this.assumptions],
      provenance: this.provenance,
      disclaimer: this.disclaimer,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ProjectCertificate(json);
  }
}
