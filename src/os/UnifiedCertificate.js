/**
 * UnifiedCertificate.js
 * Master top-level ProViz Autonomous Verification Certificate composing domain certificates (Functional, Security, Performance, Concurrency, Architecture, Governance, Release).
 * Invariant: Never implies universal correctness. Expresses compliance within declared scope and assumptions.
 */

export const CertificateKind = Object.freeze({
  FUNCTIONAL: 'FUNCTIONAL',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
  RELIABILITY: 'RELIABILITY',
  CONCURRENCY: 'CONCURRENCY',
  ARCHITECTURE: 'ARCHITECTURE',
  GOVERNANCE: 'GOVERNANCE',
  CONTINUOUS: 'CONTINUOUS',
  PROJECT: 'PROJECT',
  RELEASE: 'RELEASE',
  UNIFIED: 'UNIFIED'
});

export class UnifiedCertificate {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.projectId
   * @param {number} options.revision
   * @param {string} [options.status='CERTIFIED'] - 'CERTIFIED' | 'CONDITIONALLY_CERTIFIED' | 'REJECTED'
   * @param {Object} options.scope
   * @param {Object<string, Object>} [options.underlyingCertificates={}]
   * @param {Object} [options.governanceDecision={}]
   * @param {Object} [options.evidenceSummary={}]
   * @param {string[]} [options.assumptions=[]]
   * @param {Object[]} [options.knownGaps=[]]
   * @param {Object[]} [options.knownRisks=[]]
   * @param {Object} [options.provenance={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    id,
    projectId,
    revision,
    status = 'CERTIFIED',
    scope,
    underlyingCertificates = {},
    governanceDecision = {},
    evidenceSummary = {},
    assumptions = [],
    knownGaps = [],
    knownRisks = [],
    provenance = {},
    timestamp = Date.now()
  }) {
    if (!id || !projectId) throw new Error('UnifiedCertificate requires id and projectId');
    this.id = id;
    this.projectId = projectId;
    this.revision = revision;
    this.status = status;
    this.scope = Object.freeze({ ...scope });
    this.underlyingCertificates = Object.freeze({ ...underlyingCertificates });
    this.governanceDecision = Object.freeze({ ...governanceDecision });
    this.evidenceSummary = Object.freeze({ ...evidenceSummary });
    this.assumptions = Object.freeze([...assumptions]);
    this.knownGaps = Object.freeze([...knownGaps]);
    this.knownRisks = Object.freeze([...knownRisks]);
    this.provenance = Object.freeze({ ...provenance });
    this.timestamp = timestamp;
    this.disclaimer = 'The declared project state satisfied the declared verification, governance, and certification criteria under the declared policies, evidence, assumptions, and resource bounds. This does not imply universal absence of defects.';
    Object.freeze(this);
  }

  get isCertified() {
    return this.status === 'CERTIFIED';
  }

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      revision: this.revision,
      status: this.status,
      isCertified: this.isCertified,
      scope: this.scope,
      underlyingCertificates: this.underlyingCertificates,
      governanceDecision: this.governanceDecision,
      evidenceSummary: this.evidenceSummary,
      assumptions: [...this.assumptions],
      knownGaps: [...this.knownGaps],
      knownRisks: [...this.knownRisks],
      provenance: this.provenance,
      disclaimer: this.disclaimer,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new UnifiedCertificate(json);
  }
}

export class CertificateComposer {
  /**
   * Compose domain certificates into top-level UnifiedCertificate
   * @param {Object} params
   */
  compose(params) {
    const {
      projectId,
      revision = 1,
      scope = {},
      underlyingCertificates = {},
      governanceDecision = {},
      evidenceSummary = {},
      assumptions = [
        'Deterministic hardware execution model',
        'Standard memory consistency guarantees',
        'Declared security boundaries intact'
      ],
      knownGaps = [],
      knownRisks = []
    } = params;

    let status = 'CERTIFIED';
    if (governanceDecision.outcome === 'BLOCKED') {
      status = 'REJECTED';
    } else if (governanceDecision.outcome === 'CONDITIONALLY_PASSED' || knownGaps.length > 0) {
      status = 'CONDITIONALLY_CERTIFIED';
    }

    return new UnifiedCertificate({
      id: `UNIFIED_CERT_${projectId}_REV${revision}_${Date.now()}`,
      projectId,
      revision,
      status,
      scope,
      underlyingCertificates,
      governanceDecision,
      evidenceSummary,
      assumptions,
      knownGaps,
      knownRisks,
      provenance: {
        osEngine: 'ProViz.AutonomousVerificationOS',
        composer: 'CertificateComposer',
        version: '36.0.0'
      }
    });
  }
}

export class CertificateRegistry {
  constructor() {
    /** @type {Map<string, UnifiedCertificate>} */
    this._certificates = new Map();
  }

  register(cert) {
    this._certificates.set(cert.id, cert);
    return cert;
  }

  get(id) {
    return this._certificates.get(id) || null;
  }

  getAll() {
    return Array.from(this._certificates.values());
  }

  getLatestForProject(projectId) {
    const projectCerts = Array.from(this._certificates.values())
      .filter(c => c.projectId === projectId)
      .sort((a, b) => b.revision - a.revision);
    return projectCerts.length > 0 ? projectCerts[0] : null;
  }
}
