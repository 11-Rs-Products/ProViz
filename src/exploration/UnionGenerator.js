/**
 * UnionGenerator — Generates a value from one of several possible type generators.
 */

import { Generator } from './Generator.js';

export class UnionGenerator extends Generator {
    /**
     * @param {object} params
     * @param {Array<Generator>} params.generators
     */
    constructor(params = {}) {
        super({
            ...params,
            name: 'UnionGenerator',
            type: 'union',
        });
        this.generators = Object.freeze([...(params.generators || [])]);
        Object.freeze(this);
    }

    generateValue(context) {
        if (this.generators.length === 0) return null;
        const idx = Math.floor(context.random() * this.generators.length);
        return this.generators[idx].generateValue(context);
    }
}
