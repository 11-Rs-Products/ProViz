/**
 * ConstraintSolver — High-level constraint solver orchestrator.
 */

import { LinearConstraintSolver } from './LinearConstraintSolver.js';
import { ConstraintSet } from './ConstraintSet.js';

export class ConstraintSolver {
    constructor() {
        this.linearSolver = new LinearConstraintSolver();
    }

    /**
     * Check if a ConstraintSet or constraint array is satisfiable.
     * @param {ConstraintSet|Array} constraints
     * @returns {import('./ConstraintResult.js').ConstraintResult}
     */
    checkSat(constraints) {
        const list = constraints instanceof ConstraintSet ? constraints.getAll() : (Array.isArray(constraints) ? constraints : []);
        return this.linearSolver.solve(list);
    }

    /**
     * Check if constraints imply a target constraint.
     * @param {ConstraintSet|Array} constraints
     * @param {import('./Constraint.js').Constraint} target
     * @returns {boolean}
     */
    implies(constraints, target) {
        if (!target) return false;
        // Implication test: constraints AND NOT(target) is UNSAT
        const negated = target.negate();
        const baseSet = constraints instanceof ConstraintSet ? constraints : new ConstraintSet(constraints);
        const testSet = baseSet.union(new ConstraintSet([negated]));
        const res = this.checkSat(testSet);
        return res.isUnsat();
    }
}
