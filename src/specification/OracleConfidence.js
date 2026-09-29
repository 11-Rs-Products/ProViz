/**
 * OracleConfidence — Confidence tiers and strengths for oracles.
 */

export const OracleConfidence = Object.freeze({
    EXACT: 'EXACT',
    STRUCTURAL: 'STRUCTURAL',
    RELATIONAL: 'RELATIONAL',
    PROPERTY: 'PROPERTY',
    PARTIAL: 'PARTIAL',
    OBSERVATIONAL: 'OBSERVATIONAL',
});

export const ORACLE_CONFIDENCE_WEIGHTS = Object.freeze({
    [OracleConfidence.EXACT]: 1.0,
    [OracleConfidence.STRUCTURAL]: 0.9,
    [OracleConfidence.RELATIONAL]: 0.85,
    [OracleConfidence.PROPERTY]: 0.7,
    [OracleConfidence.PARTIAL]: 0.5,
    [OracleConfidence.OBSERVATIONAL]: 0.3,
});
