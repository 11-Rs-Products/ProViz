/**
 * TestCaseStatus — Execution and validation statuses for a TestCase.
 */

export const TEST_CASE_STATUSES = Object.freeze({
    GENERATED: 'GENERATED',
    EXECUTABLE: 'EXECUTABLE',
    EXECUTED: 'EXECUTED',
    VALIDATED: 'VALIDATED',
    FAILED: 'FAILED',
    MISMATCHED: 'MISMATCHED',
    INCONCLUSIVE: 'INCONCLUSIVE',
    UNCONSTRUCTABLE: 'UNCONSTRUCTABLE',
});
