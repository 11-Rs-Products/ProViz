/**
 * SpecificationConfidence — Confidence taxonomy and weights for mined specifications.
 */

export const SpecificationConfidence = Object.freeze({
    PROVEN: 'PROVEN',
    HIGH_CONFIDENCE: 'HIGH_CONFIDENCE',
    MEDIUM_CONFIDENCE: 'MEDIUM_CONFIDENCE',
    LOW_CONFIDENCE: 'LOW_CONFIDENCE',
    OBSERVED_ONLY: 'OBSERVED_ONLY',
    UNKNOWN: 'UNKNOWN',
});

export const CONFIDENCE_WEIGHTS = Object.freeze({
    [SpecificationConfidence.PROVEN]: 1.0,
    [SpecificationConfidence.HIGH_CONFIDENCE]: 0.85,
    [SpecificationConfidence.MEDIUM_CONFIDENCE]: 0.6,
    [SpecificationConfidence.LOW_CONFIDENCE]: 0.35,
    [SpecificationConfidence.OBSERVED_ONLY]: 0.2,
    [SpecificationConfidence.UNKNOWN]: 0.0,
});
