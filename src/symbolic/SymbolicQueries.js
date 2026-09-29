/**
 * SymbolicQueries — Unified query interface for symbolic paths, constraints, proofs, and counterexamples.
 */

import { ConstraintSolver } from './ConstraintSolver.js';
import { SymbolicExplanation } from './SymbolicExplanation.js';

export class SymbolicQueries {
    /**
     * @param {object} params
     * @param {import('./SymbolicSnapshot.js').SymbolicSnapshot} params.snapshot
     * @param {object} [params.cfg]
     */
    constructor({ snapshot, cfg = null } = {}) {
        this.snapshot = snapshot;
        this.cfg = cfg;
        this.solver = new ConstraintSolver();

        this._pathsById = new Map();
        for (const p of snapshot?.paths || []) {
            this._pathsById.set(p.id, p);
        }

        this._refinedByFindingId = new Map();
        for (const rf of snapshot?.refinedFindings || []) {
            this._refinedByFindingId.set(rf.findingId, rf);
        }
    }

    getPaths() {
        return this.snapshot?.paths || [];
    }

    getPath(id) {
        return this._pathsById.get(id) || null;
    }

    getFeasiblePaths() {
        return this.getPaths().filter(p => p.isFeasible);
    }

    getInfeasiblePaths() {
        return this.getPaths().filter(p => !p.isFeasible);
    }

    getProofs() {
        return this.snapshot?.proofs || [];
    }

    getProof(property) {
        return this.getProofs().find(p => p.property === property || p.property.includes(property)) || null;
    }

    getCounterexamples() {
        return this.snapshot?.counterexamples || [];
    }

    getCounterexample(property) {
        return this.getCounterexamples().find(c => c.property === property || c.property.includes(property)) || null;
    }

    getRefinedFinding(findingId) {
        return this._refinedByFindingId.get(findingId) || null;
    }

    isSatisfiable(constraints) {
        return this.solver.checkSat(constraints).isSat();
    }

    isContradictory(constraints) {
        return this.solver.checkSat(constraints).isUnsat();
    }

    implies(constraints, targetConstraint) {
        return this.solver.implies(constraints, targetConstraint);
    }

    explainProof(proof) {
        return SymbolicExplanation.explainProof(proof);
    }

    explainCounterexample(cex) {
        return SymbolicExplanation.explainCounterexample(cex);
    }

    getSymbolicSnapshot() {
        return this.snapshot;
    }
}
