/**
 * ConcretePath — Immutable representation of an observed execution path.
 */

import { PathConstraint } from './PathConstraint.js';
import { BranchPredicate } from './BranchPredicate.js';

export class ConcretePath {
    /**
     * @param {object} params
     * @param {string} [params.pathId]
     * @param {string|null} [params.testCaseId=null]
     * @param {Array<string>} [params.nodeSequence=[]]
     * @param {Array<string>} [params.edgeSequence=[]]
     * @param {Array<BranchPredicate|object>} [params.branchDecisions=[]]
     * @param {Array<object>} [params.exceptions=[]]
     * @param {*} [params.returnState=undefined]
     * @param {Array<PathConstraint|object>} [params.pathConstraints=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        pathId = null,
        testCaseId = null,
        nodeSequence = [],
        edgeSequence = [],
        branchDecisions = [],
        exceptions = [],
        returnState = undefined,
        pathConstraints = [],
        metadata = {},
    } = {}) {
        this.testCaseId = testCaseId;
        this.nodeSequence = Object.freeze([...nodeSequence]);
        this.edgeSequence = Object.freeze([...edgeSequence]);
        this.branchDecisions = Object.freeze(branchDecisions.map(b => b instanceof BranchPredicate ? b : BranchPredicate.fromJSON(b)));
        this.exceptions = Object.freeze([...exceptions]);
        this.returnState = returnState;
        this.pathConstraints = Object.freeze(pathConstraints.map(p => p instanceof PathConstraint ? p : PathConstraint.fromJSON(p)));
        this.metadata = Object.freeze({ ...metadata });

        const hash = ConcretePath.computeHash(JSON.stringify({ nodes: this.nodeSequence, edges: this.edgeSequence }));
        this.pathId = pathId || `cpath_${hash}`;
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
            pathId: this.pathId,
            testCaseId: this.testCaseId,
            nodeSequence: this.nodeSequence,
            edgeSequence: this.edgeSequence,
            branchDecisions: this.branchDecisions.map(b => b.toJSON()),
            exceptions: this.exceptions,
            returnState: this.returnState,
            pathConstraints: this.pathConstraints.map(p => p.toJSON()),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ConcretePath(json);
    }
}
