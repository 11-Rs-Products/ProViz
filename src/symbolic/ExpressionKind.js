/**
 * ExpressionKind — Enumeration of symbolic expression node kinds.
 */

export const EXPRESSION_KINDS = Object.freeze({
    SYMBOL: 'SYMBOL',
    CONSTANT: 'CONSTANT',
    ADD: 'ADD',
    SUBTRACT: 'SUBTRACT',
    MULTIPLY: 'MULTIPLY',
    DIVIDE: 'DIVIDE',
    MODULO: 'MODULO',
    POWER: 'POWER',
    NEGATE: 'NEGATE',
    POSITIVE: 'POSITIVE',
    NOT: 'NOT',
    EQUAL: 'EQUAL',
    NOT_EQUAL: 'NOT_EQUAL',
    LESS_THAN: 'LESS_THAN',
    LESS_EQUAL: 'LESS_EQUAL',
    GREATER_THAN: 'GREATER_THAN',
    GREATER_EQUAL: 'GREATER_EQUAL',
    AND: 'AND',
    OR: 'OR',
    IS: 'IS',
    IS_NOT: 'IS_NOT',
    FUNCTION: 'FUNCTION',
    ATTRIBUTE: 'ATTRIBUTE',
    INDEX: 'INDEX',
    ITE: 'ITE',
    UNKNOWN: 'UNKNOWN',
});
