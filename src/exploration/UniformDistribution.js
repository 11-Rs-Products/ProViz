/**
 * UniformDistribution — Uniform sampling distribution across available items.
 */

import { Distribution } from './Distribution.js';

export class UniformDistribution extends Distribution {
    constructor() {
        super({ name: 'UniformDistribution' });
        Object.freeze(this);
    }

    sampleIndex(size, randomVal) {
        if (size <= 0) return 0;
        return Math.floor(randomVal * size) % size;
    }
}
