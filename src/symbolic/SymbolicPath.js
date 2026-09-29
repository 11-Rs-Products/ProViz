/**
 * SymbolicPath — Represents an execution path through the CFG governed by symbolic predicates.
 */

import { PathPredicate } from './PathPredicate.js';
import { SymbolicState } from './SymbolicState.js';

export class SymbolicPath {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.functionId]
     * @param {Array<string>} [params.nodeIds]
     * @param {Array<PathPredicate>} [params.predicates]
     * @param {SymbolicState|null} [params.finalState]
     * @param {boolean} [params.isFeasible=true]
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        functionId = '<module>',
        nodeIds = [],
        predicates = [],
        finalState = null,
        isFeasible = true,
        metadata = {},
    } = {}) {
        this.functionId = String(functionId || '<module>');
        this.nodeIds = Object.freeze([...nodeIds]);
        this.predicates = Object.freeze(predicates.map(p => (p instanceof PathPredicate ? p : PathPredicate.fromJSON(p))));
        this.finalState = finalState instanceof SymbolicState ? finalState : (finalState ? SymbolicState.fromJSON(finalState) : null);
        this.isFeasible = Boolean(isFeasible && (this.finalState ? this.finalState.isReachable : true));
        this.metadata = Object.freeze({ ...metadata });

        const pathStr = `${this.functionId}:${this.nodeIds.join('->')}:${this.predicates.map(p => p.toString()).join(';')}`;
        this.id = id || `sympath_${this.functionId}_${SymbolicPath.computeHash(pathStr)}`;
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

    toJSON() {
        return {
            id: this.id,
            functionId: this.functionId,
            nodeIds: this.nodeIds,
            predicates: this.predicates.map(p => p.toJSON()),
            finalState: this.finalState ? this.finalState.toJSON() : null,
            isFeasible: this.isFeasible,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SymbolicPath(json);
    }
}
