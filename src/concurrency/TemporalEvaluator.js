/**
 * TemporalEvaluator.js
 * Evaluates temporal properties and formulas against concrete execution traces.
 */

import { TemporalPropertyKind } from './TemporalPropertyKind.js';
import { TemporalCounterexample } from './TemporalCounterexample.js';

export class TemporalEvaluator {
  /**
   * Evaluates a TemporalProperty against an execution trace.
   * @param {import('./TemporalProperty.js').TemporalProperty} property
   * @param {Array<Object>} trace Sequence of state/event snapshots
   * @returns {{ satisfied: boolean, counterexample?: TemporalCounterexample }}
   */
  evaluate(property, trace) {
    if (!trace || trace.length === 0) {
      return { satisfied: true };
    }

    const pred = typeof property.predicate === 'function' ? property.predicate : () => true;
    const respPred = typeof property.responsePredicate === 'function' ? property.responsePredicate : () => true;

    switch (property.kind) {
      case TemporalPropertyKind.ALWAYS: {
        for (let i = 0; i < trace.length; i++) {
          if (!pred(trace[i], i, trace)) {
            return {
              satisfied: false,
              counterexample: new TemporalCounterexample({
                propertyId: property.id,
                propertyKind: property.kind,
                violatingStepIndex: i,
                violatingEvent: trace[i],
                trace: trace.slice(0, i + 1),
                reason: `Invariant violated at step ${i}: condition evaluated to false.`
              })
            };
          }
        }
        return { satisfied: true };
      }

      case TemporalPropertyKind.EVENTUALLY: {
        for (let i = 0; i < trace.length; i++) {
          if (pred(trace[i], i, trace)) {
            return { satisfied: true };
          }
        }
        return {
          satisfied: false,
          counterexample: new TemporalCounterexample({
            propertyId: property.id,
            propertyKind: property.kind,
            violatingStepIndex: trace.length - 1,
            violatingEvent: trace[trace.length - 1],
            trace: [...trace],
            reason: `Liveness requirement not met: property was never satisfied across all ${trace.length} trace steps.`
          })
        };
      }

      case TemporalPropertyKind.RESPONSE:
      case TemporalPropertyKind.BOUNDED_RESPONSE:
      case TemporalPropertyKind.RECOVERY: {
        for (let i = 0; i < trace.length; i++) {
          if (pred(trace[i], i, trace)) {
            // Must eventually satisfy respPred at some j >= i
            let satisfied = false;
            const maxStep = property.timeBound ? Math.min(trace.length, i + property.timeBound + 1) : trace.length;

            for (let j = i; j < maxStep; j++) {
              if (respPred(trace[j], j, trace)) {
                satisfied = true;
                break;
              }
            }

            if (!satisfied) {
              return {
                satisfied: false,
                counterexample: new TemporalCounterexample({
                  propertyId: property.id,
                  propertyKind: property.kind,
                  violatingStepIndex: i,
                  violatingEvent: trace[i],
                  trace: trace.slice(0, maxStep),
                  reason: `Response requirement violated: stimulus at step ${i} did not receive matching response within bound (${property.timeBound || 'infinite'}).`
                })
              };
            }
          }
        }
        return { satisfied: true };
      }

      case TemporalPropertyKind.PRECEDENCE: {
        // q must be preceded by p: if q occurs, p must have occurred earlier
        let pSeen = false;
        for (let i = 0; i < trace.length; i++) {
          if (pred(trace[i], i, trace)) {
            pSeen = true;
          }
          if (respPred(trace[i], i, trace) && !pSeen) {
            return {
              satisfied: false,
              counterexample: new TemporalCounterexample({
                propertyId: property.id,
                propertyKind: property.kind,
                violatingStepIndex: i,
                violatingEvent: trace[i],
                trace: trace.slice(0, i + 1),
                reason: `Precedence violated: target event occurred at step ${i} before prerequisite event.`
              })
            };
          }
        }
        return { satisfied: true };
      }

      case TemporalPropertyKind.ABSENCE: {
        for (let i = 0; i < trace.length; i++) {
          if (pred(trace[i], i, trace)) {
            return {
              satisfied: false,
              counterexample: new TemporalCounterexample({
                propertyId: property.id,
                propertyKind: property.kind,
                violatingStepIndex: i,
                violatingEvent: trace[i],
                trace: trace.slice(0, i + 1),
                reason: `Absence violated: forbidden condition occurred at step ${i}.`
              })
            };
          }
        }
        return { satisfied: true };
      }

      default:
        return { satisfied: true };
    }
  }
}
