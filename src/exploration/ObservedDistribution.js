/**
 * ObservedDistribution — Biases generation toward previously observed values and execution states.
 */

import { Distribution } from './Distribution.js';

export class ObservedDistribution extends Distribution {
    constructor() {
        super({ name: 'ObservedDistribution' });
        Object.freeze(this);
    }

    sampleIndex(size, randomVal) {
        if (size <= 0) return 0;
        return Math.floor(randomVal * size) % size;
    }
}
