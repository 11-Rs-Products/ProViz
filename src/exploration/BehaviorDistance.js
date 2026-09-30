/**
 * BehaviorDistance — Calculates structural and semantic distance between two BehavioralFingerprints.
 */

export class BehaviorDistance {
    /**
     * @param {BehavioralFingerprint} fpA
     * @param {BehavioralFingerprint} fpB
     * @returns {number} distance in [0.0, 1.0]
     */
    static distance(fpA, fpB) {
        if (!fpA || !fpB) return 1.0;
        if (fpA.equals(fpB)) return 0.0;

        let diff = 0.0;
        if (fpA.returnType !== fpB.returnType) diff += 0.3;
        if (fpA.exceptionType !== fpB.exceptionType) diff += 0.4;
        if (fpA.valueSummary !== fpB.valueSummary) diff += 0.2;
        if (fpA.pathSignature !== fpB.pathSignature) diff += 0.1;

        return Math.min(1.0, diff);
    }
}
