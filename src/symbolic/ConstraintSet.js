/**
 * ConstraintSet — Deterministic, sorted collection of symbolic constraints with satisfiability checking.
 */

import { Constraint } from './Constraint.js';
import { ConstraintNormalizer } from './ConstraintNormalizer.js';
import { ConstraintSimplifier } from './ConstraintSimplifier.js';
import { CONSTRAINT_RELATIONS } from './ConstraintRelation.js';

export class ConstraintSet {
    /**
     * @param {Array<Constraint>} [constraints=[]]
     */
    constructor(constraints = []) {
        this._map = new Map(); // id -> Constraint
        if (Array.isArray(constraints)) {
            for (const c of constraints) {
                this.add(c);
            }
        }
    }

    add(constraint) {
        if (!constraint) return this;
        const c = constraint instanceof Constraint ? constraint : Constraint.fromJSON(constraint);
        const norm = ConstraintNormalizer.normalize(c);
        this._map.set(norm.id, norm);
        return this;
    }

    remove(constraintId) {
        const id = typeof constraintId === 'string' ? constraintId : constraintId.id;
        this._map.delete(id);
        return this;
    }

    has(constraint) {
        if (!constraint) return false;
        const id = typeof constraint === 'string' ? constraint : constraint.id;
        return this._map.has(id);
    }

    getAll() {
        return Array.from(this._map.values()).sort((a, b) => a.id.localeCompare(b.id));
    }

    size() {
        return this._map.size;
    }

    union(other) {
        const res = new ConstraintSet(this.getAll());
        if (other && other instanceof ConstraintSet) {
            for (const c of other.getAll()) res.add(c);
        }
        return res;
    }

    intersection(other) {
        const res = new ConstraintSet();
        if (other && other instanceof ConstraintSet) {
            for (const c of this.getAll()) {
                if (other.has(c)) res.add(c);
            }
        }
        return res;
    }

    /**
     * Check if constraint set contains a direct contradiction.
     * @returns {boolean}
     */
    isContradictory() {
        const bounds = new Map(); // subject -> { min, max, exact, isNone, notNone }

        for (const c of this.getAll()) {
            const subj = c.left.toString();
            const rVal = c.right && c.right.isConstant() ? c.right.payload.value : null;

            if (!bounds.has(subj)) {
                bounds.set(subj, { min: -Infinity, max: Infinity, exact: null, isNone: false, notNone: false });
            }
            const b = bounds.get(subj);

            // Nullability contradiction: is None && is not None
            if (c.relation === CONSTRAINT_RELATIONS.IS && c.right?.isConstant() && c.right.payload.value === null) {
                b.isNone = true;
            }
            if (c.relation === CONSTRAINT_RELATIONS.IS_NOT && c.right?.isConstant() && c.right.payload.value === null) {
                b.notNone = true;
            }
            if (b.isNone && b.notNone) return true;

            // Numeric interval contradiction
            if (typeof rVal === 'number') {
                if (c.relation === CONSTRAINT_RELATIONS.EQ) {
                    if (b.exact !== null && b.exact !== rVal) return true;
                    b.exact = rVal;
                    if (b.exact < b.min || b.exact > b.max) return true;
                } else if (c.relation === CONSTRAINT_RELATIONS.GT) {
                    b.min = Math.max(b.min, rVal + 1);
                } else if (c.relation === CONSTRAINT_RELATIONS.GE) {
                    b.min = Math.max(b.min, rVal);
                } else if (c.relation === CONSTRAINT_RELATIONS.LT) {
                    b.max = Math.min(b.max, rVal - 1);
                } else if (c.relation === CONSTRAINT_RELATIONS.LE) {
                    b.max = Math.min(b.max, rVal);
                }

                if (b.min > b.max) return true;
                if (b.exact !== null && (b.exact < b.min || b.exact > b.max)) return true;
            }
        }

        return false;
    }

    isSatisfiable() {
        return !this.isContradictory();
    }

    simplify() {
        const simplified = ConstraintSimplifier.simplify(this.getAll());
        return new ConstraintSet(simplified);
    }

    toJSON() {
        return this.getAll().map(c => c.toJSON());
    }

    static fromJSON(json) {
        if (!Array.isArray(json)) return new ConstraintSet();
        return new ConstraintSet(json.map(c => Constraint.fromJSON(c)));
    }
}
