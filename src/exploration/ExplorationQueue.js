/**
 * ExplorationQueue — Bounded priority queue ordering exploration candidates by score.
 */

import { ExplorationCandidate } from './ExplorationCandidate.js';

export class ExplorationQueue {
    /**
     * @param {number} [maxSize=5000]
     */
    constructor(maxSize = 5000) {
        this.maxSize = Number(maxSize) || 5000;
        this.candidates = [];
    }

    get size() {
        return this.candidates.length;
    }

    push(candidate) {
        if (!candidate) return;
        this.candidates.push(candidate);
        // Sort descending by score total if available
        this.candidates.sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
        if (this.candidates.length > this.maxSize) {
            this.candidates = this.candidates.slice(0, this.maxSize);
        }
    }

    enqueue(candidate) {
        return this.push(candidate);
    }

    pop() {
        return this.candidates.shift() || null;
    }

    dequeue() {
        return this.pop();
    }

    peek() {
        return this.candidates[0] || null;
    }

    clear() {
        this.candidates = [];
    }

    toJSON() {
        return {
            maxSize: this.maxSize,
            candidates: this.candidates.map(c => c.toJSON()),
        };
    }
}
