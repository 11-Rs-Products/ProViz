/**
 * EventSubscription.js
 * Subscription handle binding a subscriber handler to an EventFilter.
 */

import { EventFilter } from './EventFilter.js';

export class EventSubscription {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {EventFilter|Object} [options.filter]
   * @param {Function} options.handler
   */
  constructor({ id, filter = {}, handler }) {
    if (!id || typeof handler !== 'function') {
      throw new Error('EventSubscription requires id and handler function');
    }
    this.id = id;
    this.filter = filter instanceof EventFilter ? filter : new EventFilter(filter);
    this.handler = handler;
    this.isActive = true;
  }

  unsubscribe() {
    this.isActive = false;
  }
}
