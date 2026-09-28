/**
 * AbstractValue — Complete abstract semantic representation of a variable or expression.
 */

import { TypeSet } from './TypeSet.js';
import { ValueSet } from './ValueSet.js';
import { Nullability, NULLABILITY } from './Nullability.js';
import { AbstractType, TYPE_KINDS } from './AbstractType.js';

export const VALUE_CONFIDENCE = Object.freeze({
    STATIC_GUARANTEE: 'STATIC_GUARANTEE',
    STATIC_INFERENCE: 'STATIC_INFERENCE',
    RUNTIME_OBSERVATION: 'RUNTIME_OBSERVATION',
    HEURISTIC: 'HEURISTIC',
    UNKNOWN: 'UNKNOWN',
});

export class AbstractValue {
    /**
     * @param {object} [params]
     * @param {TypeSet|Array} [params.typeSet]
     * @param {string} [params.nullability=NULLABILITY.UNKNOWN]
     * @param {ValueSet|Array} [params.constants]
     * @param {import('./CollectionShape.js').CollectionShape|import('./ObjectShape.js').ObjectShape|null} [params.shape=null]
     * @param {Set<string>|Array<string>} [params.objectIds]
     * @param {string} [params.confidence=VALUE_CONFIDENCE.STATIC_INFERENCE]
     * @param {Array<object>} [params.provenance=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        typeSet = null,
        nullability = NULLABILITY.UNKNOWN,
        constants = null,
        shape = null,
        objectIds = [],
        confidence = VALUE_CONFIDENCE.STATIC_INFERENCE,
        provenance = [],
        metadata = {},
    } = {}) {
        this.typeSet = typeSet instanceof TypeSet ? typeSet : new TypeSet(typeSet || [AbstractType.unknown()]);
        this.nullability = nullability;
        this.constants = constants instanceof ValueSet ? constants : new ValueSet(constants || []);
        this.shape = shape;
        this.objectIds = new Set(objectIds);
        this.confidence = confidence;
        this.provenance = Array.isArray(provenance) ? provenance : [];
        this.metadata = Object.freeze({ ...metadata });
    }

    // Static constructors
    static unknown() {
        return new AbstractValue({
            typeSet: [AbstractType.unknown()],
            nullability: NULLABILITY.UNKNOWN,
            confidence: VALUE_CONFIDENCE.UNKNOWN,
        });
    }

    static fromType(type, confidence = VALUE_CONFIDENCE.STATIC_INFERENCE) {
        const t = type instanceof AbstractType ? type : new AbstractType(type);
        const nullability = t.kind === TYPE_KINDS.NONE ? NULLABILITY.NULL : NULLABILITY.NON_NULL;
        return new AbstractValue({
            typeSet: [t],
            nullability,
            confidence,
        });
    }

    static fromConstant(constantVal, confidence = VALUE_CONFIDENCE.STATIC_GUARANTEE) {
        let t = AbstractType.unknown();
        let nullability = NULLABILITY.NON_NULL;

        if (constantVal.type === 'int') t = AbstractType.int();
        else if (constantVal.type === 'float') t = AbstractType.float();
        else if (constantVal.type === 'string') t = AbstractType.string();
        else if (constantVal.type === 'bool') t = AbstractType.bool();
        else if (constantVal.type === 'none') {
            t = AbstractType.none();
            nullability = NULLABILITY.NULL;
        }

        return new AbstractValue({
            typeSet: [t],
            nullability,
            constants: [constantVal],
            confidence,
        });
    }

    join(other) {
        if (!other || !(other instanceof AbstractValue)) return this;

        const joinedTypeSet = this.typeSet.union(other.typeSet);
        const joinedNullability = Nullability.join(this.nullability, other.nullability);
        const joinedConstants = this.constants.union(other.constants);
        const joinedShape = (this.shape && other.shape && this.shape.join) ? this.shape.join(other.shape) : (this.shape || other.shape);
        const joinedObjectIds = new Set([...this.objectIds, ...other.objectIds]);

        return new AbstractValue({
            typeSet: joinedTypeSet,
            nullability: joinedNullability,
            constants: joinedConstants.size <= 8 ? joinedConstants : new ValueSet(), // Widen if too many constants
            shape: joinedShape,
            objectIds: joinedObjectIds,
            confidence: (this.confidence === other.confidence) ? this.confidence : VALUE_CONFIDENCE.STATIC_INFERENCE,
            provenance: [...this.provenance, ...other.provenance],
        });
    }

    isConstant() {
        return this.constants.size === 1;
    }

    getConstant() {
        return this.isConstant() ? this.constants.toArray()[0] : null;
    }

    toString() {
        const typeStr = this.typeSet.toString();
        if (this.isConstant()) {
            return `${typeStr} (constant ${this.getConstant().raw})`;
        }
        if (this.constants.size > 1) {
            return `${typeStr} in ${this.constants.toString()}`;
        }
        return typeStr;
    }

    toJSON() {
        return {
            typeSet: this.typeSet.toJSON(),
            nullability: this.nullability,
            constants: this.constants.toJSON(),
            shape: this.shape && this.shape.toJSON ? this.shape.toJSON() : this.shape,
            objectIds: Array.from(this.objectIds),
            confidence: this.confidence,
            provenance: this.provenance,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return AbstractValue.unknown();
        return new AbstractValue({
            typeSet: TypeSet.fromJSON(json.typeSet),
            nullability: json.nullability,
            constants: ValueSet.fromJSON(json.constants),
            shape: json.shape,
            objectIds: json.objectIds,
            confidence: json.confidence,
            provenance: json.provenance,
            metadata: json.metadata,
        });
    }
}
