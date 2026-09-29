/**
 * PathConditionBuilder — Constructs symbolic constraints and path predicates from CFG condition nodes.
 */

import { Constraint } from './Constraint.js';
import { PathPredicate } from './PathPredicate.js';
import { SymbolicExpression } from './SymbolicExpression.js';
import { CONSTRAINT_RELATIONS } from './ConstraintRelation.js';

export class PathConditionBuilder {
    /**
     * Builds a PathPredicate from a CFG condition node.
     * @param {object} node - CFG condition node
     * @param {boolean} [isTrueBranch=true]
     * @returns {PathPredicate|null}
     */
    static buildPredicate(node, isTrueBranch = true) {
        if (!node) return null;
        const exprStr = String(node.metadata?.condition || node.condition || (node.label?.startsWith('if ') ? node.label.substring(3) : node.label) || '').trim();
        if (!exprStr) return null;

        // 1. None check: x is None
        const noneMatch = exprStr.match(/^([a-zA-Z_]\w*)\s+is\s+None$/);
        if (noneMatch) {
            const varName = noneMatch[1];
            const cst = Constraint.isNone(SymbolicExpression.symbol(varName), node.sourceLocations?.[0]);
            return new PathPredicate({ constraint: cst, isTaken: isTrueBranch, cfgNodeId: node.id });
        }

        // 2. Not None check: x is not None
        const notNoneMatch = exprStr.match(/^([a-zA-Z_]\w*)\s+is\s+not\s+None$/);
        if (notNoneMatch) {
            const varName = notNoneMatch[1];
            const cst = Constraint.isNotNone(SymbolicExpression.symbol(varName), node.sourceLocations?.[0]);
            return new PathPredicate({ constraint: cst, isTaken: isTrueBranch, cfgNodeId: node.id });
        }

        // 3. Comparison: x > 5, x == 0, etc.
        const cmpMatch = exprStr.match(/^([a-zA-Z_]\w*)\s*(==|!=|<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)$/);
        if (cmpMatch) {
            const varName = cmpMatch[1];
            const op = cmpMatch[2];
            const val = Number(cmpMatch[3]);
            let rel = CONSTRAINT_RELATIONS.EQ;
            if (op === '!=') rel = CONSTRAINT_RELATIONS.NE;
            else if (op === '<') rel = CONSTRAINT_RELATIONS.LT;
            else if (op === '<=') rel = CONSTRAINT_RELATIONS.LE;
            else if (op === '>') rel = CONSTRAINT_RELATIONS.GT;
            else if (op === '>=') rel = CONSTRAINT_RELATIONS.GE;

            const cst = new Constraint({
                left: SymbolicExpression.symbol(varName),
                relation: rel,
                right: SymbolicExpression.constant(val),
                sourceLocation: node.sourceLocations?.[0],
            });
            return new PathPredicate({ constraint: cst, isTaken: isTrueBranch, cfgNodeId: node.id });
        }

        // 4. Boolean variable check: if x:
        const varMatch = exprStr.match(/^([a-zA-Z_]\w*)$/);
        if (varMatch && varMatch[1] !== 'True' && varMatch[1] !== 'False') {
            const varName = varMatch[1];
            const cst = Constraint.ne(SymbolicExpression.symbol(varName), SymbolicExpression.constant(0), node.sourceLocations?.[0]);
            return new PathPredicate({ constraint: cst, isTaken: isTrueBranch, cfgNodeId: node.id });
        }

        return null;
    }
}
