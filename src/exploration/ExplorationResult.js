/**
 * ExplorationResult — Encapsulates an execution outcome, fingerprint, novelty score, and findings.
 */

import { BehavioralFingerprint } from './BehavioralFingerprint.js';
import { NoveltyScore } from './NoveltyScore.js';

export class ExplorationResult {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.targetFunction
     * @param {any} params.input
     * @param {object} [params.outcome={}]
     * @param {BehavioralFingerprint|object} [params.fingerprint]
     * @param {NoveltyScore|object} [params.noveltyScore]
     * @param {string|null} [params.objectiveId=null]
     * @param {Array<string>} [params.findings=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        targetFunction,
        input,
        outcome = {},
        fingerprint = new BehavioralFingerprint(),
        noveltyScore = new NoveltyScore(),
        objectiveId = null,
        findings = [],
        metadata = {},
    } = {}) {
        this.targetFunction = String(targetFunction || '');
        this.input = input;
        this.outcome = Object.freeze({ ...outcome });
        this.fingerprint = fingerprint instanceof BehavioralFingerprint
            ? fingerprint
            : BehavioralFingerprint.fromJSON(fingerprint);
        this.noveltyScore = noveltyScore instanceof NoveltyScore
            ? noveltyScore
            : NoveltyScore.fromJSON(noveltyScore);
        this.objectiveId = objectiveId;
        this.findings = Object.freeze([...findings]);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            targetFunction: this.targetFunction,
            input: this.input,
            fingerprint: this.fingerprint.hash,
        });
        this.id = id || `exp_res_${ExplorationResult.computeHash(hashPayload)}`;
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
            id: this.id,
            targetFunction: this.targetFunction,
            input: this.input,
            outcome: this.outcome,
            fingerprint: this.fingerprint.toJSON(),
            noveltyScore: this.noveltyScore.toJSON(),
            objectiveId: this.objectiveId,
            findings: this.findings,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationResult(json);
    }
}
