/**
 * VerificationChange — Specialized change descriptor for safety contracts and invariant status transitions.
 */

import { SemanticChange } from './SemanticChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class VerificationChange extends SemanticChange {
    /**
     * @param {object} params
     * @param {string} params.propertyId
     * @param {string} [params.propertyKind='safety']
     * @param {string} [params.oldStatus='UNKNOWN']
     * @param {string} [params.newStatus='UNKNOWN']
     * @param {string|null} [params.counterexampleId=null]
     */
    constructor({
        propertyId,
        propertyKind = 'safety',
        oldStatus = 'UNKNOWN',
        newStatus = 'UNKNOWN',
        counterexampleId = null,
        kind = CHANGE_KINDS.VERIFICATION_RESULT_CHANGED,
        severity = (oldStatus === 'PROVEN' && newStatus !== 'PROVEN') ? CHANGE_SEVERITIES.CRITICAL : CHANGE_SEVERITIES.MINOR,
        ...rest
    } = {}) {
        super({
            kind,
            severity,
            before: { status: oldStatus },
            after: { status: newStatus, counterexampleId },
            metadata: {
                propertyId,
                propertyKind,
                oldStatus,
                newStatus,
                counterexampleId,
                ...(rest.metadata || {}),
            },
            ...rest,
        });
        this.propertyId = propertyId;
        this.propertyKind = propertyKind;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.counterexampleId = counterexampleId;
        Object.freeze(this);
    }
}
