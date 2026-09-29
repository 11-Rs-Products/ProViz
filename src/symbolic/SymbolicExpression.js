/**
 * SymbolicExpression — Canonical structural representation of symbolic expressions with built-in simplification.
 */

import { EXPRESSION_KINDS } from './ExpressionKind.js';
import { SymbolicConstant } from './SymbolicConstant.js';
import { Symbol } from './Symbol.js';

export class SymbolicExpression {
    /**
     * @param {object} params
     * @param {string} params.kind - EXPRESSION_KINDS member
     * @param {Symbol|SymbolicConstant|string|null} [params.payload]
     * @param {Array<SymbolicExpression>} [params.operands]
     * @param {object} [params.metadata]
     */
    constructor({
        kind,
        payload = null,
        operands = [],
        metadata = {},
    }) {
        this.kind = kind || EXPRESSION_KINDS.UNKNOWN;
        this.payload = payload;
        this.operands = Object.freeze([...operands]);
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    static constant(val) {
        let sc;
        if (val instanceof SymbolicConstant) sc = val;
        else if (typeof val === 'number') sc = Number.isInteger(val) ? SymbolicConstant.int(val) : SymbolicConstant.float(val);
        else if (typeof val === 'boolean') sc = SymbolicConstant.bool(val);
        else if (typeof val === 'string') sc = SymbolicConstant.string(val);
        else if (val === null) sc = SymbolicConstant.none();
        else sc = new SymbolicConstant({ type: 'raw', value: val });
        return new SymbolicExpression({ kind: EXPRESSION_KINDS.CONSTANT, payload: sc });
    }

    static symbol(sym) {
        const s = sym instanceof Symbol ? sym : new Symbol({ name: String(sym) });
        return new SymbolicExpression({ kind: EXPRESSION_KINDS.SYMBOL, payload: s });
    }

    static add(left, right) {
        const l = left instanceof SymbolicExpression ? left : SymbolicExpression.constant(left);
        const r = right instanceof SymbolicExpression ? right : SymbolicExpression.constant(right);

        // Simplification: x + 0 = x, 0 + x = x
        if (l.isConstant() && l.payload.isZero()) return r;
        if (r.isConstant() && r.payload.isZero()) return l;
        // Constant folding
        if (l.isConstant() && r.isConstant() && typeof l.payload.value === 'number' && typeof r.payload.value === 'number') {
            return SymbolicExpression.constant(l.payload.value + r.payload.value);
        }

        return new SymbolicExpression({ kind: EXPRESSION_KINDS.ADD, operands: [l, r] });
    }

    static sub(left, right) {
        const l = left instanceof SymbolicExpression ? left : SymbolicExpression.constant(left);
        const r = right instanceof SymbolicExpression ? right : SymbolicExpression.constant(right);

        // Simplification: x - 0 = x, x - x = 0
        if (r.isConstant() && r.payload.isZero()) return l;
        if (l.equals(r)) return SymbolicExpression.constant(0);
        // Constant folding
        if (l.isConstant() && r.isConstant() && typeof l.payload.value === 'number' && typeof r.payload.value === 'number') {
            return SymbolicExpression.constant(l.payload.value - r.payload.value);
        }

        return new SymbolicExpression({ kind: EXPRESSION_KINDS.SUBTRACT, operands: [l, r] });
    }

    static mul(left, right) {
        const l = left instanceof SymbolicExpression ? left : SymbolicExpression.constant(left);
        const r = right instanceof SymbolicExpression ? right : SymbolicExpression.constant(right);

        // Simplification: x * 0 = 0, x * 1 = x, 1 * x = x
        if (l.isConstant() && l.payload.isZero()) return SymbolicExpression.constant(0);
        if (r.isConstant() && r.payload.isZero()) return SymbolicExpression.constant(0);
        if (l.isConstant() && l.payload.isOne()) return r;
        if (r.isConstant() && r.payload.isOne()) return l;
        // Constant folding
        if (l.isConstant() && r.isConstant() && typeof l.payload.value === 'number' && typeof r.payload.value === 'number') {
            return SymbolicExpression.constant(l.payload.value * r.payload.value);
        }

        return new SymbolicExpression({ kind: EXPRESSION_KINDS.MULTIPLY, operands: [l, r] });
    }

    static div(left, right) {
        const l = left instanceof SymbolicExpression ? left : SymbolicExpression.constant(left);
        const r = right instanceof SymbolicExpression ? right : SymbolicExpression.constant(right);

        // Simplification: x / 1 = x
        if (r.isConstant() && r.payload.isOne()) return l;
        // Constant folding
        if (l.isConstant() && r.isConstant() && typeof l.payload.value === 'number' && typeof r.payload.value === 'number' && r.payload.value !== 0) {
            return SymbolicExpression.constant(l.payload.value / r.payload.value);
        }

        return new SymbolicExpression({ kind: EXPRESSION_KINDS.DIVIDE, operands: [l, r] });
    }

    static ite(condition, thenExpr, elseExpr) {
        const cond = condition instanceof SymbolicExpression ? condition : SymbolicExpression.constant(condition);
        const t = thenExpr instanceof SymbolicExpression ? thenExpr : SymbolicExpression.constant(thenExpr);
        const e = elseExpr instanceof SymbolicExpression ? elseExpr : SymbolicExpression.constant(elseExpr);

        if (cond.isConstant()) {
            return cond.payload.value ? t : e;
        }
        if (t.equals(e)) return t;

        return new SymbolicExpression({ kind: EXPRESSION_KINDS.ITE, operands: [cond, t, e] });
    }

    static not(expr) {
        const e = expr instanceof SymbolicExpression ? expr : SymbolicExpression.constant(expr);
        if (e.kind === EXPRESSION_KINDS.NOT && e.operands.length === 1) {
            return e.operands[0]; // not(not(x)) = x
        }
        if (e.isConstant() && typeof e.payload.value === 'boolean') {
            return SymbolicExpression.constant(!e.payload.value);
        }
        return new SymbolicExpression({ kind: EXPRESSION_KINDS.NOT, operands: [e] });
    }

    static func(name, args = []) {
        return new SymbolicExpression({
            kind: EXPRESSION_KINDS.FUNCTION,
            payload: String(name),
            operands: args.map(a => (a instanceof SymbolicExpression ? a : SymbolicExpression.constant(a))),
        });
    }

    isConstant() {
        return this.kind === EXPRESSION_KINDS.CONSTANT && this.payload instanceof SymbolicConstant;
    }

    isSymbol() {
        return this.kind === EXPRESSION_KINDS.SYMBOL && this.payload instanceof Symbol;
    }

    equals(other) {
        if (!other || !(other instanceof SymbolicExpression)) return false;
        if (this.kind !== other.kind) return false;
        if (this.isConstant() && other.isConstant()) return this.payload.equals(other.payload);
        if (this.isSymbol() && other.isSymbol()) return this.payload.equals(other.payload);
        if (this.payload !== other.payload) return false;
        if (this.operands.length !== other.operands.length) return false;
        for (let i = 0; i < this.operands.length; i++) {
            if (!this.operands[i].equals(other.operands[i])) return false;
        }
        return true;
    }

    toString() {
        if (this.isConstant()) return this.payload.toString();
        if (this.isSymbol()) return this.payload.toString();
        if (this.kind === EXPRESSION_KINDS.ADD) return `(${this.operands[0]} + ${this.operands[1]})`;
        if (this.kind === EXPRESSION_KINDS.SUBTRACT) return `(${this.operands[0]} - ${this.operands[1]})`;
        if (this.kind === EXPRESSION_KINDS.MULTIPLY) return `(${this.operands[0]} * ${this.operands[1]})`;
        if (this.kind === EXPRESSION_KINDS.DIVIDE) return `(${this.operands[0]} / ${this.operands[1]})`;
        if (this.kind === EXPRESSION_KINDS.NOT) return `not(${this.operands[0]})`;
        if (this.kind === EXPRESSION_KINDS.ITE) return `(if ${this.operands[0]} then ${this.operands[1]} else ${this.operands[2]})`;
        if (this.kind === EXPRESSION_KINDS.FUNCTION) return `${this.payload}(${this.operands.join(', ')})`;
        return `<expr_${this.kind}>`;
    }

    toJSON() {
        return {
            kind: this.kind,
            payload: this.payload && typeof this.payload.toJSON === 'function' ? this.payload.toJSON() : this.payload,
            operands: this.operands.map(o => o.toJSON()),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return new SymbolicExpression({ kind: EXPRESSION_KINDS.UNKNOWN });
        let payload = json.payload;
        if (json.kind === EXPRESSION_KINDS.CONSTANT && json.payload) {
            payload = SymbolicConstant.fromJSON(json.payload);
        } else if (json.kind === EXPRESSION_KINDS.SYMBOL && json.payload) {
            payload = Symbol.fromJSON(json.payload);
        }
        return new SymbolicExpression({
            kind: json.kind,
            payload,
            operands: (json.operands || []).map(o => SymbolicExpression.fromJSON(o)),
            metadata: json.metadata || {},
        });
    }
}
