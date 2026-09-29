/**
 * PathPredicate — Represents an individual branch decision along a symbolic execution path.
 */

import { Constraint } from './Constraint.js';

export class PathPredicate {
    /**
     * @param {object} params
     * @param {Constraint} params.constraint
     * @param {boolean} [params.isTaken=true]
     * @param {string|null} [params.cfgNodeId]
     * @param {string} [params.raw]
     */
    constructor({ constraint, isTaken = true, cfgNodeId = null, raw = '' }) {
        this.constraint = constraint instanceof Constraint ? constraint : Constraint.fromJSON(constraint);
        this.isTaken = Boolean(isTaken);
        this.cfgNodeId = cfgNodeId;
        this.raw = raw || (this.isTaken ? this.constraint.toString() : this.constraint.negate().toString());
        Object.freeze(this);
    }

    effectiveConstraint() {
        return this.isTaken ? this.constraint : this.constraint.negate();
    }

    toString() {
        return this.raw;
    }

    toJSON() {
        return {
            constraint: this.constraint.toJSON(),
            isTaken: this.isTaken,
            cfgNodeId: this.cfgNodeId,
            raw: this.raw,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new PathPredicate({
            ...json,
            constraint: Constraint.fromJSON(json.constraint),
        });
    }
}
