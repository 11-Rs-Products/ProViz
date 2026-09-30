/**
 * WeightedDistribution — Samples indices according to assigned weights.
 */

import { Distribution } from './Distribution.js';

export class WeightedDistribution extends Distribution {
    /**
     * @param {Array<number>} weights
     */
    constructor(weights = []) {
        super({ name: 'WeightedDistribution' });
        this.weights = Object.freeze([...weights]);
        this.totalWeight = this.weights.reduce((sum, w) => sum + w, 0) || 1.0;
        Object.freeze(this);
    }

    sampleIndex(size, randomVal) {
        if (this.weights.length === 0) return 0;
        let cumulative = 0;
        const target = randomVal * this.totalWeight;
        for (let i = 0; i < this.weights.length; i++) {
            cumulative += this.weights[i];
            if (target <= cumulative) {
                return i;
            }
        }
        return this.weights.length - 1;
    }
}
