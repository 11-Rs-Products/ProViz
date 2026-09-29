/**
 * MutationSessionStatus — Lifecycle status of a mutation analysis session.
 */

export const MUTATION_SESSION_STATUS = Object.freeze({
    NOT_STARTED: 'NOT_STARTED',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    PARTIAL: 'PARTIAL',
    TIMEOUT: 'TIMEOUT',
    CANCELLED: 'CANCELLED',
    FAILED: 'FAILED',
});
