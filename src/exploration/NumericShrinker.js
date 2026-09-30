/**
 * NumericShrinker — Shrinks numeric values towards zero while preserving failure predicates.
 */

import { ShrinkResult } from './ShrinkResult.js';

export class NumericShrinker {
    /**
     * @param {number} value
     * @param {Function} failurePredicate - (val) => boolean
     * @returns {ShrinkResult}
     */
    static shrink(value, failurePredicate) {
        let current = value;
        let steps = 0;

        if (typeof current !== 'number' || isNaN(current)) {
            return new ShrinkResult({ originalInput: value, minimalInput: value });
        }

        // Try 0 first
        if (current !== 0 && failurePredicate(0)) {
            return new ShrinkResult({ originalInput: value, minimalInput: 0, shrinkSteps: 1 });
        }

        // Try 1 or -1
        if (current > 1 && failurePredicate(1)) {
            return new ShrinkResult({ originalInput: value, minimalInput: 1, shrinkSteps: 2 });
        }
        if (current < -1 && failurePredicate(-1)) {
            return new ShrinkResult({ originalInput: value, minimalInput: -1, shrinkSteps: 2 });
        }

        // Bisection towards 0
        while (Math.abs(current) > 1 && steps < 50) {
            const next = current > 0 ? Math.floor(current / 2) : Math.ceil(current / 2);
            if (next === current) break;
            if (failurePredicate(next)) {
                current = next;
                steps++;
            } else {
                // Try decrement
                const dec = current > 0 ? current - 1 : current + 1;
                if (dec !== current && failurePredicate(dec)) {
                    current = dec;
                    steps++;
                } else {
                    break;
                }
            }
        }

        return new ShrinkResult({
            originalInput: value,
            minimalInput: current,
            shrinkSteps: steps,
        });
    }
}
