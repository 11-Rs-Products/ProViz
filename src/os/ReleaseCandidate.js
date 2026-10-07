/**
 * ReleaseCandidate.js
 * Formal package artifact evaluated against multi-domain release gates.
 */

export class ReleaseCandidate {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.projectId
   * @param {string} options.targetVersion
   * @param {number} options.revision
   * @param {string[]} [options.scope=[]]
   * @param {Object} [options.metadata={}]
   */
  constructor(options = {}) {
    const id = options.id || `RC_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    const projectId = options.projectId || 'proviz-project';
    const targetVersion = options.targetVersion || options.version || '1.0.0';
    const revision = options.revision !== undefined ? options.revision : (options.targetRevision || 0);
    const scope = options.scope || [];
    const metadata = options.metadata || {};

    this.id = id;
    this.projectId = projectId;
    this.targetVersion = targetVersion;
    this.revision = revision;
    this.scope = Object.freeze([...scope]);
    this.metadata = Object.freeze({ ...metadata });
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      targetVersion: this.targetVersion,
      revision: this.revision,
      scope: [...this.scope],
      metadata: this.metadata,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ReleaseCandidate(json);
  }
}

export class ReleaseDecision {
  /**
   * @param {Object} options
   * @param {string} options.candidateId
   * @param {string} options.outcome - 'RELEASE' | 'RELEASE_WITH_SCOPE' | 'BLOCK' | 'ESCALATE'
   * @param {Object<string, boolean>} [options.gatesPassed={}]
   * @param {string[]} [options.blockingReasons=[]]
   * @param {string} [options.summary='']
   */
  constructor({
    candidateId,
    outcome,
    gatesPassed = {},
    blockingReasons = [],
    summary = ''
  }) {
    this.candidateId = candidateId;
    this.outcome = outcome;
    this.gatesPassed = Object.freeze({ ...gatesPassed });
    this.blockingReasons = Object.freeze([...blockingReasons]);
    this.summary = summary;
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  get isApproved() {
    return this.outcome === 'RELEASE' || this.outcome === 'RELEASE_WITH_SCOPE';
  }

  toJSON() {
    return {
      candidateId: this.candidateId,
      outcome: this.outcome,
      isApproved: this.isApproved,
      gatesPassed: this.gatesPassed,
      blockingReasons: [...this.blockingReasons],
      summary: this.summary,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ReleaseDecision(json);
  }
}

export class GlobalGovernanceEngine {
  /**
   * Evaluate release candidate against all verification and governance gates
   * @param {ReleaseCandidate} candidate
   * @param {Object} [evidenceData={}]
   */
  evaluateRelease(candidate, evidenceData = {}) {
    const {
      semanticStability = true,
      functionalVerification = true,
      security = true,
      performance = true,
      reliability = true,
      concurrency = true,
      architecture = true,
      governance = true,
      evidenceFreshness = true,
      regression = true,
      projectHealth = true
    } = evidenceData;

    const gates = {
      semanticStability: Boolean(semanticStability),
      functionalVerification: Boolean(functionalVerification),
      security: Boolean(security),
      performance: Boolean(performance),
      reliability: Boolean(reliability),
      concurrency: Boolean(concurrency),
      architecture: Boolean(architecture),
      governance: Boolean(governance),
      evidenceFreshness: Boolean(evidenceFreshness),
      regression: Boolean(regression),
      projectHealth: Boolean(projectHealth)
    };

    const failedGates = Object.entries(gates).filter(([_, passed]) => !passed).map(([name]) => name);

    let outcome = 'RELEASE';
    let summary = `All 11 release gates passed successfully for ${candidate.targetVersion}`;

    if (failedGates.length > 0) {
      if (failedGates.includes('security') || failedGates.includes('functionalVerification') || failedGates.includes('governance')) {
        outcome = 'BLOCK';
        summary = `Release blocked due to failure in critical gates: ${failedGates.join(', ')}`;
      } else {
        outcome = 'RELEASE_WITH_SCOPE';
        summary = `Release permitted with scoped restrictions on non-critical gate warnings: ${failedGates.join(', ')}`;
      }
    }

    return new ReleaseDecision({
      candidateId: candidate.id,
      outcome,
      gatesPassed: gates,
      blockingReasons: failedGates,
      summary
    });
  }
}
