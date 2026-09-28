/**
 * TypeConstraint — Explicit constraint on type/shape possibilities.
 */

export const CONSTRAINT_KINDS = Object.freeze({
    NUMERIC: 'NUMERIC',
    ITERABLE: 'ITERABLE',
    COMPARABLE: 'COMPARABLE',
    HAS_ATTRIBUTE: 'HAS_ATTRIBUTE',
    CALLABLE: 'CALLABLE',
    INDEXABLE: 'INDEXABLE',
    EQUALS_TYPE: 'EQUALS_TYPE',
    SUBTYPE_OF: 'SUBTYPE_OF',
    NON_NULL: 'NON_NULL',
});

export class TypeConstraint {
    /**
     * @param {object} params
     * @param {string} params.kind
     * @param {string} params.subject - Variable name or SSA ID
     * @param {*} [params.target=null]
     * @param {object|null} [params.sourceLocation=null]
     * @param {string} [params.reason='']
     * @param {object} [params.metadata={}]
     */
    constructor({
        kind = CONSTRAINT_KINDS.NUMERIC,
        subject = '',
        target = null,
        sourceLocation = null,
        reason = '',
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.subject = subject;
        this.target = target;
        this.sourceLocation = sourceLocation;
        this.reason = reason;
        this.metadata = Object.freeze({ ...metadata });
    }

    toString() {
        return `[Constraint ${this.kind}] ${this.subject} ${this.target ? `-> ${this.target}` : ''} (${this.reason})`;
    }

    toJSON() {
        return {
            kind: this.kind,
            subject: this.subject,
            target: this.target,
            sourceLocation: this.sourceLocation,
            reason: this.reason,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TypeConstraint(json);
    }
}
