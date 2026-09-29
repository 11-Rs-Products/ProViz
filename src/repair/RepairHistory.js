/**
 * RepairHistory — Persistent log of proposed, applied, and reverted repairs.
 */

export class RepairHistory {
    /**
     * @param {object} [params]
     * @param {Array<object>} [params.entries=[]]
     */
    constructor({ entries = [] } = {}) {
        this._entries = [...entries];
    }

    /**
     * Record an applied repair.
     * @param {import('./RepairCandidate.js').RepairCandidate} candidate
     * @param {number} revBefore
     * @param {number} revAfter
     * @returns {object}
     */
    recordApplied(candidate, revBefore, revAfter) {
        const repairId = `rep_${candidate.candidateId}_${Date.now()}`;
        const entry = {
            repairId,
            candidateId: candidate.candidateId,
            sourceRevisionBefore: revBefore,
            sourceRevisionAfter: revAfter,
            findingIds: candidate.findingIds,
            patch: candidate.patch.toJSON(),
            strategy: candidate.strategy,
            userAction: 'APPLIED',
            timestamp: Date.now(),
        };
        this._entries.push(entry);
        return entry;
    }

    /**
     * Record a reverted repair.
     * @param {string} repairId
     * @param {number} revBefore
     * @param {number} revAfter
     * @returns {object}
     */
    recordReverted(repairId, revBefore, revAfter) {
        const entry = {
            repairId: `rev_${repairId}_${Date.now()}`,
            originalRepairId: repairId,
            sourceRevisionBefore: revBefore,
            sourceRevisionAfter: revAfter,
            userAction: 'REVERTED',
            timestamp: Date.now(),
        };
        this._entries.push(entry);
        return entry;
    }

    /**
     * Record a rejected candidate.
     * @param {string} candidateId
     * @returns {object}
     */
    recordRejected(candidateId) {
        const entry = {
            repairId: `rej_${candidateId}_${Date.now()}`,
            candidateId,
            userAction: 'REJECTED',
            timestamp: Date.now(),
        };
        this._entries.push(entry);
        return entry;
    }

    getEntry(repairId) {
        return this._entries.find(e => e.repairId === repairId) || null;
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
        if (!json) return new RepairHistory();
        return new RepairHistory({ entries: json.entries || [] });
    }
}
