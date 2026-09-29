/**
 * MutationCampaign — Aggregate container representing a complete mutation analysis run.
 */

import { MutationCandidate } from './MutationCandidate.js';
import { MutationResult } from './MutationResult.js';
import { MutationMatrix } from './MutationMatrix.js';
import { MutationScore } from './MutationScore.js';

export class MutationCampaign {
    /**
     * @param {object} params
     * @param {string} [params.campaignId=null]
     * @param {object|string} [params.workspaceSnapshot=null]
     * @param {Array<MutationCandidate|object>} [params.mutants=[]]
     * @param {Array<MutationResult|object>} [params.results=[]]
     * @param {MutationMatrix|object} [params.matrix=null]
     * @param {MutationScore|object} [params.score=null]
     * @param {object|null} [params.coverage=null]
     * @param {object} [params.statistics={}]
     */
    constructor({
        campaignId = null,
        workspaceSnapshot = null,
        mutants = [],
        results = [],
        matrix = null,
        score = null,
        coverage = null,
        statistics = {},
    } = {}) {
        this.workspaceSnapshot = workspaceSnapshot;
        this.mutants = Object.freeze(mutants.map(m => m instanceof MutationCandidate ? m : new MutationCandidate(m)));
        this.results = Object.freeze(results.map(r => r instanceof MutationResult ? r : new MutationResult(r)));
        this.matrix = matrix instanceof MutationMatrix ? matrix : (matrix ? MutationMatrix.fromJSON(matrix) : new MutationMatrix());
        this.score = score instanceof MutationScore ? score : (score ? MutationScore.fromJSON(score) : MutationScore.compute(this.results));
        this.coverage = coverage ? Object.freeze({ ...coverage }) : null;
        this.statistics = Object.freeze({ ...statistics });

        const hash = MutationCampaign.computeHash(JSON.stringify({
            muts: this.mutants.length,
            res: this.results.length,
            score: this.score.rawMutationRatio,
        }));
        this.campaignId = campaignId || `campaign_${hash}`;
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
            campaignId: this.campaignId,
            mutants: this.mutants.map(m => m.toJSON()),
            results: this.results.map(r => r.toJSON()),
            matrix: this.matrix.toJSON(),
            score: this.score.toJSON(),
            coverage: this.coverage,
            statistics: this.statistics,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MutationCampaign({
            campaignId: json.campaignId,
            mutants: (json.mutants || []).map(m => MutationCandidate.fromJSON(m)),
            results: (json.results || []).map(r => MutationResult.fromJSON(r)),
            matrix: MutationMatrix.fromJSON(json.matrix),
            score: MutationScore.fromJSON(json.score),
            coverage: json.coverage,
            statistics: json.statistics,
        });
    }
}
