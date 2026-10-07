/**
 * EventJournal.js
 * Append-only immutable log of all VerificationEvents published across OS sessions.
 */

import { VerificationEvent } from './VerificationEvent.js';

export class EventJournal {
  constructor() {
    /** @type {VerificationEvent[]} */
    this._events = [];
    /** @type {Map<string, VerificationEvent>} */
    this._byId = new Map();
  }

  append(eventData) {
    const evt = eventData instanceof VerificationEvent ? eventData : new VerificationEvent(eventData);
    this._events.push(evt);
    this._byId.set(evt.eventId, evt);
    return evt;
  }

  getEvents() {
    return [...this._events];
  }

  getEventById(id) {
    return this._byId.get(id) || null;
  }

  get length() {
    return this._events.length;
  }

  filter(predicate) {
    return this._events.filter(predicate);
  }

  toJSON() {
    return {
      events: this._events.map(e => e.toJSON())
    };
  }

  static fromJSON(json) {
    const journal = new EventJournal();
    if (json.events) {
      for (const e of json.events) journal.append(VerificationEvent.fromJSON(e));
    }
    return journal;
  }
}
