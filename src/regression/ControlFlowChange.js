/**
 * ControlFlowChange — Specialized change descriptor for CFG branches, loops, and dominance relationships.
 */

import { SemanticChange } from './SemanticChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class ControlFlowChange extends SemanticChange {
    /**
     * @param {object} params
     * @param {string} params.cfgTargetId
     * @param {string} [params.changeType='branch'] - 'branch' | 'loop' | 'exception'
     * @param {object|null} [params.oldBranch=null]
     * @param {object|null} [params.newBranch=null]
     * @param {Array<string>} [params.affectedBasicBlocks=[]]
     */
    constructor({
        cfgTargetId,
        changeType = 'branch',
        oldBranch = null,
        newBranch = null,
        affectedBasicBlocks = [],
        kind = CHANGE_KINDS.BRANCH_CHANGED,
        severity = CHANGE_SEVERITIES.MAJOR,
        ...rest
    } = {}) {
        super({
            kind,
            severity,
            before: oldBranch,
            after: newBranch,
            metadata: {
                cfgTargetId,
                changeType,
                affectedBasicBlocks,
                ...(rest.metadata || {}),
            },
            ...rest,
        });
        this.cfgTargetId = cfgTargetId;
        this.changeType = changeType;
        this.oldBranch = oldBranch;
        this.newBranch = newBranch;
        this.affectedBasicBlocks = Object.freeze([...affectedBasicBlocks]);
        Object.freeze(this);
    }
}
