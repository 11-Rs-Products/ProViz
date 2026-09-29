/**
 * PathTestGenerator — Generates executable TestCases targeting symbolic paths.
 */

import { TestCase } from './TestCase.js';
import { TestInput } from './TestInput.js';
import { TestExpectation } from './TestExpectation.js';
import { TEST_TARGET_KINDS } from './TestTargetKind.js';
import { TEST_CASE_STATUSES } from './TestCaseStatus.js';
import { ConstraintConcretizer } from './ConstraintConcretizer.js';
import { ASSIGNMENT_STATUSES } from './ConstraintAssignment.js';

export class PathTestGenerator {
    /**
     * Generate a TestCase targeting a specific symbolic path.
     * @param {import('../symbolic/SymbolicPath.js').SymbolicPath} path
     * @param {object} [options]
     * @returns {TestCase|null}
     */
    static generateForPath(path, { workspaceVersion = 1 } = {}) {
        if (!path || !path.isFeasible) return null;

        const assignment = ConstraintConcretizer.concretizePath(path);
        if (assignment.status === ASSIGNMENT_STATUSES.UNSAT || assignment.status === ASSIGNMENT_STATUSES.UNCONSTRUCTABLE) {
            return new TestCase({
                workspaceVersion,
                targetKind: TEST_TARGET_KINDS.PATH,
                targetId: path.id,
                symbolicPathId: path.id,
                status: TEST_CASE_STATUSES.UNCONSTRUCTABLE,
            });
        }

        const input = new TestInput({
            bindings: assignment.bindings,
        });

        const expected = new TestExpectation({
            expectedPathId: path.id,
            expectedConstraints: path.predicates.map(p => p.toString()),
        });

        return new TestCase({
            workspaceVersion,
            targetKind: TEST_TARGET_KINDS.PATH,
            targetId: path.id,
            inputs: input,
            expected,
            symbolicPathId: path.id,
            status: TEST_CASE_STATUSES.EXECUTABLE,
        });
    }

    /**
     * Generate TestCases for a collection of symbolic paths.
     * @param {Array<import('../symbolic/SymbolicPath.js').SymbolicPath>} paths
     * @param {object} [options]
     * @returns {Array<TestCase>}
     */
    static generateForPaths(paths = [], options = {}) {
        const tests = [];
        for (const p of paths) {
            const tc = this.generateForPath(p, options);
            if (tc) tests.push(tc);
        }
        return tests;
    }
}
