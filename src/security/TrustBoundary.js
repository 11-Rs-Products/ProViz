/**
 * TrustBoundary.js
 * Models transitions and partitions between differing trust domains and privilege levels.
 */

export const TrustBoundaryType = Object.freeze({
  TRUSTED_TO_UNTRUSTED: 'TRUSTED_TO_UNTRUSTED',
  UNTRUSTED_TO_TRUSTED: 'UNTRUSTED_TO_TRUSTED',
  PRIVILEGED_TO_UNPRIVILEGED: 'PRIVILEGED_TO_UNPRIVILEGED',
  UNPRIVILEGED_TO_PRIVILEGED: 'UNPRIVILEGED_TO_PRIVILEGED',
  PROCESS_TO_PROCESS: 'PROCESS_TO_PROCESS',
  COMPONENT_TO_COMPONENT: 'COMPONENT_TO_COMPONENT',
  SYSTEM_TO_EXTERNAL: 'SYSTEM_TO_EXTERNAL'
});

export class TrustBoundary {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.type - TrustBoundaryType
   * @param {string} options.sourceDomain
   * @param {string} options.targetDomain
   * @param {Array<string>} [options.entryPoints=[]]
   * @param {Array<string>} [options.sanitizers=[]]
   * @param {Object} [options.attributes={}]
   */
  constructor({
    id,
    type = TrustBoundaryType.UNTRUSTED_TO_TRUSTED,
    sourceDomain,
    targetDomain,
    entryPoints = [],
    sanitizers = [],
    attributes = {}
  }) {
    if (!id || !sourceDomain || !targetDomain) {
      throw new Error('TrustBoundary requires id, sourceDomain, and targetDomain');
    }
    this.id = id;
    this.type = type;
    this.sourceDomain = sourceDomain;
    this.targetDomain = targetDomain;
    this.entryPoints = Object.freeze([...entryPoints]);
    this.sanitizers = Object.freeze([...sanitizers]);
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  isEntry(nodeId) {
    return this.entryPoints.includes(nodeId);
  }

  hasSanitizer(sanitizerId) {
    return this.sanitizers.includes(sanitizerId);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      sourceDomain: this.sourceDomain,
      targetDomain: this.targetDomain,
      entryPoints: [...this.entryPoints],
      sanitizers: [...this.sanitizers],
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new TrustBoundary(json);
  }
}
