/**
 * ProjectState.js
 * Mutable/evolving container for the active state of a project.
 */

import { ProjectGraph } from './ProjectGraph.js';

export class ProjectState {
  /**
   * @param {Object} options
   * @param {string} options.projectId
   * @param {number} [options.revision=1]
   * @param {ProjectGraph} [options.graph]
   * @param {Object} [options.metadata={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    projectId,
    revision = 1,
    graph = new ProjectGraph(),
    metadata = {},
    timestamp = Date.now()
  }) {
    if (!projectId) throw new Error('ProjectState requires projectId');
    this.projectId = projectId;
    this.revision = revision;
    this.graph = graph;
    this.metadata = { ...metadata };
    this.timestamp = timestamp;
  }

  updateRevision() {
    this.revision += 1;
    this.timestamp = Date.now();
    return this.revision;
  }

  toJSON() {
    return {
      projectId: this.projectId,
      revision: this.revision,
      timestamp: this.timestamp,
      metadata: { ...this.metadata },
      graph: this.graph.toJSON()
    };
  }

  static fromJSON(json) {
    return new ProjectState({
      projectId: json.projectId,
      revision: json.revision,
      timestamp: json.timestamp,
      metadata: json.metadata,
      graph: ProjectGraph.fromJSON(json.graph)
    });
  }
}
