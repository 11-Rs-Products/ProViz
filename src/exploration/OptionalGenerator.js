/**
 * OptionalGenerator — Generates either null/None or a generated value.
 */

import { Generator } from './Generator.js';

export class OptionalGenerator extends Generator {
    /**
     * @param {object} params
     * @param {Generator} params.generator
     * @param {number} [params.nullProbability=0.2]
     */
    constructor(params = {}) {
        super({
            ...params,
            name: 'OptionalGenerator',
            type: 'optional',
        });
        this.innerGenerator = params.generator;
        this.nullProbability = params.nullProbability !== undefined ? Number(params.nullProbability) : 0.2;
        Object.freeze(this);
    }

    generateValue(context) {
        if (context.step === 0) return null;
        if (context.random() < this.nullProbability) return null;
        return this.innerGenerator ? this.innerGenerator.generateValue(context) : null;
    }
}
