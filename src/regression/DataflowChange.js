/**
 * DataflowChange — Specialized change descriptor for definition-use chains, aliases, and reaching defs.
 */

import { SemanticChange } from './SemanticChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class DataflowChange extends SemanticChange {
    /**
     * @param {object} params
     * @param {string} params.targetVariable
     * @param {Array<string>} [params.oldUses=[]]
     * @param {Array<string>} [params.newUses=[]]
     * @param {Array<string>} [params.oldAliases=[]]
     * @param {Array<string>} [params.newAliases=[]]
     */
    constructor({
        targetVariable,
        oldUses = [],
        newUses = [],
        oldAliases = [],
        newAliases = [],
        kind = CHANGE_KINDS.DEFINITION_CHANGED,
        severity = CHANGE_SEVERITIES.MAJOR,
        ...rest
    } = {}) {
        super({
            kind,
            severity,
            symbolIds: [targetVariable],
            before: { uses: oldUses, aliases: oldAliases },
            after: { uses: newUses, aliases: newAliases },
            metadata: {
                targetVariable,
                oldUses,
                newUses,
                oldAliases,
                newAliases,
                ...(rest.metadata || {}),
            },
            ...rest,
        });
        this.targetVariable = targetVariable;
        this.oldUses = Object.freeze([...oldUses]);
        this.newUses = Object.freeze([...newUses]);
        this.oldAliases = Object.freeze([...oldAliases]);
        this.newAliases = Object.freeze([...newAliases]);
        Object.freeze(this);
    }
}
