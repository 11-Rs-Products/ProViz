/**
 * DependencyCycle.js
 * Represents a dependency cycle across code, data, control, verification, or architecture.
 */

export const CycleClassification = Object.freeze({
  BENIGN: 'BENIGN',
  ARCHITECTURAL: 'ARCHITECTURAL',
  DATA: 'DATA',
  CONTROL: 'CONTROL',
  VERIFICATION: 'VERIFICATION',
  CAUSAL: 'CAUSAL',
  UNRESOLVED: 'UNRESOLVED'
});

export class DependencyCycle {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {Array<string>} options.nodes - Sequence of node IDs in the cycle
   * @param {string} options.classification - CycleClassification
   * @param {string} [options.description='']
   */
  constructor({
    id,
    nodes = [],
    classification = CycleClassification.UNRESOLVED,
    description = ''
  }) {
    if (!id || nodes.length < 2) {
      throw new Error('DependencyCycle requires valid id and at least 2 nodes');
    }

    this.id = id;
    this.nodes = Object.freeze([...nodes]);
    this.classification = classification;
    this.description = description;

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      nodes: [...this.nodes],
      classification: this.classification,
      description: this.description
    };
  }

  static fromJSON(json) {
    return new DependencyCycle(json);
  }
}
