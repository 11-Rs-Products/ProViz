import { VerificationEvent } from './VerificationEvent.js';

export class VerificationEventLog {
  constructor() {
    this.events = [];
  }

  append(eventOrType, payload = {}) {
    const event = eventOrType instanceof VerificationEvent ? eventOrType : new VerificationEvent({ type: eventOrType, payload });
    this.events.push(event);
    return event;
  }

  getEvents() {
    return [...this.events];
  }

  getEventsByType(type) {
    return this.events.filter(e => e.type === type);
  }

  clear() {
    this.events = [];
  }

  toJSON() {
    return {
      eventsCount: this.events.length,
      events: this.events.map(e => e.toJSON())
    };
  }
}
