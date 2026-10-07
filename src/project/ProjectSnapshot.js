/**
 * ProjectSnapshot.js
 * Immutable, hash-addressed snapshot of a project state and its calculated intelligence metrics.
 */

import { ProjectGraph } from './ProjectGraph.js';

export class ProjectSnapshot {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.projectId
   * @param {number} options.revision
   * @param {number} [options.timestamp]
   * @param {ProjectGraph} options.graph
   * @param {Object} [options.health]
   * @param {Object} [options.architecture]
   * @param {Object} [options.debt]
   * @param {Object} [options.risks]
   * @param {Object} [options.governance]
   * @param {Object} [options.evidenceFreshness]
   * @param {Object} [options.metadata]
   */
  constructor({
    id,
    projectId,
    revision,
    timestamp = Date.now(),
    graph,
    health = {},
    architecture = {},
    debt = {},
    risks = {},
    governance = {},
    evidenceFreshness = {},
    metadata = {}
  }) {
    if (!id || !projectId) throw new Error('ProjectSnapshot requires id and projectId');
    this.id = id;
    this.projectId = projectId;
    this.revision = revision;
    this.timestamp = timestamp;
    this.graph = graph instanceof ProjectGraph ? graph : ProjectGraph.fromJSON(graph || {});
    this.health = Object.freeze({ ...health });
    this.architecture = Object.freeze({ ...architecture });
    this.debt = Object.freeze({ ...debt });
    this.risks = Object.freeze({ ...risks });
    this.governance = Object.freeze({ ...governance });
    this.evidenceFreshness = Object.freeze({ ...evidenceFreshness });
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      revision: this.revision,
      timestamp: this.timestamp,
      graph: this.graph.toJSON(),
      health: this.health,
      architecture: this.architecture,
      debt: this.debt,
      risks: this.risks,
      governance: this.governance,
      evidenceFreshness: this.evidenceFreshness,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new ProjectSnapshot(json);
  }
}
