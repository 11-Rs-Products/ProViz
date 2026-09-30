/**
 * BooleanGenerator — Generates boolean values.
 */

import { Generator } from './Generator.js';

export class BooleanGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'BooleanGenerator',
            type: 'boolean',
        });
        Object.freeze(this);
    }

    generateValue(context) {
        if (context.step === 0) return true;
        if (context.step === 1) return false;
        return context.random() > 0.5;
    }
}
