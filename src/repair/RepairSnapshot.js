/**
 * RepairSnapshot — Immutable snapshot of repair candidates, validations, and results.
 */

import { RepairSession } from './RepairSession.js';
import { RepairCandidate } from './RepairCandidate.js';
import { RepairResult } from './RepairResult.js';
import { RepairHistory } from './RepairHistory.js';

export class RepairSnapshot {
    /**
     * @param {object} params
     * @param {RepairSession|object} [params.session=null]
     * @param {Array<RepairCandidate|object>} [params.candidates=[]]
     * @param {Array<RepairResult|object>} [params.results=[]]
     * @param {RepairHistory|object} [params.history=null]
     * @param {string} [params.status='SUCCESS']
     * @param {number} [params.version=1]
     */
    constructor({
        session = null,
        candidates = [],
        results = [],
        history = null,
        status = 'SUCCESS',
        version = 1,
    } = {}) {
        this.session = session instanceof RepairSession ? session : (session ? new RepairSession(session) : null);
        this.candidates = Object.freeze(candidates.map(c => c instanceof RepairCandidate ? c : new RepairCandidate(c)));
        this.results = Object.freeze(results.map(r => r instanceof RepairResult ? r : new RepairResult(r)));
        this.history = history instanceof RepairHistory ? history : (history ? RepairHistory.fromJSON(history) : new RepairHistory());
        this.status = status;
        this.version = version;
        Object.freeze(this);
    }

    getCandidate(candidateId) {
        return this.candidates.find(c => c.candidateId === candidateId) || null;
    }

    getResult(candidateId) {
        return this.results.find(r => r.candidate?.candidateId === candidateId) || null;
    }

    toJSON() {
        return {
            version: this.version,
            session: this.session?.toJSON ? this.session.toJSON() : this.session,
            candidates: this.candidates.map(c => c.toJSON()),
            results: this.results.map(r => r.toJSON()),
            history: this.history.toJSON(),
            status: this.status,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RepairSnapshot({
            version: json.version || 1,
            session: RepairSession.fromJSON(json.session),
            candidates: (json.candidates || []).map(c => RepairCandidate.fromJSON(c)),
            results: (json.results || []).map(r => RepairResult.fromJSON(r)),
            history: RepairHistory.fromJSON(json.history),
            status: json.status || 'SUCCESS',
        });
    }
}
