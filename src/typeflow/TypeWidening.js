/**
 * TypeWidening — Prevents infinite abstract state expansion in loops.
 */

import { ValueSet } from './ValueSet.js';

export class TypeWidening {
    /**
     * Widens an AbstractValue if iteration count or constant count exceeds limits.
     *
     * @param {import('./AbstractValue.js').AbstractValue} abstractVal
     * @param {number} [maxConstants=4]
     * @returns {import('./AbstractValue.js').AbstractValue}
     */
    static widen(abstractVal, maxConstants = 4) {
        if (!abstractVal) return abstractVal;

        // If constant set grows too large, drop constants and preserve broad types
        if (abstractVal.constants.size > maxConstants) {
            abstractVal.constants = new ValueSet();
        }

        // If collection shape has excessive element combinations, collapse
        if (abstractVal.shape && abstractVal.shape.elementTypes && abstractVal.shape.elementTypes.size > 8) {
            abstractVal.shape.fixedLength = null;
            abstractVal.shape.lengthRange = null;
        }

        return abstractVal;
    }
}
