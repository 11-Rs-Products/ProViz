/**
 * AdaptiveDistribution — Dynamically adjusts weights based on exploration feedback and novelty.
 */

import { Distribution } from './Distribution.js';
import { WeightedDistribution } from './WeightedDistribution.js';

export class AdaptiveDistribution extends Distribution {
    /**
     * @param {Array<number>} [initialWeights]
     */
    constructor(initialWeights = [1, 1, 1, 1]) {
        super({ name: 'AdaptiveDistribution' });
        this.weights = Object.freeze([...initialWeights]);
        this.weighted = new WeightedDistribution(this.weights);
        Object.freeze(this);
    }

    updateFeedback(rewards = []) {
        const newWeights = this.weights.map((w, i) => Math.max(0.1, w + (rewards[i] || 0)));
        return new AdaptiveDistribution(newWeights);
    }

    sampleIndex(size, randomVal) {
        return this.weighted.sampleIndex(size, randomVal);
    }
}
