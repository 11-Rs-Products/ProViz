/**
 * ConcurrencyKnowledgeSynchronizer.js
 * Publishes concurrency findings, counterexamples, schedules, and certificates into the Stage 28 Knowledge Graph.
 */

export class ConcurrencyKnowledgeSynchronizer {
  /**
   * @param {Object} [knowledgeGraph=null] Stage 28 KnowledgeGraph instance or mock
   */
  constructor(knowledgeGraph = null) {
    this.knowledgeGraph = knowledgeGraph;
    this.publishedEntries = [];
  }

  /**
   * Publishes a concurrency artifact / verification finding.
   * @param {string} category 'RACE'|'DEADLOCK'|'TEMPORAL'|'CONSISTENCY'|'CERTIFICATE'
   * @param {Object} payload
   * @returns {Object} Published entry
   */
  publish(category, payload) {
    const entry = {
      id: `concurrency-kg-${Date.now()}-${this.publishedEntries.length + 1}`,
      category,
      timestamp: Date.now(),
      payload: payload && payload.toJSON ? payload.toJSON() : payload
    };

    this.publishedEntries.push(entry);

    if (this.knowledgeGraph && typeof this.knowledgeGraph.addNode === 'function') {
      this.knowledgeGraph.addNode({
        id: entry.id,
        type: `CONCURRENCY_${category}`,
        data: entry.payload
      });
    }

    return entry;
  }

  getPublishedEntries() {
    return [...this.publishedEntries];
  }
}
