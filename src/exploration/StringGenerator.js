/**
 * StringGenerator — Generates bounded strings with empty, single-character, and alphanumeric variants.
 */

import { Generator } from './Generator.js';

export class StringGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'StringGenerator',
            type: 'string',
        });
        this.minLength = params.minLength !== undefined ? Number(params.minLength) : 0;
        this.maxLength = params.maxLength !== undefined ? Number(params.maxLength) : 20;
        this.charset = params.charset || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        Object.freeze(this);
    }

    generateValue(context) {
        if (context.step === 0 && this.minLength === 0) return '';
        if (context.step === 1) return 'a';
        if (context.step === 2) return 'test';

        const len = this.minLength + Math.floor(context.random() * (this.maxLength - this.minLength + 1));
        let res = '';
        for (let i = 0; i < len; i++) {
            const charIdx = Math.floor(context.random(i + 1) * this.charset.length);
            res += this.charset[charIdx];
        }
        return res;
    }
}
