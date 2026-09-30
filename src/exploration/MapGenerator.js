/**
 * MapGenerator — Generates key-value maps/dictionaries.
 */

import { Generator } from './Generator.js';
import { StringGenerator } from './StringGenerator.js';
import { IntegerGenerator } from './IntegerGenerator.js';

export class MapGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'MapGenerator',
            type: 'map',
        });
        this.keyGenerator = params.keyGenerator || new StringGenerator({ minLength: 1, maxLength: 5 });
        this.valueGenerator = params.valueGenerator || new IntegerGenerator({ min: 0, max: 100 });
        this.minSize = params.minSize !== undefined ? Number(params.minSize) : 0;
        this.maxSize = params.maxSize !== undefined ? Number(params.maxSize) : 5;
        Object.freeze(this);
    }

    generateValue(context) {
        const size = this.minSize + Math.floor(context.random() * (this.maxSize - this.minSize + 1));
        const obj = {};
        for (let i = 0; i < size; i++) {
            const k = String(this.keyGenerator.generateValue(context.next(i * 2 + 1)));
            const v = this.valueGenerator.generateValue(context.next(i * 2 + 2));
            obj[k] = v;
        }
        return this.asObject ? obj : new Map(Object.entries(obj));
    }
}
