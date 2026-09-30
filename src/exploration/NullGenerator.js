/**
 * NullGenerator — Generates null / None.
 */

import { Generator } from './Generator.js';

export class NullGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'NullGenerator',
            type: 'null',
        });
        Object.freeze(this);
    }

    generateValue(context) {
        return null;
    }
}
