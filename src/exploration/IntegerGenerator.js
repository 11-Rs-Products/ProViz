/**
 * IntegerGenerator — Generates bounded integers with boundary and zero awareness.
 */

import { Generator } from './Generator.js';

export class IntegerGenerator extends Generator {
    /**
     * @param {object} [params]
     * @param {number} [params.min=-100]
     * @param {number} [params.max=100]
     * @param {boolean} [params.includeBoundaries=true]
     */
    constructor(params = {}) {
        super({
            ...params,
            name: 'IntegerGenerator',
            type: 'int',
        });
        this.min = params.min !== undefined ? Number(params.min) : -100;
        this.max = params.max !== undefined ? Number(params.max) : 100;
        this.includeBoundaries = params.includeBoundaries !== false;
        Object.freeze(this);
    }

    generateValue(context) {
        const r = context.random();
        // Boundary injection on initial steps
        if (this.includeBoundaries && context.step < 4) {
            if (context.step === 0 && this.min <= 0 && this.max >= 0) return 0;
            if (context.step === 1) return this.min;
            if (context.step === 2) return this.max;
            if (context.step === 3 && this.min <= 1 && this.max >= 1) return 1;
        }

        const range = this.max - this.min + 1;
        return Math.floor(r * range) + this.min;
    }
}
