/**
 * ArchitectureDependency.js
 * Represents a high-level dependency between architecture layers or boundaries.
 */

export class ArchitectureDependency {
  /**
   * @param {Object} options
   * @param {string} options.sourceLayer
   * @param {string} options.targetLayer
   * @param {number} [options.count=1]
   * @param {string[]} [options.participatingEdges=[]] - IDs of underlying project relations
   * @param {boolean} [options.isAllowed=true]
   */
  constructor({
    sourceLayer,
    targetLayer,
    count = 1,
    participatingEdges = [],
    isAllowed = true
  }) {
    if (!sourceLayer || !targetLayer) throw new Error('ArchitectureDependency requires sourceLayer and targetLayer');
    this.sourceLayer = sourceLayer;
    this.targetLayer = targetLayer;
    this.count = count;
    this.participatingEdges = Object.freeze([...participatingEdges]);
    this.isAllowed = Boolean(isAllowed);
    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceLayer: this.sourceLayer,
      targetLayer: this.targetLayer,
      count: this.count,
      participatingEdges: [...this.participatingEdges],
      isAllowed: this.isAllowed
    };
  }

  static fromJSON(json) {
    return new ArchitectureDependency(json);
  }
}
