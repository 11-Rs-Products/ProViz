/**
 * SymbolicChange — Specialized change descriptor for symbolic path condition and satisfiability shifts.
 */

import { SemanticChange } from './SemanticChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class SymbolicChange extends SemanticChange {
    /**
     * @param {object} params
     * @param {string} params.pathId
     * @param {Array<string>} [params.oldConstraints=[]]
     * @param {Array<string>} [params.newConstraints=[]]
     * @param {boolean} [params.wasFeasible=true]
     * @param {boolean} [params.isFeasible=true]
     */
    constructor({
        pathId,
        oldConstraints = [],
        newConstraints = [],
        wasFeasible = true,
        isFeasible = true,
        kind = CHANGE_KINDS.PATH_CONDITION_CHANGED,
        severity = CHANGE_SEVERITIES.MAJOR,
        ...rest
    } = {}) {
        super({
            kind,
            severity,
            before: { constraints: oldConstraints, feasible: wasFeasible },
            after: { constraints: newConstraints, feasible: isFeasible },
            metadata: {
                pathId,
                oldConstraints,
                newConstraints,
                wasFeasible,
                isFeasible,
                ...(rest.metadata || {}),
            },
            ...rest,
        });
        this.pathId = pathId;
        this.oldConstraints = Object.freeze([...oldConstraints]);
        this.newConstraints = Object.freeze([...newConstraints]);
        this.wasFeasible = Boolean(wasFeasible);
        this.isFeasible = Boolean(isFeasible);
        Object.freeze(this);
    }
}
