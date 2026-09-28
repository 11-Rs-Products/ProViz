/**
 * CollectionShape — Structural metadata for abstract collection containers (list, dict, tuple, set).
 */

import { TypeSet } from './TypeSet.js';

export class CollectionShape {
    /**
     * @param {object} params
     * @param {string} [params.containerType='list']
     * @param {TypeSet|Array} [params.elementTypes]
     * @param {TypeSet|Array} [params.keyTypes]
     * @param {TypeSet|Array} [params.valueTypes]
     * @param {number|null} [params.fixedLength=null]
     * @param {Array<number>|null} [params.lengthRange=null]
     * @param {Array} [params.tupleElements=null]
     */
    constructor({
        containerType = 'list',
        elementTypes = null,
        keyTypes = null,
        valueTypes = null,
        fixedLength = null,
        lengthRange = null,
        tupleElements = null,
    } = {}) {
        this.containerType = containerType;
        this.elementTypes = elementTypes instanceof TypeSet ? elementTypes : new TypeSet(elementTypes || []);
        this.keyTypes = keyTypes instanceof TypeSet ? keyTypes : new TypeSet(keyTypes || []);
        this.valueTypes = valueTypes instanceof TypeSet ? valueTypes : new TypeSet(valueTypes || []);
        this.fixedLength = fixedLength;
        this.lengthRange = lengthRange;
        this.tupleElements = Array.isArray(tupleElements) ? tupleElements : null;
    }

    join(other) {
        if (!other || !(other instanceof CollectionShape)) return this;
        return new CollectionShape({
            containerType: this.containerType === other.containerType ? this.containerType : 'container',
            elementTypes: this.elementTypes.union(other.elementTypes),
            keyTypes: this.keyTypes.union(other.keyTypes),
            valueTypes: this.valueTypes.union(other.valueTypes),
            fixedLength: this.fixedLength === other.fixedLength ? this.fixedLength : null,
            lengthRange: null,
            tupleElements: null,
        });
    }

    toString() {
        if (this.containerType === 'dict') {
            return `dict[${this.keyTypes.toString()}, ${this.valueTypes.toString()}]`;
        }
        if (this.containerType === 'tuple' && this.tupleElements) {
            return `tuple[${this.tupleElements.map(e => e.toString()).join(', ')}]`;
        }
        return `${this.containerType}[${this.elementTypes.toString()}]`;
    }

    toJSON() {
        return {
            containerType: this.containerType,
            elementTypes: this.elementTypes.toJSON(),
            keyTypes: this.keyTypes.toJSON(),
            valueTypes: this.valueTypes.toJSON(),
            fixedLength: this.fixedLength,
            lengthRange: this.lengthRange,
            tupleElements: this.tupleElements,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new CollectionShape({
            containerType: json.containerType,
            elementTypes: TypeSet.fromJSON(json.elementTypes),
            keyTypes: TypeSet.fromJSON(json.keyTypes),
            valueTypes: TypeSet.fromJSON(json.valueTypes),
            fixedLength: json.fixedLength,
            lengthRange: json.lengthRange,
            tupleElements: json.tupleElements,
        });
    }
}
