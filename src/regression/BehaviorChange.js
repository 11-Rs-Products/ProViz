/**
 * BehaviorChange — Specialized change descriptor for runtime observation differences.
 */

import { SemanticChange } from './SemanticChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class BehaviorChange extends SemanticChange {
    /**
     * @param {object} params
     * @param {string} params.targetContext - Function, test or execution context
     * @param {*} [params.oldReturn=undefined]
     * @param {*} [params.newReturn=undefined]
     * @param {object|null} [params.oldException=null]
     * @param {object|null} [params.newException=null]
     * @param {Array<object>} [params.stateDeltas=[]]
     */
    constructor({
        targetContext,
        oldReturn = undefined,
        newReturn = undefined,
        oldException = null,
        newException = null,
        stateDeltas = [],
        kind = oldException !== newException ? CHANGE_KINDS.EXCEPTION_BEHAVIOR_CHANGED : CHANGE_KINDS.RUNTIME_BEHAVIOR_CHANGED,
        severity = newException ? CHANGE_SEVERITIES.CRITICAL : CHANGE_SEVERITIES.MAJOR,
        ...rest
    } = {}) {
        super({
            kind,
            severity,
            before: { return: oldReturn, exception: oldException },
            after: { return: newReturn, exception: newException, stateDeltas },
            metadata: {
                targetContext,
                oldReturn,
                newReturn,
                oldException,
                newException,
                stateDeltas,
                ...(rest.metadata || {}),
            },
            ...rest,
        });
        this.targetContext = targetContext;
        this.oldReturn = oldReturn;
        this.newReturn = newReturn;
        this.oldException = oldException;
        this.newException = newException;
        this.stateDeltas = Object.freeze([...stateDeltas]);
        Object.freeze(this);
    }
}
