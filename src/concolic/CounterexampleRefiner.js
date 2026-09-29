/**
 * CounterexampleRefiner — Classifies counterexample reproduction status and refines invalid counterexamples.
 */

export const COUNTEREXAMPLE_CLASSIFICATIONS = Object.freeze({
    CONFIRMED: 'CONFIRMED',
    REJECTED: 'REJECTED',
    NON_REPRODUCIBLE: 'NON_REPRODUCIBLE',
    MODEL_MISMATCH: 'MODEL_MISMATCH',
    UNSUPPORTED: 'UNSUPPORTED',
});

export class CounterexampleRefiner {
    /**
     * Classify counterexample execution outcome.
     * @param {import('../symbolic/Counterexample.js').Counterexample} counterexample
     * @param {import('../testing/TestResult.js').TestResult} testResult
     * @returns {object} - { classification: string, refined: boolean }
     */
    static classify(counterexample, testResult) {
        if (!counterexample || !testResult) {
            return { classification: COUNTEREXAMPLE_CLASSIFICATIONS.NON_REPRODUCIBLE, refined: false };
        }

        if (testResult.isSuccess()) {
            return { classification: COUNTEREXAMPLE_CLASSIFICATIONS.CONFIRMED, refined: false };
        }

        if (testResult.status === 'MISMATCH') {
            return { classification: COUNTEREXAMPLE_CLASSIFICATIONS.MODEL_MISMATCH, refined: true };
        }

        return { classification: COUNTEREXAMPLE_CLASSIFICATIONS.REJECTED, refined: false };
    }
}
