/**
 * ConfidenceScale — Standardized qualitative confidence categories for properties and evidence.
 */

export const CONFIDENCE_LEVELS = Object.freeze({
    FORMALLY_ESTABLISHED: 'FORMALLY_ESTABLISHED',
    VERY_HIGH: 'VERY_HIGH',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
    VERY_LOW: 'VERY_LOW',
    UNKNOWN: 'UNKNOWN',
    CONFLICTING: 'CONFLICTING',
});

export class ConfidenceScale {
    static FORMALLY_ESTABLISHED = CONFIDENCE_LEVELS.FORMALLY_ESTABLISHED;
    static VERY_HIGH = CONFIDENCE_LEVELS.VERY_HIGH;
    static HIGH = CONFIDENCE_LEVELS.HIGH;
    static MEDIUM = CONFIDENCE_LEVELS.MEDIUM;
    static LOW = CONFIDENCE_LEVELS.LOW;
    static VERY_LOW = CONFIDENCE_LEVELS.VERY_LOW;
    static UNKNOWN = CONFIDENCE_LEVELS.UNKNOWN;
    static CONFLICTING = CONFIDENCE_LEVELS.CONFLICTING;

    static fromScore(score, isFormal = false, isConflicting = false) {
        if (isConflicting) return CONFIDENCE_LEVELS.CONFLICTING;
        if (isFormal && score >= 0.999) return CONFIDENCE_LEVELS.FORMALLY_ESTABLISHED;
        if (score >= 0.95) return CONFIDENCE_LEVELS.VERY_HIGH;
        if (score >= 0.8) return CONFIDENCE_LEVELS.HIGH;
        if (score >= 0.5) return CONFIDENCE_LEVELS.MEDIUM;
        if (score >= 0.25) return CONFIDENCE_LEVELS.LOW;
        if (score > 0) return CONFIDENCE_LEVELS.VERY_LOW;
        return CONFIDENCE_LEVELS.UNKNOWN;
    }

    static toNumericLowerBound(level) {
        switch (level) {
            case CONFIDENCE_LEVELS.FORMALLY_ESTABLISHED: return 1.0;
            case CONFIDENCE_LEVELS.VERY_HIGH: return 0.95;
            case CONFIDENCE_LEVELS.HIGH: return 0.8;
            case CONFIDENCE_LEVELS.MEDIUM: return 0.5;
            case CONFIDENCE_LEVELS.LOW: return 0.25;
            case CONFIDENCE_LEVELS.VERY_LOW: return 0.05;
            case CONFIDENCE_LEVELS.CONFLICTING:
            case CONFIDENCE_LEVELS.UNKNOWN:
            default:
                return 0.0;
        }
    }
}
