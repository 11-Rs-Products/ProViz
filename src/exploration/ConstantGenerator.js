/**
 * ConstantGenerator — Always generates a fixed constant value.
 */

import { Generator } from './Generator.js';

export class ConstantGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'ConstantGenerator',
            type: 'constant',
        });
        this.constantValue = params.constantValue !== undefined ? params.constantValue : params.value;
        Object.freeze(this);
    }

    generateValue(context) {
        return this.constantValue;
    }
}
