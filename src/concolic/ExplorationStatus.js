/**
 * ExplorationStatus — Statuses for concolic exploration sessions.
 */

export const EXPLORATION_STATUSES = Object.freeze({
    NOT_STARTED: 'NOT_STARTED',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    BOUND_REACHED: 'BOUND_REACHED',
    TIMEOUT: 'TIMEOUT',
    CANCELLED: 'CANCELLED',
    PARTIAL: 'PARTIAL',
    UNSUPPORTED: 'UNSUPPORTED',
    FAILED: 'FAILED',
});
