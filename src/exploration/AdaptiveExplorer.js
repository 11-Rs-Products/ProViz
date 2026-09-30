/**
 * AdaptiveExplorer — Master adaptive exploration loop driver.
 */

import { ExplorationQueue } from './ExplorationQueue.js';
import { ExplorationCandidate } from './ExplorationCandidate.js';
import { ExplorationScore } from './ExplorationScore.js';
import { NoveltyDetector } from './NoveltyDetector.js';
import { CoverageGuidedExplorer } from './CoverageGuidedExplorer.js';
import { BehavioralFingerprint } from './BehavioralFingerprint.js';
import { ExplorationFeedback } from './ExplorationFeedback.js';

export class AdaptiveExplorer {
    /**
     * @param {object} [options={}]
     */
    constructor(options = {}) {
        this.options = Object.freeze({
            maxSteps: options.maxSteps || 100,
            ...options,
        });

        this.queue = new ExplorationQueue(options.maxQueueSize || 5000);
        this.noveltyDetector = new NoveltyDetector();
        this.coverageExplorer = new CoverageGuidedExplorer();
        this.completedResults = [];
        this.closedGaps = new Set();
        this.seenBehaviors = [];
    }

    addCandidate(candidate) {
        this.queue.push(candidate);
    }

    /**
     * Runs a single exploration step.
     * @param {Function} executor - (input) => ({ returnValue, exception, coveredBranches, pathId })
     * @returns {object|null}
     */
    step(executor) {
        const candidate = this.queue.pop();
        if (!candidate) return null;

        let outcome = null;
        try {
            outcome = executor(candidate.input);
        } catch (err) {
            outcome = { exception: { type: err.name || 'Error', message: err.message } };
        }

        const fingerprint = BehavioralFingerprint.fromOutcome(outcome);
        const noveltyScore = this.noveltyDetector.evaluate(fingerprint);
        this.noveltyDetector.register(fingerprint);
        const covFeedback = this.coverageExplorer.evaluateOutcome(outcome);

        const result = {
            candidateId: candidate.id,
            input: candidate.input,
            outcome,
            fingerprint,
            noveltyScore,
            coverageFeedback: covFeedback,
        };

        this.completedResults.push(result);
        this.seenBehaviors.push(fingerprint);

        return result;
    }
}
