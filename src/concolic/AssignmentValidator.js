/**
 * AssignmentValidator — Validates that concrete assignments satisfy path constraints and type restrictions.
 */

import { AssignmentValidator as BaseValidator } from '../testing/AssignmentValidator.js';

export class AssignmentValidator {
    /**
     * Validate bindings against candidate constraints.
     * @param {Map<string, *>|object} bindings
     * @param {Array<import('./PathConstraint.js').PathConstraint>} pathConstraints
     * @param {import('../symbolic/Constraint.js').Constraint|null} negatedConstraint
     * @returns {object} - { isValid: boolean, violatedConstraints: Array }
     */
    static validate(bindings, pathConstraints = [], negatedConstraint = null) {
        const cstList = pathConstraints.map(pc => pc.normalizedConstraint).filter(Boolean);
        if (negatedConstraint) cstList.push(negatedConstraint);

        return BaseValidator.validate(bindings, cstList);
    }
}
