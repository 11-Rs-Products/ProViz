/**
 * ExplorationStatus — Lifecycle states of an exploration process or campaign.
 */

export const ExplorationStatus = Object.freeze({
    CREATED: 'CREATED',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    EXHAUSTED: 'EXHAUSTED',
    CANCELLED: 'CANCELLED',
    FAILED: 'FAILED',
    BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
    INCONCLUSIVE: 'INCONCLUSIVE',
});
