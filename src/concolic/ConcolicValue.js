/**
 * ConcolicValue — Encapsulates a dual concrete and symbolic value pair with provenance metadata.
 */

export class ConcolicValue {
    /**
     * @param {object} params
     * @param {*} params.concreteValue
     * @param {import('../symbolic/SymbolicExpression.js').SymbolicExpression|object|string|null} [params.symbolicValue=null]
     * @param {string|null} [params.valueKind='UNKNOWN']
     * @param {string|null} [params.objectId=null]
     * @param {object|null} [params.sourceLocation=null]
     * @param {string|null} [params.ssaId=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        concreteValue,
        symbolicValue = null,
        valueKind = 'UNKNOWN',
        objectId = null,
        sourceLocation = null,
        ssaId = null,
        metadata = {},
    } = {}) {
        this.concreteValue = concreteValue;
        this.symbolicValue = symbolicValue;
        this.valueKind = valueKind;
        this.objectId = objectId;
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.ssaId = ssaId;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            concreteValue: this.concreteValue,
            symbolicValue: this.symbolicValue?.toJSON ? this.symbolicValue.toJSON() : this.symbolicValue,
            valueKind: this.valueKind,
            objectId: this.objectId,
            sourceLocation: this.sourceLocation,
            ssaId: this.ssaId,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ConcolicValue(json);
    }
}
