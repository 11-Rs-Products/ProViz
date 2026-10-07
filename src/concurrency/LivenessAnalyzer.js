/**
 * LivenessAnalyzer.js
 * Analyzes execution traces to detect liveness violations, infinite waiting, and livelocks.
 */

import { LivenessKind } from './LivenessProperty.js';

export class LivenessAnalyzer {
  /**
   * Analyzes an execution trace against liveness properties.
   * @param {Array<{ id: string, contextId: string, type: string, resourceId?: string, timestamp?: number }>} trace
   * @param {Array<import('./LivenessProperty.js').LivenessProperty>} properties
   * @returns {Array<{ propertyId: string, contextId: string, violation: string }>}
   */
  verifyLiveness(trace, properties) {
    const violations = [];

    for (const prop of properties) {
      if (prop.kind === LivenessKind.EVENTUALLY_RELEASES && prop.resourceId) {
        // Track acquisitions without matching releases
        const acquisitions = [];
        const releases = new Set();

        for (const ev of trace) {
          if (ev.resourceId === prop.resourceId) {
            if (ev.type === 'ACQUIRE' || ev.type === 'LOCK') {
              acquisitions.push(ev);
            } else if (ev.type === 'RELEASE' || ev.type === 'UNLOCK') {
              releases.add(ev.contextId);
            }
          }
        }

        for (const acq of acquisitions) {
          if (!releases.has(acq.contextId)) {
            violations.push({
              propertyId: prop.id,
              contextId: acq.contextId,
              resourceId: prop.resourceId,
              violation: `Liveness violation: Context ${acq.contextId} acquired resource '${prop.resourceId}' at event ${acq.id} but never released it.`
            });
          }
        }
      } else if (prop.kind === LivenessKind.EVENTUALLY_COMPLETES) {
        const startedContexts = new Set();
        const completedContexts = new Set();

        for (const ev of trace) {
          if (prop.targetContextId === '*' || ev.contextId === prop.targetContextId) {
            if (ev.type === 'START' || ev.type === 'SPAWN') {
              startedContexts.add(ev.contextId);
            } else if (ev.type === 'COMPLETE' || ev.type === 'FINISH' || ev.type === 'TERMINATE') {
              completedContexts.add(ev.contextId);
            }
          }
        }

        for (const ctx of startedContexts) {
          if (!completedContexts.has(ctx)) {
            violations.push({
              propertyId: prop.id,
              contextId: ctx,
              violation: `Liveness violation: Context ${ctx} was started but never completed in the trace.`
            });
          }
        }
      } else if (prop.kind === LivenessKind.EVENTUALLY_RESPONDS) {
        const requests = new Map(); // requestId -> event
        const responded = new Set();

        for (const ev of trace) {
          if (ev.type === 'REQUEST') {
            requests.set(ev.id, ev);
          } else if (ev.type === 'RESPONSE' && ev.requestId) {
            responded.add(ev.requestId);
          }
        }

        for (const [reqId, reqEv] of requests.entries()) {
          if (!responded.has(reqId)) {
            violations.push({
              propertyId: prop.id,
              contextId: reqEv.contextId,
              requestId: reqId,
              violation: `Liveness violation: Request ${reqId} from context ${reqEv.contextId} never received a response.`
            });
          }
        }
      }
    }

    return violations;
  }
}
