/**
 * FindingTestGenerator — Generates concrete TestCases targeting verification findings.
 */

import { TestCase } from './TestCase.js';
import { TestInput } from './TestInput.js';
import { TestExpectation } from './TestExpectation.js';
import { TEST_TARGET_KINDS } from './TestTargetKind.js';
import { TEST_CASE_STATUSES } from './TestCaseStatus.js';
import { ConstraintConcretizer } from './ConstraintConcretizer.js';
import { ASSIGNMENT_STATUSES } from './ConstraintAssignment.js';

export class FindingTestGenerator {
    /**
     * Generate a TestCase targeting a verification finding.
     * @param {object} finding - Stage 15 finding or Stage 16 refined finding
     * @param {object} [context]
     * @param {import('../symbolic/SymbolicPathGraph.js').SymbolicPathGraph} [context.pathGraph]
     * @param {number} [context.workspaceVersion=1]
     * @returns {TestCase|null}
     */
    static generateForFinding(finding, { pathGraph = null, workspaceVersion = 1 } = {}) {
        if (!finding) return null;

        let assignment = null;
        let expectedException = null;

        // 1. If finding has an attached counterexample from Stage 16
        if (finding.counterexample) {
            assignment = ConstraintConcretizer.concretizeCounterexample(finding.counterexample);
        }

        // 2. Infer expected exception type from finding type
        const fType = String(finding.type || finding.kind || '');
        if (fType.includes('DIVISION_BY_ZERO') || fType.includes('ZERO_DIVISION')) {
            expectedException = 'ZeroDivisionError';
            if (!assignment || assignment.status !== ASSIGNMENT_STATUSES.SATISFIED) {
                // Synthesize divisor == 0 assignment if variable is known
                const varMatch = (finding.message || '').match(/variable '(\w+)'/) || (finding.expression || '').match(/(\w+)$/);
                const divisorVar = varMatch ? varMatch[1] : 'b';
                assignment = ConstraintConcretizer.concretize([{ left: { name: divisorVar }, relation: '==', right: { value: 0 } }]);
            }
        } else if (fType.includes('NONE_ACCESS') || fType.includes('NULL_POINTER')) {
            expectedException = 'TypeError';
            if (!assignment || assignment.status !== ASSIGNMENT_STATUSES.SATISFIED) {
                const varMatch = (finding.message || '').match(/variable '(\w+)'/) || (finding.expression || '').match(/^(\w+)/);
                const targetVar = varMatch ? varMatch[1] : 'x';
                assignment = ConstraintConcretizer.concretize([{ left: { name: targetVar }, relation: 'is', right: { value: null } }]);
            }
        } else if (fType.includes('INDEX_OUT_OF_BOUNDS') || fType.includes('INDEX_ERROR')) {
            expectedException = 'IndexError';
        } else if (fType.includes('TYPE_MISMATCH')) {
            expectedException = 'TypeError';
        }

        if (!assignment || assignment.status === ASSIGNMENT_STATUSES.UNSAT) {
            return new TestCase({
                workspaceVersion,
                targetKind: TEST_TARGET_KINDS.FINDING,
                targetId: finding.id,
                findingId: finding.id,
                status: TEST_CASE_STATUSES.UNCONSTRUCTABLE,
            });
        }

        const input = new TestInput({
            bindings: assignment.bindings,
        });

        const expected = new TestExpectation({
            expectedFinding: finding.id,
            expectedException,
        });

        return new TestCase({
            workspaceVersion,
            targetKind: TEST_TARGET_KINDS.FINDING,
            targetId: finding.id,
            inputs: input,
            expected,
            findingId: finding.id,
            counterexampleId: finding.counterexample?.id || null,
            status: TEST_CASE_STATUSES.EXECUTABLE,
        });
    }

    /**
     * Generate TestCases for a collection of findings.
     * @param {Array<object>} findings
     * @param {object} [context]
     * @returns {Array<TestCase>}
     */
    static generateForFindings(findings = [], context = {}) {
        const tests = [];
        for (const f of findings) {
            const tc = this.generateForFinding(f, context);
            if (tc) tests.push(tc);
        }
        return tests;
    }
}
