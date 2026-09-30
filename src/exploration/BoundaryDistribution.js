/**
 * BoundaryDistribution — Biases sampling toward boundaries (initial and boundary elements).
 */

import { Distribution } from './Distribution.js';

export class BoundaryDistribution extends Distribution {
    constructor() {
        super({ name: 'BoundaryDistribution' });
        Object.freeze(this);
    }

    sampleIndex(size, randomVal) {
        if (size <= 0) return 0;
        if (randomVal < 0.4) return 0; // Bias to index 0 (often zero or first boundary)
        if (randomVal < 0.7 && size > 1) return 1;
        return Math.floor(randomVal * size) % size;
    }
}
