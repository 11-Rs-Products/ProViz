/**
 * EventRouter.js
 * Dispatches verification events efficiently to matching active subscriptions.
 */

import { EventSubscription } from './EventSubscription.js';

export class EventRouter {
  constructor() {
    /** @type {Map<string, EventSubscription>} */
    this._subscriptions = new Map();
  }

  subscribe(filter, handler) {
    const id = `sub_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const sub = new EventSubscription({ id, filter, handler });
    this._subscriptions.set(id, sub);
    return sub;
  }

  unsubscribe(subId) {
    const sub = this._subscriptions.get(subId);
    if (sub) {
      sub.unsubscribe();
      this._subscriptions.delete(subId);
      return true;
    }
    return false;
  }

  route(event) {
    let dispatchedCount = 0;
    for (const [id, sub] of this._subscriptions.entries()) {
      if (!sub.isActive) {
        this._subscriptions.delete(id);
        continue;
      }
      if (sub.filter.matches(event)) {
        try {
          sub.handler(event);
          dispatchedCount++;
        } catch (err) {
          console.error(`[EventRouter] Handler error for sub ${id}:`, err);
        }
      }
    }
    return dispatchedCount;
  }

  get activeSubscriptionCount() {
    return this._subscriptions.size;
  }
}
