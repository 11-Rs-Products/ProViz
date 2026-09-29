/**
 * SymbolicPathCandidate — Unexplored path candidate produced by branch negation.
 */

export class SymbolicPathCandidate {
    /**
     * @param {object} params
     * @param {string} [params.candidateId]
     * @param {string|null} [params.parentPathId=null]
     * @param {import('./BranchPredicate.js').BranchPredicate|object|null} [params.branchToNegate=null]
     * @param {Array<import('./PathConstraint.js').PathConstraint|object>} [params.retainedConstraints=[]]
     * @param {import('../symbolic/Constraint.js').Constraint|object|null} [params.negatedPredicate=null]
     * @param {object|null} [params.solverResult=null]
     * @param {import('../testing/ConstraintAssignment.js').ConstraintAssignment|object|null} [params.generatedAssignment=null]
     * @param {string} [params.status='PENDING'] - 'PENDING', 'SAT', 'UNSAT', 'EXPLORED', 'UNKNOWN'
     */
    constructor({
        candidateId = null,
        parentPathId = null,
        branchToNegate = null,
        retainedConstraints = [],
        negatedPredicate = null,
        solverResult = null,
        generatedAssignment = null,
        status = 'PENDING',
    } = {}) {
        this.parentPathId = parentPathId;
        this.branchToNegate = branchToNegate;
        this.retainedConstraints = Object.freeze([...retainedConstraints]);
        this.negatedPredicate = negatedPredicate;
        this.solverResult = solverResult;
        this.generatedAssignment = generatedAssignment;
        this.status = status;

        const hash = SymbolicPathCandidate.computeHash(JSON.stringify({
            parent: this.parentPathId,
            branch: this.branchToNegate?.branchId,
            negated: this.negatedPredicate?.toString ? this.negatedPredicate.toString() : this.negatedPredicate,
        }));
        this.candidateId = candidateId || `cand_${hash}`;
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

    withStatus(newStatus, assignment = null, solverResult = null) {
        return new SymbolicPathCandidate({
            candidateId: this.candidateId,
            parentPathId: this.parentPathId,
            branchToNegate: this.branchToNegate,
            retainedConstraints: this.retainedConstraints,
            negatedPredicate: this.negatedPredicate,
            solverResult: solverResult !== null ? solverResult : this.solverResult,
            generatedAssignment: assignment !== null ? assignment : this.generatedAssignment,
            status: newStatus,
        });
    }

    toJSON() {
        return {
            candidateId: this.candidateId,
            parentPathId: this.parentPathId,
            branchToNegate: this.branchToNegate?.toJSON ? this.branchToNegate.toJSON() : this.branchToNegate,
            retainedConstraints: this.retainedConstraints.map(c => c.toJSON ? c.toJSON() : c),
            negatedPredicate: this.negatedPredicate?.toJSON ? this.negatedPredicate.toJSON() : this.negatedPredicate,
            solverResult: this.solverResult,
            generatedAssignment: this.generatedAssignment?.toJSON ? this.generatedAssignment.toJSON() : this.generatedAssignment,
            status: this.status,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SymbolicPathCandidate(json);
    }
}
