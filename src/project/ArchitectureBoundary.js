/**
 * ArchitectureBoundary.js
 * Represents an architectural or security boundary encapsulating internal modules and exposing public APIs.
 */

export class ArchitectureBoundary {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {string[]} [options.internalModules=[]]
   * @param {string[]} [options.publicAPIs=[]]
   * @param {boolean} [options.isSecurityBoundary=false]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name,
    internalModules = [],
    publicAPIs = [],
    isSecurityBoundary = false,
    metadata = {}
  }) {
    if (!id || !name) throw new Error('ArchitectureBoundary requires id and name');
    this.id = id;
    this.name = name;
    this.internalModules = Object.freeze([...internalModules]);
    this.publicAPIs = Object.freeze([...publicAPIs]);
    this.isSecurityBoundary = Boolean(isSecurityBoundary);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  isInternal(moduleId) {
    return this.internalModules.includes(moduleId);
  }

  isPublicAPI(apiId) {
    return this.publicAPIs.includes(apiId);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      internalModules: [...this.internalModules],
      publicAPIs: [...this.publicAPIs],
      isSecurityBoundary: this.isSecurityBoundary,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ArchitectureBoundary(json);
  }
}
