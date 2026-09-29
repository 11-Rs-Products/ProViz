/**
 * MutationQueries — High-level query interface for mutation campaigns, matrices, and mutant classifications.
 */

export class MutationQueries {
    /**
     * @param {import('./MutationSnapshot.js').MutationSnapshot} snapshot
     */
    constructor(snapshot) {
        this._snapshot = snapshot;
    }

    getMutationCampaign() {
        return this._snapshot?.campaign || null;
    }

    getMutants() {
        return this._snapshot?.candidates || [];
    }

    getMutant(mutantId) {
        return this._snapshot?.getCandidate(mutantId) || null;
    }

    getMutationResult(mutantId) {
        return this._snapshot?.getResult(mutantId) || null;
    }

    getKilledMutants() {
        return (this._snapshot?.results || [])
            .filter(r => r.isKilled || r.status === 'KILLED')
            .map(r => r.mutant);
    }

    getSurvivingMutants() {
        return (this._snapshot?.results || [])
            .filter(r => r.status === 'SURVIVED')
            .map(r => r.mutant);
    }

    getEquivalentMutants() {
        return (this._snapshot?.results || [])
            .filter(r => r.status === 'EQUIVALENT')
            .map(r => r.mutant);
    }

    getUnknownMutants() {
        return (this._snapshot?.results || [])
            .filter(r => r.status === 'UNKNOWN')
            .map(r => r.mutant);
    }

    getUnsupportedMutants() {
        return (this._snapshot?.results || [])
            .filter(r => r.status === 'UNSUPPORTED')
            .map(r => r.mutant);
    }

    getTestsKillingMutant(mutantId) {
        return this._snapshot?.matrix?.testsKillingMutant(mutantId) || [];
    }

    getMutantsKilledByTest(testId) {
        return this._snapshot?.matrix?.mutantsKilledByTest(testId) || [];
    }

    getMutationMatrix() {
        return this._snapshot?.matrix || null;
    }

    getMutationScore() {
        return this._snapshot?.score || null;
    }

    getMutationCoverage() {
        return this._snapshot?.campaign?.coverage || null;
    }

    getMutationExplanation(mutantId) {
        const res = this.getMutationResult(mutantId);
        return res ? res.explanation : 'No explanation available.';
    }

    getMutationCandidatesAtLocation(location) {
        const line = location?.line;
        if (!line) return [];
        return (this._snapshot?.candidates || []).filter(c => c.sourceLocation.line === line);
    }

    getMutationCandidatesForFunction(functionId) {
        return this._snapshot?.candidates || [];
    }

    getMutationCandidatesForFinding(findingId) {
        return this._snapshot?.candidates || [];
    }

    getMutationCandidatesForRepair(repairId) {
        return this._snapshot?.candidates || [];
    }
}
