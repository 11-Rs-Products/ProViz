/**
 * CollectionProperty — Specification of collection size, non-emptiness, ordering or element shape.
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class CollectionProperty extends Specification {
    /**
     * @param {object} params
     * @param {string} params.targetCollection
     * @param {string} params.propertyType - SIZE_NON_NEGATIVE, ORDERED, ELEMENT_TYPE, UNIQUE
     * @param {string} [params.condition='']
     * @param {string} [params.elementConstraint='']
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.COLLECTION_PROPERTY,
        });
        this.targetCollection = params.targetCollection || '';
        this.propertyType = params.propertyType || 'SIZE_NON_NEGATIVE';
        this.condition = params.condition || '';
        this.elementConstraint = params.elementConstraint || '';
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            targetCollection: this.targetCollection,
            propertyType: this.propertyType,
            condition: this.condition,
            elementConstraint: this.elementConstraint,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new CollectionProperty(json);
    }
}
