/**
 * FloatGenerator — Generates bounded floating point numbers.
 */

import { Generator } from './Generator.js';

export class FloatGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'FloatGenerator',
            type: 'float',
        });
        this.min = params.min !== undefined ? Number(params.min) : -100.0;
        this.max = params.max !== undefined ? Number(params.max) : 100.0;
        Object.freeze(this);
    }

    generateValue(context) {
        if (context.step === 0) return 0.0;
        if (context.step === 1) return 1.0;
        if (context.step === 2) return -1.0;

        const r = context.random();
        const val = this.min + r * (this.max - this.min);
        return Math.round(val * 1000) / 1000;
    }
}
