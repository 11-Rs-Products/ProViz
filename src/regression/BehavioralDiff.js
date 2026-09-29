/**
 * BehavioralDiff — Compares dynamic execution observations, returns, exceptions, and states.
 */

import { BehaviorChange } from './BehaviorChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class BehavioralDiff {
    /**
     * Compares two test observations or runtime execution traces.
     *
     * @param {import('../testing/TestObservation.js').TestObservation|object} beforeObservation
     * @param {import('../testing/TestObservation.js').TestObservation|object} afterObservation
     * @param {string} [targetContext='execution']
     * @returns {Array<BehaviorChange>}
     */
    static diff(beforeObservation, afterObservation, targetContext = 'execution') {
        if (!beforeObservation || !afterObservation) return [];

        const changes = [];
        const oldReturn = beforeObservation.returnValue;
        const newReturn = afterObservation.returnValue;
        const oldEx = beforeObservation.exception;
        const newEx = afterObservation.exception;

        const returnChanged = oldReturn !== newReturn && JSON.stringify(oldReturn) !== JSON.stringify(newReturn);
        const exChanged = (oldEx && !newEx) || (!oldEx && newEx) || (oldEx && newEx && (oldEx.type !== newEx.type || oldEx.message !== newEx.message));

        if (exChanged) {
            changes.push(new BehaviorChange({
                targetContext,
                oldReturn,
                newReturn,
                oldException: oldEx,
                newException: newEx,
                kind: CHANGE_KINDS.EXCEPTION_BEHAVIOR_CHANGED,
                severity: newEx ? CHANGE_SEVERITIES.CRITICAL : CHANGE_SEVERITIES.MAJOR,
                causes: [newEx ? `Execution raised ${newEx.type || 'exception'}` : 'Previous exception no longer raised'],
                consequences: [newEx ? 'Behavioral regression or new error condition' : 'Failure fixed or error handled'],
            }));
        } else if (returnChanged) {
            changes.push(new BehaviorChange({
                targetContext,
                oldReturn,
                newReturn,
                oldException: oldEx,
                newException: newEx,
                kind: CHANGE_KINDS.RETURN_BEHAVIOR_CHANGED,
                severity: CHANGE_SEVERITIES.MAJOR,
                causes: [`Return value changed from ${JSON.stringify(oldReturn)} to ${JSON.stringify(newReturn)}`],
                consequences: ['Downstream caller functions receive updated values'],
            }));
        }

        return changes;
    }
}
