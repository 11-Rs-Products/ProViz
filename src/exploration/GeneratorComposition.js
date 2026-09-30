/**
 * GeneratorComposition — Composes generators via choice (oneOf), sequence, or mapping.
 */

import { Generator } from './Generator.js';

export class GeneratorComposition extends Generator {
    /**
     * @param {object} params
     * @param {Array<Generator>} params.generators
     * @param {string} [params.mode='ONE_OF'] - ONE_OF, SEQUENCE
     */
    constructor(params = {}) {
        super({
            ...params,
            name: params.name || 'GeneratorComposition',
            type: 'composite',
        });
        this.generators = Object.freeze([...(params.generators || [])]);
        this.mode = params.mode || 'ONE_OF';
        Object.freeze(this);
    }

    generateValue(context) {
        if (this.generators.length === 0) return null;
        if (this.mode === 'ONE_OF') {
            const idx = Math.floor(context.random() * this.generators.length);
            return this.generators[idx].generateValue(context);
        }
        return this.generators.map(g => g.generateValue(context));
    }
}
