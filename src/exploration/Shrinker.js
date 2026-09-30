/**
 * Shrinker — Master dispatch shrinker routing inputs to type-specific minimizers.
 */

import { NumericShrinker } from './NumericShrinker.js';
import { CollectionShrinker } from './CollectionShrinker.js';
import { StringShrinker } from './StringShrinker.js';
import { StructuralShrinker } from './StructuralShrinker.js';
import { ShrinkResult } from './ShrinkResult.js';

export class Shrinker {
    /**
     * @param {any} input
     * @param {Function} failurePredicate
     * @returns {ShrinkResult}
     */
    static shrink(input, failurePredicate) {
        if (typeof input === 'number') {
            return NumericShrinker.shrink(input, failurePredicate);
        }
        if (Array.isArray(input)) {
            return CollectionShrinker.shrink(input, failurePredicate);
        }
        if (typeof input === 'string') {
            return StringShrinker.shrink(input, failurePredicate);
        }
        if (input && typeof input === 'object') {
            return StructuralShrinker.shrink(input, failurePredicate);
        }
        return new ShrinkResult({ originalInput: input, minimalInput: input, shrinkSteps: 0 });
    }
}
