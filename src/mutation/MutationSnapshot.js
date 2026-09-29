/**
 * MutationSnapshot — Immutable, serializable snapshot of a mutation campaign.
 */

import { MutationSession } from './MutationSession.js';
import { MutationCampaign } from './MutationCampaign.js';
import { MutationCandidate } from './MutationCandidate.js';
import { MutationResult } from './MutationResult.js';
import { MutationMatrix } from './MutationMatrix.js';
import { MutationScore } from './MutationScore.js';

export class MutationSnapshot {
    /**
     * @param {object} params
     * @param {MutationSession|object} [params.session=null]
     * @param {MutationCampaign|object} [params.campaign=null]
     * @param {Array<MutationCandidate|object>} [params.candidates=[]]
     * @param {Array<MutationResult|object>} [params.results=[]]
     * @param {MutationMatrix|object} [params.matrix=null]
     * @param {MutationScore|object} [params.score=null]
     * @param {string} [params.status='SUCCESS']
     * @param {number} [params.version=1]
     */
    constructor({
        session = null,
        campaign = null,
        candidates = [],
        results = [],
        matrix = null,
        score = null,
        status = 'SUCCESS',
        version = 1,
    } = {}) {
        this.session = session instanceof MutationSession ? session : (session ? new MutationSession(session) : null);
        this.campaign = campaign instanceof MutationCampaign ? campaign : (campaign ? new MutationCampaign(campaign) : null);
        this.candidates = Object.freeze(candidates.map(c => c instanceof MutationCandidate ? c : new MutationCandidate(c)));
        this.results = Object.freeze(results.map(r => r instanceof MutationResult ? r : new MutationResult(r)));
        this.matrix = matrix instanceof MutationMatrix ? matrix : (matrix ? MutationMatrix.fromJSON(matrix) : new MutationMatrix());
        this.score = score instanceof MutationScore ? score : (score ? MutationScore.fromJSON(score) : MutationScore.compute(this.results));
        this.status = status;
        this.version = version;
        Object.freeze(this);
    }

    getCandidate(mutantId) {
        return this.candidates.find(c => c.mutantId === mutantId) || null;
    }

    getResult(mutantId) {
        return this.results.find(r => r.mutant?.mutantId === mutantId) || null;
    }

    toJSON() {
        return {
            version: this.version,
            session: this.session?.toJSON ? this.session.toJSON() : this.session,
            campaign: this.campaign?.toJSON ? this.campaign.toJSON() : this.campaign,
            candidates: this.candidates.map(c => c.toJSON()),
            results: this.results.map(r => r.toJSON()),
            matrix: this.matrix.toJSON(),
            score: this.score.toJSON(),
            status: this.status,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MutationSnapshot({
            version: json.version || 1,
            session: MutationSession.fromJSON(json.session),
            campaign: MutationCampaign.fromJSON(json.campaign),
            candidates: (json.candidates || []).map(c => MutationCandidate.fromJSON(c)),
            results: (json.results || []).map(r => MutationResult.fromJSON(r)),
            matrix: MutationMatrix.fromJSON(json.matrix),
            score: MutationScore.fromJSON(json.score),
            status: json.status || 'SUCCESS',
        });
    }
}
