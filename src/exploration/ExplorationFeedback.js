/**
 * ExplorationFeedback — Aggregated feedback from execution observations, novelty detection, and oracle results.
 */

import { CoverageFeedback } from './CoverageFeedback.js';
import { NoveltyScore } from './NoveltyScore.js';

export class ExplorationFeedback {
    /**
     * @param {object} params
     * @param {CoverageFeedback|object} [params.coverage]
     * @param {NoveltyScore|object} [params.novelty]
     * @param {Array<string>} [params.closedGaps=[]]
     * @param {Array<string>} [params.killedMutants=[]]
     * @param {Array<string>} [params.detectedRegressions=[]]
     */
    constructor({
        coverage = new CoverageFeedback(),
        novelty = new NoveltyScore(),
        closedGaps = [],
        killedMutants = [],
        detectedRegressions = [],
    } = {}) {
        this.coverage = coverage instanceof CoverageFeedback ? coverage : CoverageFeedback.fromJSON(coverage);
        this.novelty = novelty instanceof NoveltyScore ? novelty : NoveltyScore.fromJSON(novelty);
        this.closedGaps = Object.freeze([...closedGaps]);
        this.killedMutants = Object.freeze([...killedMutants]);
        this.detectedRegressions = Object.freeze([...detectedRegressions]);
        Object.freeze(this);
    }

    toJSON() {
        return {
            coverage: this.coverage.toJSON(),
            novelty: this.novelty.toJSON(),
            closedGaps: this.closedGaps,
            killedMutants: this.killedMutants,
            detectedRegressions: this.detectedRegressions,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationFeedback(json);
    }
}
