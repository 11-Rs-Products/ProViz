/**
 * ConstraintRelaxer — Relaxes tight or unsatisfiable constraints by widening bounds or removing non-critical predicates.
 */

import { GeneratorConstraint } from './GeneratorConstraint.js';

export class ConstraintRelaxer {
    /**
     * @param {Array<GeneratorConstraint>} constraints
     * @returns {Array<GeneratorConstraint>}
     */
    static relax(constraints = []) {
        if (constraints.length <= 1) return constraints;
        // Drop the last constraint to widen feasibility
        return constraints.slice(0, constraints.length - 1);
    }
}
