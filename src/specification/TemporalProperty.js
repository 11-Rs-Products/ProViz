/**
 * TemporalProperty — Specification of temporal orderings (e.g. A before B, eventually B).
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class TemporalProperty extends Specification {
    /**
     * @param {object} params
     * @param {string} params.pattern - BEFORE, EVENTUALLY, NEVER_AFTER, PERSISTS_UNTIL
     * @param {string} params.eventA
     * @param {string} [params.eventB]
     * @param {string} [params.condition]
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.TEMPORAL_PROPERTY,
        });
        this.pattern = params.pattern || 'BEFORE';
        this.eventA = params.eventA || '';
        this.eventB = params.eventB || '';
        this.condition = params.condition || '';
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            pattern: this.pattern,
            eventA: this.eventA,
            eventB: this.eventB,
            condition: this.condition,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TemporalProperty(json);
    }
}
