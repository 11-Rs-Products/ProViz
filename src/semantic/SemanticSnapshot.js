/**
 * SemanticSnapshot.js
 * Immutable snapshot of the Semantic Program Model state with checkpointing and restore capabilities.
 */

import { SemanticProgramGraph } from './SemanticProgramGraph.js';

export class SemanticSnapshot {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {Object} options.graphData - JSON data of SemanticProgramGraph
   * @param {number} [options.timestamp=Date.now()]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = 'snapshot',
    graphData,
    timestamp = Date.now(),
    metadata = {}
  }) {
    if (!id || !graphData) {
      throw new Error('SemanticSnapshot requires id and graphData');
    }

    this.id = id;
    this.name = name;
    this.graphData = Object.freeze(JSON.parse(JSON.stringify(graphData)));
    this.timestamp = timestamp;
    this.metadata = Object.freeze({ ...metadata });

    Object.freeze(this);
  }

  restoreGraph() {
    return SemanticProgramGraph.fromJSON(this.graphData);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      graphData: this.graphData,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new SemanticSnapshot(json);
  }
}
