/**
 * ExceptionProperty — Specification of exception raising conditions and types.
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class ExceptionProperty extends Specification {
    /**
     * @param {object} params
     * @param {string} params.exceptionType
     * @param {string} [params.condition='']
     * @param {string|null} [params.exceptionLocation=null]
     * @param {boolean} [params.shouldRaise=true]
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.EXCEPTION_PROPERTY,
        });
        this.exceptionType = params.exceptionType || 'Exception';
        this.condition = params.condition || '';
        this.exceptionLocation = params.exceptionLocation || null;
        this.shouldRaise = params.shouldRaise !== false;
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            exceptionType: this.exceptionType,
            condition: this.condition,
            exceptionLocation: this.exceptionLocation,
            shouldRaise: this.shouldRaise,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExceptionProperty(json);
    }
}
