/**
 * MutationMatrix — Bipartite relationship matrix mapping TestCases to MutationCandidates and execution outcomes.
 */

export class MutationMatrix {
    /**
     * @param {object} [params]
     * @param {Array<object>} [params.entries=[]]
     */
    constructor({ entries = [] } = {}) {
        this._entries = [...entries];
    }

    addEntry({ testCaseId, mutantId, result, oracle = 'EXCEPTION', observation = null }) {
        this._entries.push({
            testCaseId: String(testCaseId),
            mutantId: String(mutantId),
            result: String(result),
            oracle: String(oracle),
            observation: observation ? { ...observation } : null,
        });
    }

    mutantsKilledByTest(testId) {
        return this._entries
            .filter(e => e.testCaseId === String(testId) && e.result === 'KILLED')
            .map(e => e.mutantId);
    }

    testsKillingMutant(mutantId) {
        return this._entries
            .filter(e => e.mutantId === String(mutantId) && e.result === 'KILLED')
            .map(e => e.testCaseId);
    }

    survivingMutantsForFunction(functionId) {
        // Returns mutant IDs that were never killed
        const allMutantIds = new Set(this._entries.map(e => e.mutantId));
        const killedMutantIds = new Set(this._entries.filter(e => e.result === 'KILLED').map(e => e.mutantId));
        return Array.from(allMutantIds).filter(id => !killedMutantIds.has(id));
    }

    getAllEntries() {
        return [...this._entries];
    }

    toJSON() {
        return {
            entries: this._entries,
        };
    }

    static fromJSON(json) {
        if (!json) return new MutationMatrix();
        return new MutationMatrix({ entries: json.entries || [] });
    }
}
