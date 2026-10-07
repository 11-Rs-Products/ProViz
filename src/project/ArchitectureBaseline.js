/**
 * ArchitectureBaseline.js
 * Captures an approved reference architecture baseline against which drift is detected.
 */

export class ArchitectureBaseline {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.projectId
   * @param {number} options.revision
   * @param {string[]} [options.approvedEdges=[]] - Edge IDs or serialized relations
   * @param {Object} [options.layerMap={}] - Mapping module -> layerId
   * @param {Object} [options.metrics={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    id,
    projectId,
    revision = 1,
    approvedEdges = [],
    layerMap = {},
    metrics = {},
    timestamp = Date.now()
  }) {
    if (!id || !projectId) throw new Error('ArchitectureBaseline requires id and projectId');
    this.id = id;
    this.projectId = projectId;
    this.revision = revision;
    this.approvedEdges = Object.freeze([...approvedEdges]);
    this.layerMap = Object.freeze({ ...layerMap });
    this.metrics = Object.freeze({ ...metrics });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      revision: this.revision,
      approvedEdges: [...this.approvedEdges],
      layerMap: { ...this.layerMap },
      metrics: { ...this.metrics },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ArchitectureBaseline(json);
  }
}
