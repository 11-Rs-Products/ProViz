/**
 * TupleGenerator — Generates fixed-length heterogeneous tuples.
 */

import { Generator } from './Generator.js';

export class TupleGenerator extends Generator {
    /**
     * @param {object} params
     * @param {Array<Generator>} params.generators
     */
    constructor(params = {}) {
        super({
            ...params,
            name: 'TupleGenerator',
            type: 'tuple',
        });
        this.generators = Object.freeze([...(params.elementGenerators || params.generators || [])]);
        Object.freeze(this);
    }

    generateValue(context) {
        return this.generators.map((g, idx) => g.generateValue(context.next(idx + 1)));
    }
}
