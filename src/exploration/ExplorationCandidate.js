/**
 * ExplorationCandidate — Candidate exploration target holding input, generator, objective, and score.
 */

import { ExplorationScore } from './ExplorationScore.js';

export class ExplorationCandidate {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.targetFunction
     * @param {any} params.input
     * @param {string} [params.generatorId='']
     * @param {string} [params.objectiveId='']
     * @param {ExplorationScore|object} [params.score]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        targetFunction,
        input,
        generatorId = '',
        objectiveId = '',
        score = new ExplorationScore(),
        metadata = {},
    } = {}) {
        this.targetFunction = String(targetFunction || '');
        this.input = input;
        this.generatorId = String(generatorId);
        this.objectiveId = String(objectiveId);
        this.score = score instanceof ExplorationScore ? score : ExplorationScore.fromJSON(score);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            targetFunction: this.targetFunction,
            input: this.input,
            generatorId: this.generatorId,
            objectiveId: this.objectiveId,
        });
        this.id = id || `candidate_${ExplorationCandidate.computeHash(hashPayload)}`;
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

    withScore(newScore) {
        return new ExplorationCandidate({
            id: this.id,
            targetFunction: this.targetFunction,
            input: this.input,
            generatorId: this.generatorId,
            objectiveId: this.objectiveId,
            score: newScore,
            metadata: this.metadata,
        });
    }

    toJSON() {
        return {
            id: this.id,
            targetFunction: this.targetFunction,
            input: this.input,
            generatorId: this.generatorId,
            objectiveId: this.objectiveId,
            score: this.score.toJSON(),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationCandidate(json);
    }
}
