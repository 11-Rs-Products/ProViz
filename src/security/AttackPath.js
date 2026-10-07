/**
 * AttackPath.js
 * Represents a concrete or symbolic traversal path through the system reaching a sensitive sink or violating an invariant.
 */

export class AttackPath {
  /**
   * @param {Object} options
   * @param {string} options.pathId
   * @param {string} options.entryNodeId
   * @param {string} options.sinkNodeId
   * @param {Array<string>} [options.stepNodeIds=[]]
   * @param {Array<string>} [options.crossedBoundaries=[]]
   * @param {number} [options.exploitabilityScore=0.7]
   * @param {number} [options.impactScore=0.8]
   * @param {string} [options.description='']
   * @param {Object} [options.metadata={}]
   */
  constructor({
    pathId,
    entryNodeId,
    sinkNodeId,
    stepNodeIds = [],
    crossedBoundaries = [],
    exploitabilityScore = 0.7,
    impactScore = 0.8,
    description = '',
    metadata = {}
  }) {
    if (!pathId || !entryNodeId || !sinkNodeId) {
      throw new Error('AttackPath requires pathId, entryNodeId, and sinkNodeId');
    }
    this.pathId = pathId;
    this.entryNodeId = entryNodeId;
    this.sinkNodeId = sinkNodeId;
    this.stepNodeIds = Object.freeze([...stepNodeIds]);
    this.crossedBoundaries = Object.freeze([...crossedBoundaries]);
    this.exploitabilityScore = Math.max(0.0, Math.min(1.0, Number(exploitabilityScore) || 0.7));
    this.impactScore = Math.max(0.0, Math.min(1.0, Number(impactScore) || 0.8));
    this.description = description || `Attack path from ${entryNodeId} to ${sinkNodeId}`;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  get length() {
    return this.stepNodeIds.length + 2;
  }

  get attackValue() {
    return this.exploitabilityScore * this.impactScore;
  }

  toJSON() {
    return {
      pathId: this.pathId,
      entryNodeId: this.entryNodeId,
      sinkNodeId: this.sinkNodeId,
      stepNodeIds: [...this.stepNodeIds],
      crossedBoundaries: [...this.crossedBoundaries],
      exploitabilityScore: this.exploitabilityScore,
      impactScore: this.impactScore,
      description: this.description,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new AttackPath(json);
  }
}
