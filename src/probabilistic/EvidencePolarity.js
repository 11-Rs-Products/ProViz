/**
 * EvidencePolarity — Indicates whether an evidence item supports, refutes, or is neutral towards a hypothesis/property.
 */

export const EVIDENCE_POLARITIES = Object.freeze({
    SUPPORTS: 'SUPPORTS',
    REFUTES: 'REFUTES',
    CONFLICTS: 'CONFLICTS',
    NEUTRAL: 'NEUTRAL',
    UNKNOWN: 'UNKNOWN',
});

export class EvidencePolarity {
    static SUPPORTS = EVIDENCE_POLARITIES.SUPPORTS;
    static REFUTES = EVIDENCE_POLARITIES.REFUTES;
    static CONFLICTS = EVIDENCE_POLARITIES.CONFLICTS;
    static NEUTRAL = EVIDENCE_POLARITIES.NEUTRAL;
    static UNKNOWN = EVIDENCE_POLARITIES.UNKNOWN;

    static isValid(polarity) {
        return Object.values(EVIDENCE_POLARITIES).includes(polarity);
    }
}
