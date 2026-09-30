/**
 * ExplorationConfidence — Confidence levels and numerical mappings.
 */

export const ExplorationConfidence = Object.freeze({
    PROVEN: 'PROVEN',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
    OBSERVED: 'OBSERVED',
    UNKNOWN: 'UNKNOWN',
});

export const EXPLORATION_CONFIDENCE_WEIGHTS = Object.freeze({
    [ExplorationConfidence.PROVEN]: 1.0,
    [ExplorationConfidence.HIGH]: 0.85,
    [ExplorationConfidence.MEDIUM]: 0.6,
    [ExplorationConfidence.LOW]: 0.35,
    [ExplorationConfidence.OBSERVED]: 0.2,
    [ExplorationConfidence.UNKNOWN]: 0.0,
});
