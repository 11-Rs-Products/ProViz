/**
 * BranchPredicate — Captures a concrete branch decision with its associated symbolic predicate.
 */

import { BRANCH_DECISIONS } from './BranchDecision.js';

export class BranchPredicate {
    /**
     * @param {object} params
     * @param {string} params.branchId
     * @param {object|null} [params.sourceLocation=null]
     * @param {string} [params.condition='']
     * @param {*} [params.concreteValue=true]
     * @param {string} [params.takenEdge='']
     * @param {string|null} [params.alternativeEdge=null]
     * @param {import('../symbolic/Constraint.js').Constraint|object|null} [params.symbolicPredicate=null]
     * @param {string|null} [params.frameId=null]
     * @param {Array<string>} [params.ssaDependencies=[]]
     */
    constructor({
        branchId,
        sourceLocation = null,
        condition = '',
        concreteValue = true,
        takenEdge = '',
        alternativeEdge = null,
        symbolicPredicate = null,
        frameId = null,
        ssaDependencies = [],
    } = {}) {
        this.branchId = String(branchId || '');
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.condition = String(condition);
        this.concreteValue = concreteValue;
        this.takenEdge = String(takenEdge);
        this.alternativeEdge = alternativeEdge ? String(alternativeEdge) : null;
        this.symbolicPredicate = symbolicPredicate;
        this.frameId = frameId;
        this.ssaDependencies = Object.freeze([...ssaDependencies]);
        Object.freeze(this);
    }

    isTaken() {
        return Boolean(this.concreteValue);
    }

    toJSON() {
        return {
            branchId: this.branchId,
            sourceLocation: this.sourceLocation,
            condition: this.condition,
            concreteValue: this.concreteValue,
            takenEdge: this.takenEdge,
            alternativeEdge: this.alternativeEdge,
            symbolicPredicate: this.symbolicPredicate?.toJSON ? this.symbolicPredicate.toJSON() : this.symbolicPredicate,
            frameId: this.frameId,
            ssaDependencies: this.ssaDependencies,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BranchPredicate(json);
    }
}
