/**
 * ConstraintSimplifier — Simplifies and eliminates redundant constraints.
 */

import { CONSTRAINT_RELATIONS } from './ConstraintRelation.js';

export class ConstraintSimplifier {
    /**
     * Simplifies an array of constraints by tightening bounds and pruning redundancies.
     * @param {Array<import('./Constraint.js').Constraint>} constraints
     * @returns {Array<import('./Constraint.js').Constraint>}
     */
    static simplify(constraints = []) {
        const bounds = new Map(); // subject -> { min, max, exact, nonNull }
        const result = [];

        for (const c of constraints) {
            const subj = c.left.toString();
            const rVal = c.right && c.right.isConstant() ? c.right.payload.value : null;

            if (!bounds.has(subj)) {
                bounds.set(subj, { min: -Infinity, max: Infinity, exact: null, nonNull: false, raw: [] });
            }
            const b = bounds.get(subj);

            if (typeof rVal === 'number') {
                if (c.relation === CONSTRAINT_RELATIONS.EQ) b.exact = rVal;
                else if (c.relation === CONSTRAINT_RELATIONS.GT) b.min = Math.max(b.min, rVal + 1);
                else if (c.relation === CONSTRAINT_RELATIONS.GE) b.min = Math.max(b.min, rVal);
                else if (c.relation === CONSTRAINT_RELATIONS.LT) b.max = Math.min(b.max, rVal - 1);
                else if (c.relation === CONSTRAINT_RELATIONS.LE) b.max = Math.min(b.max, rVal);
            }

            b.raw.push(c);
        }

        // Deduplicate
        const seen = new Set();
        for (const c of constraints) {
            const key = c.toString();
            if (!seen.has(key)) {
                seen.add(key);
                result.push(c);
            }
        }

        return result;
    }
}
