/**
 * Schedule.js
 * Represents a complete or partial sequence of scheduled concurrent events.
 */

export class Schedule {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {Array<Object>} [options.events=[]] Sequence of events
   * @param {Object} [options.metadata={}]
   */
  constructor({ id, events = [], metadata = {} }) {
    if (!id) throw new Error('Schedule requires id');
    this.id = id;
    this.events = Object.freeze([...events]);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  length() {
    return this.events.length;
  }

  getEvent(index) {
    return this.events[index] || null;
  }

  withEvent(event) {
    return new Schedule({
      id: this.id,
      events: [...this.events, event],
      metadata: this.metadata
    });
  }

  withoutEventIndex(index) {
    const nextEvents = this.events.filter((_, idx) => idx !== index);
    return new Schedule({
      id: `${this.id}-reduced`,
      events: nextEvents,
      metadata: this.metadata
    });
  }

  toJSON() {
    return {
      id: this.id,
      eventCount: this.events.length,
      events: [...this.events],
      metadata: { ...this.metadata }
    };
  }
}
