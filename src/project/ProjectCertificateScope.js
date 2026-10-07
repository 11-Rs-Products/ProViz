/**
 * ProjectCertificateScope.js
 * Explicitly defines the boundary, components, and verification engines encompassed by a ProjectCertificate.
 */

export class ProjectCertificateScope {
  /**
   * @param {Object} options
   * @param {string} options.projectId
   * @param {number} options.revision
   * @param {string[]} [options.modules=[]]
   * @param {string[]} [options.layers=[]]
   * @param {string[]} [options.boundaries=[]]
   * @param {string[]} [options.verifiedEngines=[]]
   * @param {string[]} [options.assumptions=[]]
   */
  constructor({
    projectId,
    revision,
    modules = [],
    layers = [],
    boundaries = [],
    verifiedEngines = ['contracts', 'types', 'security', 'performance', 'concurrency', 'regression'],
    assumptions = []
  }) {
    if (!projectId) throw new Error('ProjectCertificateScope requires projectId');
    this.projectId = projectId;
    this.revision = revision;
    this.modules = Object.freeze([...modules]);
    this.layers = Object.freeze([...layers]);
    this.boundaries = Object.freeze([...boundaries]);
    this.verifiedEngines = Object.freeze([...verifiedEngines]);
    this.assumptions = Object.freeze([...assumptions]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      projectId: this.projectId,
      revision: this.revision,
      modules: [...this.modules],
      layers: [...this.layers],
      boundaries: [...this.boundaries],
      verifiedEngines: [...this.verifiedEngines],
      assumptions: [...this.assumptions]
    };
  }

  static fromJSON(json) {
    return new ProjectCertificateScope(json);
  }
}
