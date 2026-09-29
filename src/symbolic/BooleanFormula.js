/**
 * BooleanFormula — Canonical representation of propositional formulas (AND, OR, NOT, ATOM, TRUE, FALSE).
 */

export const FORMULA_KINDS = Object.freeze({
    TRUE: 'TRUE',
    FALSE: 'FALSE',
    ATOM: 'ATOM',
    NOT: 'NOT',
    AND: 'AND',
    OR: 'OR',
});

export class BooleanFormula {
    /**
     * @param {object} params
     * @param {string} params.kind - FORMULA_KINDS member
     * @param {any} [params.payload]
     * @param {Array<BooleanFormula>} [params.operands]
     */
    constructor({
        kind = FORMULA_KINDS.TRUE,
        payload = null,
        operands = [],
    } = {}) {
        this.kind = kind;
        this.payload = payload;
        this.operands = Object.freeze([...operands]);
        Object.freeze(this);
    }

    static true() { return new BooleanFormula({ kind: FORMULA_KINDS.TRUE }); }
    static false() { return new BooleanFormula({ kind: FORMULA_KINDS.FALSE }); }
    static atom(cst) { return new BooleanFormula({ kind: FORMULA_KINDS.ATOM, payload: cst }); }

    static not(formula) {
        if (formula.kind === FORMULA_KINDS.TRUE) return BooleanFormula.false();
        if (formula.kind === FORMULA_KINDS.FALSE) return BooleanFormula.true();
        if (formula.kind === FORMULA_KINDS.NOT && formula.operands.length === 1) return formula.operands[0];
        return new BooleanFormula({ kind: FORMULA_KINDS.NOT, operands: [formula] });
    }

    static and(left, right) {
        if (left.kind === FORMULA_KINDS.FALSE || right.kind === FORMULA_KINDS.FALSE) return BooleanFormula.false();
        if (left.kind === FORMULA_KINDS.TRUE) return right;
        if (right.kind === FORMULA_KINDS.TRUE) return left;
        return new BooleanFormula({ kind: FORMULA_KINDS.AND, operands: [left, right] });
    }

    static or(left, right) {
        if (left.kind === FORMULA_KINDS.TRUE || right.kind === FORMULA_KINDS.TRUE) return BooleanFormula.true();
        if (left.kind === FORMULA_KINDS.FALSE) return right;
        if (right.kind === FORMULA_KINDS.FALSE) return left;
        return new BooleanFormula({ kind: FORMULA_KINDS.OR, operands: [left, right] });
    }

    isTrue() { return this.kind === FORMULA_KINDS.TRUE; }
    isFalse() { return this.kind === FORMULA_KINDS.FALSE; }

    toJSON() {
        return {
            kind: this.kind,
            payload: this.payload,
            operands: this.operands.map(o => o.toJSON()),
        };
    }
}
