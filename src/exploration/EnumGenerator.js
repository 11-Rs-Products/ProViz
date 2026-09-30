/**
 * EnumGenerator — Generates choices from an explicit set of enumerated values.
 */

import { Generator } from './Generator.js';

export class EnumGenerator extends Generator {
    /**
     * @param {object} params
     * @param {Array<any>} params.values
     */
    constructor(params = {}) {
        super({
            ...params,
            name: 'EnumGenerator',
            type: 'enum',
        });
        this.values = Object.freeze([...(params.values || [])]);
        Object.freeze(this);
    }

    generateValue(context) {
        if (this.values.length === 0) return null;
        const idx = (context.step < this.values.length)
            ? context.step
            : Math.floor(context.random() * this.values.length);
        return this.values[idx];
    }
}
