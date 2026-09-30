import { ShrinkResult } from './ShrinkResult.js';

export class StringShrinker {
    /**
     * @param {string} str
     * @param {Function} failurePredicate
     * @returns {ShrinkResult}
     */
    static shrink(str, failurePredicate) {
        if (typeof str !== 'string') {
            return new ShrinkResult({ originalInput: str, minimalInput: str });
        }

        let current = str;
        let steps = 0;

        // Try empty string
        if (current.length > 0 && failurePredicate('')) {
            return new ShrinkResult({ originalInput: str, minimalInput: '', shrinkSteps: 1 });
        }

        // Binary sub-slice search for smallest matching segment
        let progress = true;
        while (progress && current.length > 1 && steps < 500) {
            progress = false;

            // Try prefix removal / suffix removal in chunks
            const half = Math.max(1, Math.floor(current.length / 2));
            const left = current.slice(0, half);
            const right = current.slice(half);

            if (failurePredicate(left)) {
                current = left;
                steps++;
                progress = true;
                continue;
            }
            if (failurePredicate(right)) {
                current = right;
                steps++;
                progress = true;
                continue;
            }

            // Try removing character by character
            for (let i = 0; i < current.length; i++) {
                const candidate = current.slice(0, i) + current.slice(i + 1);
                if (failurePredicate(candidate)) {
                    current = candidate;
                    steps++;
                    progress = true;
                    break;
                }
            }
        }

        return new ShrinkResult({
            originalInput: str,
            minimalInput: current,
            shrinkSteps: steps,
        });
    }
}
