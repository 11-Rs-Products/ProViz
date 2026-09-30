/**
 * ExplorationPriority — Priority weighting for exploration queues and targets.
 */

export const ExplorationPriority = Object.freeze({
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
    BACKGROUND: 'BACKGROUND',
});

export const PRIORITY_WEIGHTS = Object.freeze({
    [ExplorationPriority.CRITICAL]: 1.0,
    [ExplorationPriority.HIGH]: 0.8,
    [ExplorationPriority.MEDIUM]: 0.5,
    [ExplorationPriority.LOW]: 0.3,
    [ExplorationPriority.BACKGROUND]: 0.1,
});
