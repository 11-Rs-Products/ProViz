/**
 * LinearConstraintSolver — Deterministic bound-tightening and equality solver for linear integer constraints.
 */

import { ConstraintResult } from './ConstraintResult.js';
import { CONSTRAINT_RELATIONS } from './ConstraintRelation.js';

export class LinearConstraintSolver {
    /**
     * Solve a set of constraints and check satisfiability.
     * @param {Array<import('./Constraint.js').Constraint>} constraints
     * @returns {ConstraintResult}
     */
    solve(constraints = []) {
        const bounds = new Map(); // varName -> { min, max, exact, isNone, notNone, nonZero }

        for (const c of constraints) {
            const subj = c.left.toString();
            const rVal = c.right && c.right.isConstant() ? c.right.payload.value : null;

            if (!bounds.has(subj)) {
                bounds.set(subj, { min: -Infinity, max: Infinity, exact: null, isNone: false, notNone: false, nonZero: false });
            }
            const b = bounds.get(subj);

            // Nullability checks
            if (c.relation === CONSTRAINT_RELATIONS.IS && c.right?.isConstant() && c.right.payload.value === null) {
                b.isNone = true;
            }
            if (c.relation === CONSTRAINT_RELATIONS.IS_NOT && c.right?.isConstant() && c.right.payload.value === null) {
                b.notNone = true;
            }
            if (b.isNone && b.notNone) {
                return ConstraintResult.unsat([c], `Nullability contradiction for ${subj}`);
            }

            // Numeric interval constraints
            if (typeof rVal === 'number') {
                if (c.relation === CONSTRAINT_RELATIONS.EQ) {
                    if (b.exact !== null && b.exact !== rVal) {
                        return ConstraintResult.unsat([c], `Equality contradiction: ${subj} == ${b.exact} and ${subj} == ${rVal}`);
                    }
                    b.exact = rVal;
                    if (b.exact < b.min || b.exact > b.max) {
                        return ConstraintResult.unsat([c], `Equality ${subj} == ${rVal} violates interval [${b.min}, ${b.max}]`);
                    }
                } else if (c.relation === CONSTRAINT_RELATIONS.NE) {
                    if (rVal === 0) b.nonZero = true;
                    if (b.exact === rVal) {
                        return ConstraintResult.unsat([c], `Disequality contradiction: ${subj} == ${rVal} and ${subj} != ${rVal}`);
                    }
                } else if (c.relation === CONSTRAINT_RELATIONS.GT) {
                    b.min = Math.max(b.min, rVal + 1);
                } else if (c.relation === CONSTRAINT_RELATIONS.GE) {
                    b.min = Math.max(b.min, rVal);
                } else if (c.relation === CONSTRAINT_RELATIONS.LT) {
                    b.max = Math.min(b.max, rVal - 1);
                } else if (c.relation === CONSTRAINT_RELATIONS.LE) {
                    b.max = Math.min(b.max, rVal);
                }

                if (b.min > b.max) {
                    return ConstraintResult.unsat([c], `Interval contradiction for ${subj}: lower bound ${b.min} > upper bound ${b.max}`);
                }
                if (b.exact !== null && (b.exact < b.min || b.exact > b.max)) {
                    return ConstraintResult.unsat([c], `Exact value ${b.exact} for ${subj} outside [${b.min}, ${b.max}]`);
                }
            }
        }

        // Build satisfying assignment model
        const model = {};
        for (const [vName, b] of bounds.entries()) {
            if (b.exact !== null) {
                model[vName] = b.exact;
            } else if (b.min !== -Infinity) {
                model[vName] = b.nonZero && b.min === 0 ? 1 : b.min;
            } else if (b.max !== Infinity) {
                model[vName] = b.nonZero && b.max === 0 ? -1 : b.max;
            } else {
                model[vName] = b.nonZero ? 1 : 0;
            }
        }

        return ConstraintResult.sat(model);
    }
}
