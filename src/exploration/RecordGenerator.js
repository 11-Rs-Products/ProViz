/**
 * RecordGenerator — Generates typed record instances.
 */

import { ObjectGenerator } from './ObjectGenerator.js';

export class RecordGenerator extends ObjectGenerator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'RecordGenerator',
            type: 'record',
        });
    }
}
