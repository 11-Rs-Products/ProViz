/**
 * BehavioralProperty — General behavioral property specifying an expected relation between input/state and result.
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class BehavioralProperty extends Specification {
    /**
     * @param {object} params
     * @param {string} [params.propertyType]
     * @param {string} [params.predicate]
     * @param {object} [params.context={}]
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: params.kind || SpecificationKind.RETURN_PROPERTY,
        });
        this.propertyType = params.propertyType || 'GENERIC';
        this.predicate = params.predicate || '';
        this.context = Object.freeze({ ...(params.context || {}) });
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            propertyType: this.propertyType,
            predicate: this.predicate,
            context: this.context,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BehavioralProperty(json);
    }
}
