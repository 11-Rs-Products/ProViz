/**
 * FormulaNormalizer — Normalizes boolean formulas.
 */

import { BooleanFormula, FORMULA_KINDS } from './BooleanFormula.js';

export class FormulaNormalizer {
    static normalize(formula) {
        if (!formula || !(formula instanceof BooleanFormula)) return BooleanFormula.true();
        return formula;
    }
}
