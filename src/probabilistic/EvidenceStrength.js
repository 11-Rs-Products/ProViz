/**
 * EvidenceStrength — Categorical and numeric weight of evidence certainty.
 */

export const EVIDENCE_STRENGTHS = Object.freeze({
    FORMAL: 'FORMAL',
    STRONG: 'STRONG',
    MODERATE: 'MODERATE',
    WEAK: 'WEAK',
    OBSERVATIONAL: 'OBSERVATIONAL',
    UNKNOWN: 'UNKNOWN',
});

export class EvidenceStrength {
    static FORMAL = EVIDENCE_STRENGTHS.FORMAL;
    static STRONG = EVIDENCE_STRENGTHS.STRONG;
    static MODERATE = EVIDENCE_STRENGTHS.MODERATE;
    static WEAK = EVIDENCE_STRENGTHS.WEAK;
    static OBSERVATIONAL = EVIDENCE_STRENGTHS.OBSERVATIONAL;
    static UNKNOWN = EVIDENCE_STRENGTHS.UNKNOWN;

    static getWeight(strength) {
        switch (strength) {
            case EVIDENCE_STRENGTHS.FORMAL: return 1.0;
            case EVIDENCE_STRENGTHS.STRONG: return 0.85;
            case EVIDENCE_STRENGTHS.MODERATE: return 0.6;
            case EVIDENCE_STRENGTHS.WEAK: return 0.35;
            case EVIDENCE_STRENGTHS.OBSERVATIONAL: return 0.2;
            case EVIDENCE_STRENGTHS.UNKNOWN:
            default:
                return 0.1;
        }
    }

    static weight(strength) {
        return EvidenceStrength.getWeight(strength);
    }
}
