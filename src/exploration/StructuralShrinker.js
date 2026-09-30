/**
 * StructuralShrinker — Prunes object properties and dictionary keys while preserving failure predicates.
 */

import { ShrinkResult } from './ShrinkResult.js';

export class StructuralShrinker {
    /**
     * @param {object} obj
     * @param {Function} failurePredicate
     * @returns {ShrinkResult}
     */
    static shrink(obj, failurePredicate) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return new ShrinkResult({ originalInput: obj, minimalInput: obj });
        }

        let current = { ...obj };
        let steps = 0;
        const keys = Object.keys(current);

        for (const k of keys) {
            const candidate = { ...current };
            delete candidate[k];
            if (failurePredicate(candidate)) {
                current = candidate;
                steps++;
            }
        }

        return new ShrinkResult({
            originalInput: obj,
            minimalInput: current,
            shrinkSteps: steps,
        });
    }
}
