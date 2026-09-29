/**
 * CounterexampleGenerator — Generates concrete TestCases directly from symbolic counterexamples.
 */

import { TestCase } from './TestCase.js';
import { TestInput } from './TestInput.js';
import { TestExpectation } from './TestExpectation.js';
import { TEST_TARGET_KINDS } from './TestTargetKind.js';
import { TEST_CASE_STATUSES } from './TestCaseStatus.js';
import { ConstraintConcretizer } from './ConstraintConcretizer.js';
import { ASSIGNMENT_STATUSES } from './ConstraintAssignment.js';

export class CounterexampleGenerator {
    /**
     * Generate a TestCase from a symbolic Counterexample.
     * @param {import('../symbolic/Counterexample.js').Counterexample} counterexample
     * @param {object} [options]
     * @returns {TestCase|null}
     */
    static generate(counterexample, { workspaceVersion = 1 } = {}) {
        if (!counterexample) return null;

        const assignment = ConstraintConcretizer.concretizeCounterexample(counterexample);
        if (assignment.status === ASSIGNMENT_STATUSES.UNSAT || assignment.status === ASSIGNMENT_STATUSES.UNCONSTRUCTABLE) {
            return new TestCase({
                workspaceVersion,
                targetKind: TEST_TARGET_KINDS.COUNTEREXAMPLE,
                targetId: counterexample.id,
                counterexampleId: counterexample.id,
                findingId: counterexample.findingId,
                status: TEST_CASE_STATUSES.UNCONSTRUCTABLE,
            });
        }

        const input = new TestInput({
            bindings: assignment.bindings,
        });

        const rawAssignments = counterexample.assignments || counterexample.variableAssignments || {};
        const expected = new TestExpectation({
            expectedProperty: counterexample.propertyId,
            expectedFinding: counterexample.findingId,
            expectedConstraints: Object.entries(rawAssignments).map(([k, v]) => `${k} == ${v}`),
        });

        return new TestCase({
            workspaceVersion,
            targetKind: TEST_TARGET_KINDS.COUNTEREXAMPLE,
            targetId: counterexample.id,
            inputs: input,
            expected,
            counterexampleId: counterexample.id,
            findingId: counterexample.findingId,
            status: TEST_CASE_STATUSES.EXECUTABLE,
        });
    }
}
