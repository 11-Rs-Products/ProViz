import { NoveltyScore } from './NoveltyScore.js';
import { BehaviorClusterer } from './BehaviorClusterer.js';

export class NoveltyDetector {
    /**
     * @param {Set<string>|object} [optionsOrKnown]
     */
    constructor(optionsOrKnown = {}) {
        if (optionsOrKnown instanceof Set) {
            this.known = new Set(optionsOrKnown);
            this.noveltyThreshold = 0.3;
        } else if (Array.isArray(optionsOrKnown)) {
            this.known = new Set(optionsOrKnown);
            this.noveltyThreshold = 0.3;
        } else {
            this.known = new Set(optionsOrKnown.knownFingerprints || []);
            this.noveltyThreshold = optionsOrKnown.noveltyThreshold !== undefined ? optionsOrKnown.noveltyThreshold : 0.3;
        }

        this.seenBranches = new Set();
        this.seenExceptions = new Set();
        this.seenPaths = new Set();
        this.clusterer = new BehaviorClusterer();
        this.novelFingerprints = [];
    }

    /**
     * @param {BehavioralFingerprint} fingerprint
     * @returns {NoveltyScore}
     */
    evaluate(fingerprint) {
        if (!fingerprint) return new NoveltyScore();

        let branchNovelty = 0.0;
        if (fingerprint.coveredBranches) {
            for (const b of fingerprint.coveredBranches) {
                if (!this.seenBranches.has(b)) {
                    branchNovelty = 1.0;
                    break;
                }
            }
        }

        let exNovelty = 0.0;
        if (fingerprint.exceptionType && !this.seenExceptions.has(fingerprint.exceptionType)) {
            exNovelty = 1.0;
        }

        let pathNovelty = 0.0;
        if (fingerprint.pathSignature && !this.seenPaths.has(fingerprint.pathSignature)) {
            pathNovelty = 1.0;
        }

        const fpHash = typeof fingerprint.hash === 'function' ? fingerprint.hash() : fingerprint.hash;
        const isNewFp = !this.known.has(fpHash);
        const valNovelty = isNewFp ? 0.5 : 0.0;

        const total = Math.min(1.0, (branchNovelty * 0.4) + (exNovelty * 0.3) + (pathNovelty * 0.2) + (valNovelty * 0.1));
        const isNovel = isNewFp || total >= this.noveltyThreshold;

        const score = new NoveltyScore({
            total,
            branchNovelty,
            valueNovelty: valNovelty,
            exceptionNovelty: exNovelty,
            pathNovelty,
            isNovel
        });

        if (isNovel) {
            this.register(fingerprint);
            this.clusterer.cluster(fingerprint);
            this.novelFingerprints.push(fingerprint);
        }

        return score;
    }

    /**
     * Registers a fingerprint into known history.
     * @param {BehavioralFingerprint} fingerprint
     */
    register(fingerprint) {
        if (!fingerprint) return;
        const fpHash = typeof fingerprint.hash === 'function' ? fingerprint.hash() : fingerprint.hash;
        this.known.add(fpHash);
        if (fingerprint.coveredBranches) {
            for (const b of fingerprint.coveredBranches) this.seenBranches.add(b);
        }
        if (fingerprint.exceptionType) this.seenExceptions.add(fingerprint.exceptionType);
        if (fingerprint.pathSignature) this.seenPaths.add(fingerprint.pathSignature);
    }
}
