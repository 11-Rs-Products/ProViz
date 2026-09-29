/**
 * MutationStatus — Execution and classification statuses of a mutation candidate.
 */

export const MUTATION_STATUS = Object.freeze({
    GENERATED: 'GENERATED',
    EXECUTED: 'EXECUTED',
    KILLED: 'KILLED',
    SURVIVED: 'SURVIVED',
    EQUIVALENT: 'EQUIVALENT',
    UNKNOWN: 'UNKNOWN',
    UNSUPPORTED: 'UNSUPPORTED',
    TIMEOUT: 'TIMEOUT',
    INVALID: 'INVALID',
});
