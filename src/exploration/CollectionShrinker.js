/**
 * CollectionShrinker — Shrinks arrays and collections by dropping elements and sub-slices.
 */

import { ShrinkResult } from './ShrinkResult.js';

export class CollectionShrinker {
    /**
     * @param {Array<any>} array
     * @param {Function} failurePredicate - (arr) => boolean
     * @returns {ShrinkResult}
     */
    static shrink(array, failurePredicate) {
        if (!Array.isArray(array)) {
            return new ShrinkResult({ originalInput: array, minimalInput: array });
        }

        let current = [...array];
        let steps = 0;

        // Try empty array
        if (current.length > 0 && failurePredicate([])) {
            return new ShrinkResult({
                originalInput: array,
                minimalInput: [],
                shrinkSteps: 1,
                removedStructure: ['all elements'],
            });
        }

        // Try single elements
        for (let i = 0; i < current.length; i++) {
            if (failurePredicate([current[i]])) {
                return new ShrinkResult({
                    originalInput: array,
                    minimalInput: [current[i]],
                    shrinkSteps: steps + 1,
                });
            }
        }

        // Greedy element removal
        let changed = true;
        while (changed && current.length > 1 && steps < 50) {
            changed = false;
            for (let i = 0; i < current.length; i++) {
                const candidate = current.slice(0, i).concat(current.slice(i + 1));
                if (failurePredicate(candidate)) {
                    current = candidate;
                    steps++;
                    changed = true;
                    break;
                }
            }
        }

        return new ShrinkResult({
            originalInput: array,
            minimalInput: current,
            shrinkSteps: steps,
        });
    }
}
