/**
 * Nullability — Lattice of nullability states for abstract values.
 */

export const NULLABILITY = Object.freeze({
    NON_NULL: 'NON_NULL',
    NULL: 'NULL',
    MAYBE_NULL: 'MAYBE_NULL',
    UNKNOWN: 'UNKNOWN',
});

export class Nullability {
    static isNull(nullability) {
        return nullability === NULLABILITY.NULL;
    }

    static isNonNull(nullability) {
        return nullability === NULLABILITY.NON_NULL;
    }

    static isMaybeNull(nullability) {
        return nullability === NULLABILITY.MAYBE_NULL || nullability === NULLABILITY.UNKNOWN;
    }

    /**
     * Joins two nullability states along the lattice:
     * NON_NULL ⊔ NULL = MAYBE_NULL
     * NON_NULL ⊔ NON_NULL = NON_NULL
     * NULL ⊔ NULL = NULL
     * ANY ⊔ UNKNOWN = UNKNOWN
     */
    static join(a, b) {
        if (!a) return b || NULLABILITY.UNKNOWN;
        if (!b) return a || NULLABILITY.UNKNOWN;
        if (a === b) return a;
        if (a === NULLABILITY.UNKNOWN || b === NULLABILITY.UNKNOWN) return NULLABILITY.UNKNOWN;
        if ((a === NULLABILITY.NON_NULL && b === NULLABILITY.NULL) || (a === NULLABILITY.NULL && b === NULLABILITY.NON_NULL)) {
            return NULLABILITY.MAYBE_NULL;
        }
        if (a === NULLABILITY.MAYBE_NULL || b === NULLABILITY.MAYBE_NULL) {
            return NULLABILITY.MAYBE_NULL;
        }
        return NULLABILITY.UNKNOWN;
    }

    static meet(a, b) {
        if (!a || !b) return NULLABILITY.UNKNOWN;
        if (a === b) return a;
        if (a === NULLABILITY.UNKNOWN) return b;
        if (b === NULLABILITY.UNKNOWN) return a;
        if (a === NULLABILITY.MAYBE_NULL) return b;
        if (b === NULLABILITY.MAYBE_NULL) return a;
        return NULLABILITY.UNKNOWN;
    }
}
