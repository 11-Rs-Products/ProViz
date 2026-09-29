/**
 * Constraint — Immutable symbolic constraint relating two symbolic expressions or an expression and value.
 */

import { CONSTRAINT_KINDS } from './ConstraintKind.js';
import { CONSTRAINT_RELATIONS } from './ConstraintRelation.js';
import { SymbolicExpression } from './SymbolicExpression.js';

export class Constraint {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.kind] - CONSTRAINT_KINDS member
     * @param {SymbolicExpression|any} params.left
     * @param {string} [params.relation] - CONSTRAINT_RELATIONS member
     * @param {SymbolicExpression|any} [params.right]
     * @param {object} [params.sourceLocation]
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        kind = CONSTRAINT_KINDS.EQUALITY,
        left,
        relation = CONSTRAINT_RELATIONS.EQ,
        right = null,
        sourceLocation = null,
        metadata = {},
    }) {
        this.kind = kind;
        this.left = left instanceof SymbolicExpression ? left : SymbolicExpression.constant(left);
        this.relation = relation;
        this.right = right instanceof SymbolicExpression ? right : (right !== null ? SymbolicExpression.constant(right) : null);
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.metadata = Object.freeze({ ...metadata });

        const lStr = this.left.toString();
        const rStr = this.right ? this.right.toString() : '';
        const seed = `${this.kind}:${lStr}:${this.relation}:${rStr}`;
        this.id = id || `cst_${this.kind.toLowerCase()}_${Constraint.computeHash(seed)}`;

        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    static eq(left, right, sourceLocation = null) {
        return new Constraint({ kind: CONSTRAINT_KINDS.EQUALITY, left, relation: CONSTRAINT_RELATIONS.EQ, right, sourceLocation });
    }

    static ne(left, right, sourceLocation = null) {
        return new Constraint({ kind: CONSTRAINT_KINDS.INEQUALITY, left, relation: CONSTRAINT_RELATIONS.NE, right, sourceLocation });
    }

    static lt(left, right, sourceLocation = null) {
        return new Constraint({ kind: CONSTRAINT_KINDS.INEQUALITY, left, relation: CONSTRAINT_RELATIONS.LT, right, sourceLocation });
    }

    static le(left, right, sourceLocation = null) {
        return new Constraint({ kind: CONSTRAINT_KINDS.INEQUALITY, left, relation: CONSTRAINT_RELATIONS.LE, right, sourceLocation });
    }

    static gt(left, right, sourceLocation = null) {
        return new Constraint({ kind: CONSTRAINT_KINDS.INEQUALITY, left, relation: CONSTRAINT_RELATIONS.GT, right, sourceLocation });
    }

    static ge(left, right, sourceLocation = null) {
        return new Constraint({ kind: CONSTRAINT_KINDS.INEQUALITY, left, relation: CONSTRAINT_RELATIONS.GE, right, sourceLocation });
    }

    static isNone(expr, sourceLocation = null) {
        return new Constraint({ kind: CONSTRAINT_KINDS.NULLABILITY, left: expr, relation: CONSTRAINT_RELATIONS.IS, right: SymbolicExpression.constant(null), sourceLocation });
    }

    static isNotNone(expr, sourceLocation = null) {
        return new Constraint({ kind: CONSTRAINT_KINDS.NULLABILITY, left: expr, relation: CONSTRAINT_RELATIONS.IS_NOT, right: SymbolicExpression.constant(null), sourceLocation });
    }

    negate() {
        let nRel = this.relation;
        let nKind = this.kind;

        if (this.relation === CONSTRAINT_RELATIONS.EQ) nRel = CONSTRAINT_RELATIONS.NE;
        else if (this.relation === CONSTRAINT_RELATIONS.NE) nRel = CONSTRAINT_RELATIONS.EQ;
        else if (this.relation === CONSTRAINT_RELATIONS.LT) nRel = CONSTRAINT_RELATIONS.GE;
        else if (this.relation === CONSTRAINT_RELATIONS.LE) nRel = CONSTRAINT_RELATIONS.GT;
        else if (this.relation === CONSTRAINT_RELATIONS.GT) nRel = CONSTRAINT_RELATIONS.LE;
        else if (this.relation === CONSTRAINT_RELATIONS.GE) nRel = CONSTRAINT_RELATIONS.LT;
        else if (this.relation === CONSTRAINT_RELATIONS.IS) nRel = CONSTRAINT_RELATIONS.IS_NOT;
        else if (this.relation === CONSTRAINT_RELATIONS.IS_NOT) nRel = CONSTRAINT_RELATIONS.IS;

        return new Constraint({
            kind: nKind,
            left: this.left,
            relation: nRel,
            right: this.right,
            sourceLocation: this.sourceLocation,
        });
    }

    equals(other) {
        if (!other || !(other instanceof Constraint)) return false;
        return (
            this.kind === other.kind &&
            this.relation === other.relation &&
            this.left.equals(other.left) &&
            ((this.right === null && other.right === null) || (this.right && other.right && this.right.equals(other.right)))
        );
    }

    toString() {
        return `${this.left} ${this.relation} ${this.right !== null ? this.right : ''}`.trim();
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            left: this.left.toJSON(),
            relation: this.relation,
            right: this.right ? this.right.toJSON() : null,
            sourceLocation: this.sourceLocation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Constraint({
            id: json.id,
            kind: json.kind,
            left: SymbolicExpression.fromJSON(json.left),
            relation: json.relation,
            right: json.right ? SymbolicExpression.fromJSON(json.right) : null,
            sourceLocation: json.sourceLocation,
            metadata: json.metadata || {},
        });
    }
}
