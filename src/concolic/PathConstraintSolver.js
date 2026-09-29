/**
 * PathConstraintSolver — Solves path constraints and negated branch conditions.
 */

import { LinearConstraintSolver } from '../symbolic/LinearConstraintSolver.js';
import { ConstraintSet } from '../symbolic/ConstraintSet.js';

export class PathConstraintSolver {
    /**
     * Solve a SymbolicPathCandidate.
     * @param {import('./SymbolicPathCandidate.js').SymbolicPathCandidate} candidate
     * @returns {object} - { status: 'SAT' | 'UNSAT' | 'UNKNOWN', model: object, conflicts: Array }
     */
    static solveCandidate(candidate) {
        if (!candidate || !candidate.negatedPredicate) {
            return { status: 'UNKNOWN', model: null, conflicts: [] };
        }

        const cstList = candidate.retainedConstraints.map(rc => rc.normalizedConstraint).filter(Boolean);
        cstList.push(candidate.negatedPredicate);

        const solver = new LinearConstraintSolver();
        const res = solver.solve(cstList);

        return {
            status: res.status,
            model: res.model || null,
            conflicts: res.conflicts || [],
        };
    }
}
