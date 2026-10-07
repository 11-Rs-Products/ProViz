/**
 * ArchitectureLayer.js
 * Represents an architectural tier/layer (e.g. UI, Application, Domain, Infrastructure).
 */

export class ArchitectureLayer {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {number} options.level - Higher or lower ordinal for layer hierarchy (e.g., UI=0, App=1, Domain=2, Infra=3)
   * @param {string[]} [options.allowedDependencies=[]] - Layers this layer is explicitly allowed to depend on
   * @param {string[]} [options.modules=[]] - Module entity IDs belonging to this layer
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name,
    level = 0,
    allowedDependencies = [],
    modules = [],
    metadata = {}
  }) {
    if (!id || !name) throw new Error('ArchitectureLayer requires id and name');
    this.id = id;
    this.name = name;
    this.level = level;
    this.allowedDependencies = [...allowedDependencies];
    this.modules = [...modules];
    this.metadata = { ...metadata };
  }

  addModule(moduleId) {
    if (!this.modules.includes(moduleId)) {
      this.modules.push(moduleId);
    }
    return this;
  }

  canDependOn(targetLayerId) {
    if (this.id === targetLayerId) return true; // Intra-layer allowed unless constrained
    return this.allowedDependencies.includes(targetLayerId);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      allowedDependencies: [...this.allowedDependencies],
      modules: [...this.modules],
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ArchitectureLayer(json);
  }
}
