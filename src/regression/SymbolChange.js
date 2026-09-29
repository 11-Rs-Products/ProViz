/**
 * SymbolChange — Specialized change descriptor for symbol additions, removals, renames, and rebindings.
 */

import { SemanticChange } from './SemanticChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class SymbolChange extends SemanticChange {
    /**
     * @param {object} params
     * @param {string} params.symbolName
     * @param {string} [params.symbolKind='variable']
     * @param {string} [params.scope='global']
     * @param {*} [params.oldBinding=null]
     * @param {*} [params.newBinding=null]
     */
    constructor({
        symbolName,
        symbolKind = 'variable',
        scope = 'global',
        oldBinding = null,
        newBinding = null,
        kind = CHANGE_KINDS.SYMBOL_REBOUND,
        severity = CHANGE_SEVERITIES.MINOR,
        ...rest
    } = {}) {
        super({
            kind,
            severity,
            symbolIds: [symbolName],
            before: oldBinding,
            after: newBinding,
            metadata: {
                symbolName,
                symbolKind,
                scope,
                ...(rest.metadata || {}),
            },
            ...rest,
        });
        this.symbolName = symbolName;
        this.symbolKind = symbolKind;
        this.scope = scope;
        this.oldBinding = oldBinding;
        this.newBinding = newBinding;
        Object.freeze(this);
    }
}
