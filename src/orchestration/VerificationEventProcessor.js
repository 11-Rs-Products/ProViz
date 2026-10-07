export class VerificationEventProcessor {
  constructor({ eventLog = null } = {}) {
    this.eventLog = eventLog;
    this.handlers = new Map(); // eventType -> Array<Function>
  }

  subscribe(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
    return () => {
      const list = this.handlers.get(eventType) || [];
      this.handlers.set(eventType, list.filter(h => h !== handler));
    };
  }

  process(event) {
    if (this.eventLog) {
      this.eventLog.append(event);
    }

    const listeners = this.handlers.get(event.type) || [];
    const wildcardListeners = this.handlers.get('*') || [];

    for (const h of [...listeners, ...wildcardListeners]) {
      try {
        h(event);
      } catch (err) {
        // Event processing failure must not abort pipeline
      }
    }
  }
}
