/**
 * DistributedExecution.js
 * Represents a distributed execution history with logical vector clocks and message traces.
 */

export class DistributedExecution {
  /**
   * @param {Object} [options={}]
   * @param {Array<Object>} [options.events=[]]
   * @param {Map<string, Array<number>>|Object} [options.vectorClocks={}]
   */
  constructor({ events = [], vectorClocks = {} } = {}) {
    this.events = Object.freeze([...events]);
    this.vectorClocks = Object.freeze(
      vectorClocks instanceof Map ? new Map(vectorClocks) : new Map(Object.entries(vectorClocks))
    );
    Object.freeze(this);
  }

  addEvent(event) {
    return new DistributedExecution({
      events: [...this.events, event],
      vectorClocks: this.vectorClocks
    });
  }

  getEventsForNode(nodeId) {
    return this.events.filter(e => e.nodeId === nodeId);
  }

  toJSON() {
    return {
      eventCount: this.events.length,
      events: [...this.events],
      vectorClocks: Object.fromEntries(this.vectorClocks.entries())
    };
  }
}
