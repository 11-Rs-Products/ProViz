/**
 * RepairQueries — High-level query interface for repair candidates, results, explanations, and history.
 */

export class RepairQueries {
    /**
     * @param {import('./RepairSnapshot.js').RepairSnapshot} snapshot
     */
    constructor(snapshot) {
        this._snapshot = snapshot;
    }

    getCandidate(candidateId) {
        return this._snapshot?.getCandidate(candidateId) || null;
    }

    getResult(candidateId) {
        return this._snapshot?.getResult(candidateId) || null;
    }

    getAllCandidates() {
        return this._snapshot?.candidates || [];
    }

    getAllResults() {
        return this._snapshot?.results || [];
    }

    getValidCandidates() {
        return (this._snapshot?.results || [])
            .filter(r => r.isValidated)
            .map(r => r.candidate);
    }

    getExplanation(candidateId) {
        const res = this.getResult(candidateId);
        return res ? res.explanation : null;
    }

    getHistory() {
        return this._snapshot?.history?.getAllEntries() || [];
    }

    explainRepair(candidateId) {
        const explanation = this.getExplanation(candidateId);
        return explanation ? explanation.formatSummary() : 'No explanation available.';
    }
}
