/**
 * FunctionChange — Specialized change descriptor for function additions, removals, and modifications.
 */

import { SemanticChange } from './SemanticChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class FunctionChange extends SemanticChange {
    /**
     * @param {object} params
     * @param {string} params.functionName
     * @param {Array<string>} [params.oldParams=[]]
     * @param {Array<string>} [params.newParams=[]]
     * @param {string} [params.oldBody='']
     * @param {string} [params.newBody='']
     * @param {*} [params.oldReturn=null]
     * @param {*} [params.newReturn=null]
     */
    constructor({
        functionName,
        oldParams = [],
        newParams = [],
        oldBody = '',
        newBody = '',
        oldReturn = null,
        newReturn = null,
        kind = CHANGE_KINDS.FUNCTION_BODY_CHANGED,
        severity = CHANGE_SEVERITIES.MAJOR,
        ...rest
    } = {}) {
        super({
            kind,
            severity,
            functionIds: [functionName],
            before: { params: oldParams, body: oldBody, return: oldReturn },
            after: { params: newParams, body: newBody, return: newReturn },
            metadata: {
                functionName,
                oldParams,
                newParams,
                ...(rest.metadata || {}),
            },
            ...rest,
        });
        this.functionName = functionName;
        this.oldParams = Object.freeze([...oldParams]);
        this.newParams = Object.freeze([...newParams]);
        this.oldBody = oldBody;
        this.newBody = newBody;
        this.oldReturn = oldReturn;
        this.newReturn = newReturn;
        Object.freeze(this);
    }
}
