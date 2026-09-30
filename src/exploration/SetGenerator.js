/**
 * SetGenerator — Generates arrays/sets with unique elements.
 */

import { Generator } from './Generator.js';
import { IntegerGenerator } from './IntegerGenerator.js';

export class SetGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'SetGenerator',
            type: 'set',
        });
        this.elementGenerator = params.elementGenerator || new IntegerGenerator({ min: 1, max: 50 });
        this.minSize = params.minSize !== undefined ? Number(params.minSize) : 0;
        this.maxSize = params.maxSize !== undefined ? Number(params.maxSize) : 10;
        Object.freeze(this);
    }

    generateValue(context) {
        const targetSize = this.minSize + Math.floor(context.random() * (this.maxSize - this.minSize + 1));
        const set = new Set();
        let attempts = 0;
        while (set.size < targetSize && attempts < targetSize * 5) {
            set.add(this.elementGenerator.generateValue(context.next(attempts + 1)));
            attempts++;
        }
        return this.asArray ? [...set] : set;
    }
}
