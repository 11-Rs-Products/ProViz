/**
 * ObjectGenerator — Generates structured records/objects with predefined field generators.
 */

import { Generator } from './Generator.js';

export class ObjectGenerator extends Generator {
    /**
     * @param {object} params
     * @param {object<string, Generator>} params.fieldGenerators
     */
    constructor(params = {}) {
        super({
            ...params,
            name: 'ObjectGenerator',
            type: 'object',
        });
        this.fieldGenerators = Object.freeze({ ...(params.fieldGenerators || {}) });
        Object.freeze(this);
    }

    generateValue(context) {
        const res = {};
        let idx = 1;
        for (const [key, gen] of Object.entries(this.fieldGenerators)) {
            res[key] = gen.generateValue(context.next(idx++));
        }
        return res;
    }
}
