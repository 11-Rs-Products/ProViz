/**
 * FailureCluster.js
 * Groups related verification failures into cohesive root defect clusters.
 */

export class FailureCluster {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.rootCauseSummary
   * @param {Array<Object>} [options.failures=[]]
   * @param {Array<string>} [options.affectedEntities=[]]
   * @param {string} [options.severity='HIGH']
   */
  constructor({
    id,
    rootCauseSummary,
    failures = [],
    affectedEntities = [],
    severity = 'HIGH'
  }) {
    if (!id || !rootCauseSummary) throw new Error('FailureCluster requires id and rootCauseSummary');
    this.id = id;
    this.rootCauseSummary = rootCauseSummary;
    this.failures = Object.freeze([...failures]);
    this.affectedEntities = Object.freeze([...affectedEntities]);
    this.severity = severity;
    Object.freeze(this);
  }

  failureCount() {
    return this.failures.length;
  }

  toJSON() {
    return {
      id: this.id,
      rootCauseSummary: this.rootCauseSummary,
      failureCount: this.failures.length,
      failures: [...this.failures],
      affectedEntities: [...this.affectedEntities],
      severity: this.severity
    };
  }
}
