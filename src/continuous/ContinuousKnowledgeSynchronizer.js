/**
 * ContinuousKnowledgeSynchronizer.js
 * Synchronizes all continuous verification events, obligations, failures, repairs, and certificates
 * into the Stage 28 Knowledge Graph.
 */

export class ContinuousKnowledgeSynchronizer {
  /**
   * @param {Object} [knowledgeGraph=null] Stage 28 KnowledgeGraph instance or mock
   */
  constructor(knowledgeGraph = null) {
    this.knowledgeGraph = knowledgeGraph;
    this.history = [];
  }

  /**
   * Publishes an event to the continuous knowledge synchronizer.
   * @param {string} category 'CHANGE'|'OBLIGATION'|'FAILURE'|'REPAIR'|'DECISION'|'CERTIFICATE'
   * @param {Object} payload
   */
  publish(category, payload) {
    const entry = {
      id: `continuous-sync-${Date.now()}-${this.history.length + 1}`,
      category,
      payload: payload && payload.toJSON ? payload.toJSON() : payload,
      timestamp: Date.now()
    };
    this.history.push(entry);

    if (this.knowledgeGraph && typeof this.knowledgeGraph.addNode === 'function') {
      this.knowledgeGraph.addNode({
        id: entry.id,
        type: `CONTINUOUS_${category}`,
        data: entry.payload
      });
    }

    return entry;
  }

  getHistory() {
    return [...this.history];
  }
}
