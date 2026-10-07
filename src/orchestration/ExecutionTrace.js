export class ExecutionTrace {
  constructor() {
    this.events = [];
  }

  record(type, payload = {}) {
    const entry = {
      index: this.events.length,
      type,
      payload: typeof payload === 'object' ? JSON.parse(JSON.stringify(payload)) : payload,
      timestamp: Date.now()
    };
    this.events.push(entry);
    return entry;
  }

  getEvents() {
    return [...this.events];
  }

  getEventsByType(type) {
    return this.events.filter(e => e.type === type);
  }

  toJSON() {
    return {
      eventsCount: this.events.length,
      events: this.events
    };
  }
}
