/**
 * ConcolicQueries — Deterministic read-only query API for exploration sessions and results.
 */

export class ConcolicQueries {
    /**
     * @param {import('./ConcolicSnapshot.js').ConcolicSnapshot} snapshot
     */
    constructor(snapshot) {
        this.snapshot = snapshot;
        this._pathMap = new Map();
        this._candMap = new Map();

        if (this.snapshot) {
            for (const p of this.snapshot.paths) this._pathMap.set(p.pathId, p);
            for (const c of this.snapshot.candidates) this._candMap.set(c.candidateId, c);
        }
    }

    getCurrentSession() {
        return this.snapshot?.session || null;
    }

    getExploredPaths() {
        return this.snapshot?.paths || [];
    }

    getPath(pathId) {
        return this._pathMap.get(pathId) || null;
    }

    getPathConstraints(pathId) {
        const p = this.getPath(pathId);
        return p ? p.pathConstraints : [];
    }

    getBranchPredicates(pathId) {
        const p = this.getPath(pathId);
        return p ? p.branchDecisions : [];
    }

    getUnexploredBranches() {
        return this.snapshot?.unexploredBranches || [];
    }

    getExplorationGraph() {
        return this.snapshot?.explorationGraph || null;
    }

    getCandidates() {
        return this.snapshot?.candidates || [];
    }

    getCandidate(candidateId) {
        return this._candMap.get(candidateId) || null;
    }

    getDivergences() {
        return this.snapshot?.divergences || [];
    }

    getRefinements() {
        return this.snapshot?.refinements || [];
    }

    getCoverage() {
        return this.snapshot?.coverage || null;
    }

    getStatistics() {
        return this.snapshot?.statistics || {};
    }

    explainPath(pathId) {
        const p = this.getPath(pathId);
        if (!p) return null;
        return {
            pathId: p.pathId,
            nodesCount: p.nodeSequence.length,
            branchesCount: p.branchDecisions.length,
            constraintsCount: p.pathConstraints.length,
            summary: `Observed path ${p.pathId} traversed ${p.nodeSequence.length} nodes with ${p.branchDecisions.length} branch decisions.`,
        };
    }
}
