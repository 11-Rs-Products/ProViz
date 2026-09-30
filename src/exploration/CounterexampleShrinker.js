/**
 * CounterexampleShrinker — Minimizes failing test inputs and counterexamples for findings and reports.
 */

import { Shrinker } from './Shrinker.js';

export class CounterexampleShrinker {
    /**
     * @param {any} failingInput
     * @param {Function} executor - (input) => ({ returnValue, exception })
     * @param {Function} [isFailingOutcome] - (outcome) => boolean
     * @returns {ShrinkResult}
     */
    static shrinkCounterexample(failingInput, executor, isFailingOutcome = null) {
        const failurePred = (inp) => {
            try {
                const res = executor(inp);
                if (isFailingOutcome) return isFailingOutcome(res);
                return Boolean(res?.exception);
            } catch (err) {
                return true;
            }
        };

        return Shrinker.shrink(failingInput, failurePred);
    }
}
