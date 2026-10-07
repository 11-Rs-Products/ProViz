export class EventFrequencyModel {
  constructor(events = new Map()) {
    this.events = new Map(events); // eventName -> count
  }

  recordEvent(eventName, count = 1) {
    const next = new Map(this.events);
    next.set(eventName, (next.get(eventName) || 0) + count);
    return new EventFrequencyModel(next);
  }

  get totalEvents() {
    let tot = 0;
    for (const c of this.events.values()) tot += c;
    return tot;
  }

  frequencyOf(eventName) {
    return this.events.get(eventName) || 0;
  }

  probabilityOf(eventName) {
    const tot = this.totalEvents;
    if (tot === 0) return 0;
    return (this.events.get(eventName) || 0) / tot;
  }

  toJSON() {
    const obj = {};
    for (const [k, v] of this.events.entries()) obj[k] = v;
    return {
      type: 'EventFrequencyModel',
      totalEvents: this.totalEvents,
      frequencies: obj
    };
  }
}
