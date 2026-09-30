/**
 * ConstraintSolverBridge — Bridges Stage 16 symbolic reasoning and Stage 18 concolic constraints to generator constraints.
 */

import { GeneratorConstraint } from './GeneratorConstraint.js';

export class ConstraintSolverBridge {
    /**
     * Extracts GeneratorConstraint instances from a symbolic path condition or string.
     * @param {string|object} pathCondition
     * @returns {Array<GeneratorConstraint>}
     */
    static toGeneratorConstraints(pathCondition) {
        if (!pathCondition) return [];
        const expr = typeof pathCondition === 'string' ? pathCondition : (pathCondition.predicate || pathCondition.condition || '');
        const constraints = [];

        // Match b != 0, x > 10, etc.
        const neMatch = expr.match(/([a-zA-Z0-9_]+)\s*!=\s*([0-9.-]+)/);
        if (neMatch) {
            constraints.push(new GeneratorConstraint({
                variable: neMatch[1],
                operator: '!=',
                targetValue: Number(neMatch[2]),
            }));
        }

        const gtMatch = expr.match(/([a-zA-Z0-9_]+)\s*>\s*([0-9.-]+)/);
        if (gtMatch) {
            constraints.push(new GeneratorConstraint({
                variable: gtMatch[1],
                operator: '>',
                targetValue: Number(gtMatch[2]),
            }));
        }

        return constraints;
    }
}
