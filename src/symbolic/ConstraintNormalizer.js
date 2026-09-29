/**
 * ConstraintNormalizer — Canonicalizes constraint orientations and structures.
 */

import { Constraint } from './Constraint.js';
import { CONSTRAINT_RELATIONS } from './ConstraintRelation.js';

export class ConstraintNormalizer {
    /**
     * Normalizes a constraint (e.g. constant on right, canonical relations).
     * @param {Constraint} constraint
     * @returns {Constraint}
     */
    static normalize(constraint) {
        if (!constraint || !(constraint instanceof Constraint)) return constraint;

        const left = constraint.left;
        const right = constraint.right;
        const rel = constraint.relation;

        // If left is constant and right is symbol/expression, flip
        if (left.isConstant() && right && !right.isConstant()) {
            let flippedRel = rel;
            if (rel === CONSTRAINT_RELATIONS.LT) flippedRel = CONSTRAINT_RELATIONS.GT;
            else if (rel === CONSTRAINT_RELATIONS.LE) flippedRel = CONSTRAINT_RELATIONS.GE;
            else if (rel === CONSTRAINT_RELATIONS.GT) flippedRel = CONSTRAINT_RELATIONS.LT;
            else if (rel === CONSTRAINT_RELATIONS.GE) flippedRel = CONSTRAINT_RELATIONS.LE;

            return new Constraint({
                kind: constraint.kind,
                left: right,
                relation: flippedRel,
                right: left,
                sourceLocation: constraint.sourceLocation,
                metadata: constraint.metadata,
            });
        }

        return constraint;
    }
}
