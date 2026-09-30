/**
 * ListGenerator — Generates Python-style list structures.
 */

import { ArrayGenerator } from './ArrayGenerator.js';

export class ListGenerator extends ArrayGenerator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'ListGenerator',
            type: 'list',
        });
    }
}
