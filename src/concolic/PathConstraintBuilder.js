/**
 * PathConstraintBuilder — Builds the sequence of symbolic path constraints from executed branch predicates.
 */

import { PathConstraint } from './PathConstraint.js';
import { PathConditionBuilder } from '../symbolic/PathConditionBuilder.js';
import { Constraint } from '../symbolic/Constraint.js';
import { SymbolicExpression } from '../symbolic/SymbolicExpression.js';

export class PathConstraintBuilder {
    /**
     * Build PathConstraint from a CFG condition node and concrete decision value.
     * @param {object} cfgNode
     * @param {boolean} taken
     * @param {number} [position=0]
     * @returns {PathConstraint|null}
     */
    static buildFromCFGNode(cfgNode, taken = true, position = 0) {
        if (!cfgNode) return null;
        const pred = PathConditionBuilder.buildPredicate(cfgNode, taken);
        if (!pred) return null;

        const effective = pred.effectiveConstraint();
        return new PathConstraint({
            position,
            branchId: `${cfgNode.id}_${taken ? 'T' : 'F'}`,
            predicate: pred.toString(),
            takenPolarity: taken,
            normalizedConstraint: effective,
            sourceLocation: cfgNode.sourceLocations?.[0] || null,
        });
    }
}
