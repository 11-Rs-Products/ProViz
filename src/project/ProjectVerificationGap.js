/**
 * ProjectVerificationGap.js
 * Identifies specific missing verification obligations, unverified contracts, or stale evidence.
 */

export class ProjectVerificationGap {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.entityId
   * @param {string} options.gapKind - 'MISSING_CONTRACT' | 'MISSING_SECURITY_VERIFICATION' | 'MISSING_PERFORMANCE_MODEL' | 'MISSING_CONCURRENCY_MODEL' | 'STALE_EVIDENCE' | 'UNVERIFIED_OBLIGATION'
   * @param {string} options.description
   * @param {string} [options.criticality='HIGH'] - 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
   * @param {Object} [options.context={}]
   */
  constructor({
    id,
    entityId,
    gapKind,
    description,
    criticality = 'HIGH',
    context = {}
  }) {
    if (!id || !entityId || !gapKind) throw new Error('ProjectVerificationGap requires id, entityId, and gapKind');
    this.id = id;
    this.entityId = entityId;
    this.gapKind = gapKind;
    this.description = description;
    this.criticality = criticality;
    this.context = Object.freeze({ ...context });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      entityId: this.entityId,
      gapKind: this.gapKind,
      description: this.description,
      criticality: this.criticality,
      context: { ...this.context }
    };
  }

  static fromJSON(json) {
    return new ProjectVerificationGap(json);
  }
}
