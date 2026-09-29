/**
 * PropertyConstraint — Composable, immutable constraints on program variables and expressions.
 */

export const CONSTRAINT_KINDS = Object.freeze({
    EQUALS: 'equals',
    NOT_EQUALS: 'notEquals',
    LESS_THAN: 'lessThan',
    LESS_OR_EQUAL: 'lessOrEqual',
    GREATER_THAN: 'greaterThan',
    GREATER_OR_EQUAL: 'greaterOrEqual',
    IN_RANGE: 'inRange',
    TYPE_IS: 'typeIs',
    TYPE_MAY_BE: 'typeMayBe',
    NON_NULL: 'nonNull',
    NULL: 'null',
    TRUTHY: 'truthy',
    FALSY: 'falsy',
    HAS_ATTRIBUTE: 'hasAttribute',
    INDEX_IN_BOUNDS: 'indexInBounds',
    CALLABLE: 'callable',
    REACHABLE: 'reachable',
    UNREACHABLE: 'unreachable',
});

export class PropertyConstraint {
    /**
     * @param {object} params
     * @param {string} params.kind - CONSTRAINT_KINDS member
     * @param {string} params.subject - Variable or SSA identifier
     * @param {any} [params.target] - Target value, type, range, or attribute
     * @param {object} [params.sourceLocation]
     * @param {string} [params.reason]
     * @param {object} [params.metadata]
     */
    constructor({
        kind,
        subject,
        target = null,
        sourceLocation = null,
        reason = '',
        metadata = {},
    }) {
        this.kind = kind;
        this.subject = String(subject || '');
        this.target = target;
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.reason = String(reason || '');
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    static equals(subject, value, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.EQUALS, subject, target: value, reason });
    }

    static notEquals(subject, value, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.NOT_EQUALS, subject, target: value, reason });
    }

    static lessThan(subject, value, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.LESS_THAN, subject, target: value, reason });
    }

    static lessOrEqual(subject, value, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.LESS_OR_EQUAL, subject, target: value, reason });
    }

    static greaterThan(subject, value, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.GREATER_THAN, subject, target: value, reason });
    }

    static greaterOrEqual(subject, value, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.GREATER_OR_EQUAL, subject, target: value, reason });
    }

    static inRange(subject, min, max, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.IN_RANGE, subject, target: { min, max }, reason });
    }

    static typeIs(subject, typeName, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.TYPE_IS, subject, target: typeName, reason });
    }

    static nonNull(subject, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.NON_NULL, subject, target: null, reason });
    }

    static null(subject, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.NULL, subject, target: null, reason });
    }

    static truthy(subject, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.TRUTHY, subject, target: true, reason });
    }

    static falsy(subject, reason = '') {
        return new PropertyConstraint({ kind: CONSTRAINT_KINDS.FALSY, subject, target: false, reason });
    }

    equals(other) {
        if (!other || !(other instanceof PropertyConstraint)) return false;
        return (
            this.kind === other.kind &&
            this.subject === other.subject &&
            JSON.stringify(this.target) === JSON.stringify(other.target)
        );
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
        return new PropertyConstraint(json);
    }
}
