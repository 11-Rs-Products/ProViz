/**
 * ConstraintShrinker — Shrinks input candidates while preserving satisfaction of explicit constraints.
 */

import { Shrinker } from './Shrinker.js';

export class ConstraintShrinker {
    /**
     * @param {any} input
     * @param {Function} failurePredicate
     * @param {Array<GeneratorConstraint>} constraints
     * @returns {ShrinkResult}
     */
    static shrink(input, failurePredicate, constraints = []) {
        const constrainedPredicate = (val) => {
            const satisfiesConstraints = constraints.every(c => c.satisfies(val));
            return satisfiesConstraints && failurePredicate(val);
        };

        return Shrinker.shrink(input, constrainedPredicate);
    }
}
