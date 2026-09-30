/**
 * RareValueDistribution — Biases sampling toward tail / rarely explored values.
 */

import { Distribution } from './Distribution.js';

export class RareValueDistribution extends Distribution {
    constructor() {
        super({ name: 'RareValueDistribution' });
        Object.freeze(this);
    }

    sampleIndex(size, randomVal) {
        if (size <= 0) return 0;
        // Inverse square bias to select higher indices / rare elements
        const skewed = 1.0 - Math.sqrt(1.0 - randomVal);
        return Math.min(size - 1, Math.floor(skewed * size));
    }
}
