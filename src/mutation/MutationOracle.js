/**
 * MutationOracle — Defines criteria for detecting behavioral divergences between original and mutated executions.
 */

export const ORACLE_KINDS = Object.freeze({
    EXCEPTION: 'EXCEPTION',
    RETURN_VALUE: 'RETURN_VALUE',
    OUTPUT: 'OUTPUT',
    ASSERTION: 'ASSERTION',
    WATCH_VALUE: 'WATCH_VALUE',
    PATH: 'PATH',
    BRANCH: 'BRANCH',
    STATE: 'STATE',
    CONTRACT: 'CONTRACT',
    FINDING: 'FINDING',
    COVERAGE: 'COVERAGE',
});

export class MutationOracle {
    /**
     * @param {object} params
     * @param {string} [params.kind=ORACLE_KINDS.EXCEPTION]
     * @param {string} [params.description='']
     */
    constructor({
        kind = ORACLE_KINDS.EXCEPTION,
        description = '',
    } = {}) {
        this.kind = kind;
        this.description = description || `Oracle for ${kind}`;
        Object.freeze(this);
    }

    /**
     * Compare original and mutant observations under this oracle.
     * @param {object} origObs
     * @param {object} mutObs
     * @returns {{ detected: boolean, reason: string }}
     */
    evaluate(origObs = {}, mutObs = {}) {
        switch (this.kind) {
            case ORACLE_KINDS.EXCEPTION: {
                const origExc = Boolean(origObs?.exception);
                const mutExc = Boolean(mutObs?.exception);
                if (origExc !== mutExc || (origExc && origObs?.exception?.type !== mutObs?.exception?.type)) {
                    return { detected: true, reason: 'Exception divergence detected' };
                }
                return { detected: false, reason: 'No exception divergence' };
            }
            case ORACLE_KINDS.RETURN_VALUE: {
                if (origObs?.returnedValue !== mutObs?.returnedValue) {
                    return { detected: true, reason: `Return value divergence: ${origObs?.returnedValue} vs ${mutObs?.returnedValue}` };
                }
                return { detected: false, reason: 'Return values match' };
            }
            case ORACLE_KINDS.WATCH_VALUE: {
                if (origObs?.watchValue !== mutObs?.watchValue) {
                    return { detected: true, reason: `Watch value divergence` };
                }
                return { detected: false, reason: 'Watch values match' };
            }
            default: {
                const diffReturn = origObs?.returnedValue !== mutObs?.returnedValue;
                const diffExc = Boolean(origObs?.exception) !== Boolean(mutObs?.exception);
                if (diffReturn || diffExc) {
                    return { detected: true, reason: 'Behavioral divergence observed' };
                }
                return { detected: false, reason: 'No behavioral divergence detected' };
            }
        }
    }
}
