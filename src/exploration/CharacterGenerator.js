/**
 * CharacterGenerator — Generates individual characters.
 */

import { Generator } from './Generator.js';

export class CharacterGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'CharacterGenerator',
            type: 'char',
        });
        this.charset = params.alphabet || params.charset || 'abcdefghijklmnopqrstuvwxyz0123456789_';
        Object.freeze(this);
    }

    generateValue(context) {
        const idx = Math.floor(context.random() * this.charset.length);
        return this.charset[idx];
    }
}
