/**
 * ConstraintKind — Categorization of symbolic constraints.
 */

export const CONSTRAINT_KINDS = Object.freeze({
    EQUALITY: 'EQUALITY',
    INEQUALITY: 'INEQUALITY',
    RANGE: 'RANGE',
    TYPE: 'TYPE',
    NULLABILITY: 'NULLABILITY',
    BOOLEAN: 'BOOLEAN',
    MEMBERSHIP: 'MEMBERSHIP',
    ALIAS: 'ALIAS',
    CALL: 'CALL',
    ATTRIBUTE: 'ATTRIBUTE',
    INDEX: 'INDEX',
    CUSTOM: 'CUSTOM',
});
