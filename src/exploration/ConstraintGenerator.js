/**
 * ConstraintGenerator — Helper creating constraint-aware generators from symbolic or specification expressions.
 */

import { ConstraintAwareGenerator } from './ConstraintAwareGenerator.js';
import { GeneratorConstraint } from './GeneratorConstraint.js';
import { IntegerGenerator } from './IntegerGenerator.js';

export class ConstraintGenerator {
    /**
     * @param {string} variable
     * @param {string} operator
     * @param {any} targetValue
     * @param {Generator} [baseGenerator]
     * @returns {ConstraintAwareGenerator}
     */
    static forConstraint(variable, operator, targetValue, baseGenerator = null) {
        const constraint = new GeneratorConstraint({
            variable,
            operator,
            targetValue,
        });
        const gen = baseGenerator || new IntegerGenerator({ min: -50, max: 50 });
        return new ConstraintAwareGenerator({
            generator: gen,
            constraints: [constraint],
        });
    }
}
