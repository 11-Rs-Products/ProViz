/**
 * VerificationEventBus.js
 * Central high-throughput event bus coordinating all pub/sub, journaling, and event filtering in ProViz OS.
 */

import { EventRouter } from './EventRouter.js';
import { EventJournal } from './EventJournal.js';
import { VerificationEvent } from './VerificationEvent.js';

export class VerificationEventBus {
  /**
   * @param {Object} [options]
   * @param {EventJournal} [options.journal]
   */
  constructor(options = {}) {
    this.router = new EventRouter();
    this.journal = options.journal || new EventJournal();
  }

  publish(eventData) {
    const event = eventData instanceof VerificationEvent ? eventData : new VerificationEvent(eventData);
    this.journal.append(event);
    this.router.route(event);
    return event;
  }

  subscribe(filter, handler) {
    return this.router.subscribe(filter, handler);
  }

  unsubscribe(subId) {
    return this.router.unsubscribe(subId);
  }

  getJournal() {
    return this.journal;
  }

  getEvents(filter = null) {
    if (!filter) return this.journal.getEvents();
    return this.journal.filter(e => filter.matches ? filter.matches(e) : true);
  }

  clear() {
    this.journal = new EventJournal();
  }
}
