/**
 * TypeChange — Specialized change descriptor for inferred types, shapes, nullability, and value domain shifts.
 */

import { SemanticChange } from './SemanticChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class TypeChange extends SemanticChange {
    /**
     * @param {object} params
     * @param {string} params.targetName - Variable or expression identifier
     * @param {string|object} [params.oldType='unknown']
     * @param {string|object} [params.newType='unknown']
     * @param {boolean} [params.oldNullable=false]
     * @param {boolean} [params.newNullable=false]
     * @param {object|null} [params.oldShape=null]
     * @param {object|null} [params.newShape=null]
     */
    constructor({
        targetName,
        oldType = 'unknown',
        newType = 'unknown',
        oldNullable = false,
        newNullable = false,
        oldShape = null,
        newShape = null,
        kind = CHANGE_KINDS.TYPE_CHANGED,
        severity = CHANGE_SEVERITIES.MINOR,
        ...rest
    } = {}) {
        super({
            kind,
            severity,
            symbolIds: [targetName],
            before: { type: oldType, nullable: oldNullable, shape: oldShape },
            after: { type: newType, nullable: newNullable, shape: newShape },
            metadata: {
                targetName,
                oldType,
                newType,
                oldNullable,
                newNullable,
                ...(rest.metadata || {}),
            },
            ...rest,
        });
        this.targetName = targetName;
        this.oldType = oldType;
        this.newType = newType;
        this.oldNullable = Boolean(oldNullable);
        this.newNullable = Boolean(newNullable);
        this.oldShape = oldShape;
        this.newShape = newShape;
        Object.freeze(this);
    }
}
