/**
 * ArrayGenerator — Generates bounded arrays of elements using an element generator.
 */

import { Generator } from './Generator.js';
import { IntegerGenerator } from './IntegerGenerator.js';

export class ArrayGenerator extends Generator {
    /**
     * @param {object} params
     * @param {Generator} [params.elementGenerator]
     * @param {number} [params.minLength=0]
     * @param {number} [params.maxLength=10]
     */
    constructor(params = {}) {
        super({
            ...params,
            name: params.name || 'ArrayGenerator',
            type: 'array',
        });
        this.elementGenerator = params.elementGenerator || new IntegerGenerator({ min: 1, max: 20 });
        this.minLength = params.minLength !== undefined ? Number(params.minLength) : 0;
        this.maxLength = params.maxLength !== undefined ? Number(params.maxLength) : 10;
        Object.freeze(this);
    }

    generateValue(context) {
        if (context.step === 0 && this.minLength === 0) return [];
        if (context.step === 1 && this.minLength <= 1 && this.maxLength >= 1) {
            return [this.elementGenerator.generateValue(context.next(1))];
        }

        const len = this.minLength + Math.floor(context.random() * (this.maxLength - this.minLength + 1));
        const arr = [];
        for (let i = 0; i < len; i++) {
            arr.push(this.elementGenerator.generateValue(context.next(i + 1)));
        }
        return arr;
    }
}
