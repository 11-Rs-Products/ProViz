/**
 * AdequacyCriterion — Canonical taxonomy of test adequacy criteria.
 */

export const AdequacyCriterion = Object.freeze({
    LINE: 'LINE',
    STATEMENT: 'STATEMENT',
    FUNCTION: 'FUNCTION',
    BRANCH: 'BRANCH',
    PATH: 'PATH',
    DATAFLOW: 'DATAFLOW',
    TYPEFLOW: 'TYPEFLOW',
    PROPERTY: 'PROPERTY',
    SYMBOLIC: 'SYMBOLIC',
    CONCOLIC: 'CONCOLIC',
    MUTATION: 'MUTATION',
    REGRESSION: 'REGRESSION',
    SPECIFICATION: 'SPECIFICATION',
    ORACLE: 'ORACLE',
    BEHAVIORAL: 'BEHAVIORAL',
});
