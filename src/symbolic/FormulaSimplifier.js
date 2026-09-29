/**
 * FormulaSimplifier — Simplifies boolean formulas using propositional logic rules.
 */

import { BooleanFormula, FORMULA_KINDS } from './BooleanFormula.js';

export class FormulaSimplifier {
    static simplify(formula) {
        if (!formula || !(formula instanceof BooleanFormula)) return BooleanFormula.true();
        if (formula.kind === FORMULA_KINDS.NOT && formula.operands.length === 1) {
            const inner = this.simplify(formula.operands[0]);
            return BooleanFormula.not(inner);
        }
        if (formula.kind === FORMULA_KINDS.AND && formula.operands.length === 2) {
            const l = this.simplify(formula.operands[0]);
            const r = this.simplify(formula.operands[1]);
            return BooleanFormula.and(l, r);
        }
        if (formula.kind === FORMULA_KINDS.OR && formula.operands.length === 2) {
            const l = this.simplify(formula.operands[0]);
            const r = this.simplify(formula.operands[1]);
            return BooleanFormula.or(l, r);
        }
        return formula;
    }
}
