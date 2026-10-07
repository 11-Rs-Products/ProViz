/**
 * StarvationAnalyzer.js
 * Detects contexts that may be unfairly bypassed or starved from accessing resources.
 */

export class StarvationAnalyzer {
  /**
   * Analyzes wait and grant events to detect thread starvation.
   * @param {Array<{ id: string, contextId: string, type: string, resourceId: string, timestamp?: number }>} trace
   * @param {Object} [options={}]
   * @param {number} [options.bypassThreshold=3] Number of times a context is bypassed while waiting before flagging starvation
   * @returns {Array<{ contextId: string, resourceId: string, bypassCount: number, message: string }>}
   */
  detectStarvation(trace, { bypassThreshold = 3 } = {}) {
    const starvationEvents = [];
    /** @type {Map<string, Map<string, number>>} resourceId -> (contextId -> waitStartTimestamp) */
    const waitingContexts = new Map();
    /** @type {Map<string, Map<string, number>>} resourceId -> (contextId -> bypassCount) */
    const bypassCounters = new Map();

    for (const ev of trace) {
      const { contextId, type, resourceId } = ev;
      if (!resourceId) continue;

      if (!waitingContexts.has(resourceId)) {
        waitingContexts.set(resourceId, new Map());
        bypassCounters.set(resourceId, new Map());
      }

      const resWaiters = waitingContexts.get(resourceId);
      const resBypasses = bypassCounters.get(resourceId);

      if (type === 'WAIT' || type === 'LOCK_ATTEMPT' || type === 'ENQUEUE') {
        resWaiters.set(contextId, ev.timestamp || Date.now());
        if (!resBypasses.has(contextId)) {
          resBypasses.set(contextId, 0);
        }
      } else if (type === 'ACQUIRE' || type === 'LOCK_GRANTED' || type === 'DEQUEUE') {
        // If this context was granted the resource, remove from waiters
        resWaiters.delete(contextId);
        resBypasses.delete(contextId);

        // Every OTHER context currently waiting on this resource was bypassed
        for (const [waiterCtx] of resWaiters.entries()) {
          const currentBypasses = (resBypasses.get(waiterCtx) || 0) + 1;
          resBypasses.set(waiterCtx, currentBypasses);

          if (currentBypasses >= bypassThreshold) {
            starvationEvents.push({
              contextId: waiterCtx,
              resourceId,
              bypassCount: currentBypasses,
              message: `Potential starvation detected: Context ${waiterCtx} was bypassed ${currentBypasses} times while waiting for resource '${resourceId}'.`
            });
          }
        }
      }
    }

    return starvationEvents;
  }
}
