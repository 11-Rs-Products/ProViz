/**
 * TypeJoin — Deterministic lattice join operations for AbstractTypes and AbstractValues.
 */

import { AbstractType, TYPE_KINDS } from './AbstractType.js';
import { TypeSet } from './TypeSet.js';

export class TypeJoin {
    /**
     * Joins two abstract types along the subtyping/union lattice.
     */
    static joinTypes(a, b) {
        if (!a) return b || AbstractType.unknown();
        if (!b) return a || AbstractType.unknown();
        if (a.equals(b)) return a;

        // None ⊔ T = T with None in TypeSet
        if (a.kind === TYPE_KINDS.UNKNOWN || b.kind === TYPE_KINDS.UNKNOWN) {
            return AbstractType.unknown();
        }

        // Int + Float -> Float or Union
        if ((a.kind === TYPE_KINDS.INT && b.kind === TYPE_KINDS.FLOAT) || (a.kind === TYPE_KINDS.FLOAT && b.kind === TYPE_KINDS.INT)) {
            return AbstractType.float();
        }

        return new AbstractType({
            kind: TYPE_KINDS.UNKNOWN,
            name: `${a.toString()} | ${b.toString()}`,
            parameters: [a, b],
        });
    }

    /**
     * Joins two TypeSets.
     */
    static joinTypeSets(setA, setB) {
        if (!setA) return setB || new TypeSet();
        if (!setB) return setA || new TypeSet();
        return setA.union(setB);
    }
}
