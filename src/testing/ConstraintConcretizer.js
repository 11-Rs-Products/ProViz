/**
 * ConstraintConcretizer — Transforms symbolic constraints into concrete variable assignments.
 */

import { ConstraintAssignment, ASSIGNMENT_STATUSES } from './ConstraintAssignment.js';
import { LinearConstraintSolver } from '../symbolic/LinearConstraintSolver.js';
import { TestValueGenerator } from './TestValueGenerator.js';
import { TestValue } from './TestValue.js';

export class ConstraintConcretizer {
    /**
     * Concretize a set of symbolic constraints into concrete variable assignments.
     * @param {import('../symbolic/ConstraintSet.js').ConstraintSet|Array} constraints
     * @param {object} [options]
     * @param {string} [options.strategy='BOUNDARY']
     * @returns {ConstraintAssignment}
     */
    static concretize(constraints, { strategy = 'BOUNDARY' } = {}) {
        const solver = new LinearConstraintSolver();
        const result = solver.solve(constraints);

        if (result.status === 'UNSAT') {
            return new ConstraintAssignment({
                status: ASSIGNMENT_STATUSES.UNSAT,
                residualConstraints: result.conflicts,
            });
        }

        const bindings = new Map();
        const cstList = constraints && constraints.getConstraints ? constraints.getConstraints() : (Array.isArray(constraints) ? constraints : []);

        // 1. Process variables from linear solver intervals
        for (const [varName, val] of Object.entries(result.model || {})) {
            bindings.set(varName, TestValue.int(val));
        }

        // 2. Process non-numeric & special constraints
        for (const c of cstList) {
            const varName = c.left?.name || c.left?.symbol?.name;
            if (!varName) continue;

            if (c.relation === 'is' && c.right?.value === null) {
                bindings.set(varName, TestValue.none(c.toJSON ? c.toJSON() : null));
            } else if (c.relation === 'is not' && c.right?.value === null) {
                if (!bindings.has(varName) || bindings.get(varName).value === null) {
                    bindings.set(varName, TestValue.int(1, c.toJSON ? c.toJSON() : null));
                }
            } else if (c.relation === '==' && typeof c.right?.value === 'string') {
                bindings.set(varName, TestValue.string(c.right.value, c.toJSON ? c.toJSON() : null));
            } else if (c.relation === '==' && typeof c.right?.value === 'boolean') {
                bindings.set(varName, TestValue.bool(c.right.value, c.toJSON ? c.toJSON() : null));
            }
        }

        return new ConstraintAssignment({
            status: ASSIGNMENT_STATUSES.SATISFIED,
            bindings,
        });
    }

    /**
     * Concretize constraints along a symbolic execution path.
     * @param {import('../symbolic/SymbolicPath.js').SymbolicPath} path
     * @param {object} [options]
     * @returns {ConstraintAssignment}
     */
    static concretizePath(path, options = {}) {
        if (!path) return new ConstraintAssignment({ status: ASSIGNMENT_STATUSES.UNKNOWN });
        const constraints = path.finalState?.constraints || [];
        return this.concretize(constraints, options);
    }

    /**
     * Concretize assignments from a symbolic counterexample.
     * @param {import('../symbolic/Counterexample.js').Counterexample} counterexample
     * @param {object} [options]
     * @returns {ConstraintAssignment}
     */
    static concretizeCounterexample(counterexample, options = {}) {
        if (!counterexample) return new ConstraintAssignment({ status: ASSIGNMENT_STATUSES.UNKNOWN });
        const bindings = new Map();
        const rawAssignments = counterexample.assignments || counterexample.variableAssignments || {};

        for (const [varName, val] of Object.entries(rawAssignments)) {
            if (val === null) bindings.set(varName, TestValue.none());
            else if (typeof val === 'number') bindings.set(varName, TestValue.int(val));
            else if (typeof val === 'string') bindings.set(varName, TestValue.string(val));
            else if (typeof val === 'boolean') bindings.set(varName, TestValue.bool(val));
            else bindings.set(varName, new TestValue({ value: val }));
        }

        if (bindings.size === 0 && counterexample.path) {
            return this.concretizePath(counterexample.path, options);
        }

        return new ConstraintAssignment({
            status: ASSIGNMENT_STATUSES.SATISFIED,
            bindings,
        });
    }
}
