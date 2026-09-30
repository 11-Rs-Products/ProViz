/**
 * RangeGenerator — Generates numbers within a specified stepping range [start, stop, step].
 */

import { Generator } from './Generator.js';

export class RangeGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'RangeGenerator',
            type: 'range',
        });
        this.start = params.start !== undefined ? Number(params.start) : 0;
        this.stop = params.stop !== undefined ? Number(params.stop) : 10;
        this.step = params.step !== undefined ? Number(params.step) : 1;
        Object.freeze(this);
    }

    generateValue(context) {
        const count = Math.max(1, Math.floor((this.stop - this.start) / this.step));
        const idx = context.step % count;
        return this.start + idx * this.step;
    }
}
