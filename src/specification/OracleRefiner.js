/**
 * OracleRefiner — Refines oracles when specifications or behavioral assumptions evolve.
 */

import { Oracle } from './Oracle.js';
import { OracleConfidence } from './OracleConfidence.js';

export class OracleRefiner {
    /**
     * Refines an oracle with updated evidence.
     * @param {Oracle} oracle
     * @param {Array<string>} newEvidence
     * @returns {Oracle}
     */
    static refine(oracle, newEvidence = []) {
        if (!oracle) return null;
        return new Oracle({
            ...oracle,
            evidence: [...oracle.evidence, ...newEvidence],
        });
    }

    /**
     * Weakens an exact oracle to a relational or property oracle.
     * @param {Oracle} oracle
     * @param {string} newKind
     * @returns {Oracle}
     */
    static weakenToProperty(oracle, newKind = 'PROPERTY') {
        return new Oracle({
            ...oracle,
            kind: newKind,
            confidence: OracleConfidence.PROPERTY,
            evidence: [...oracle.evidence, 'Weakened from exact value to general property'],
        });
    }
}
