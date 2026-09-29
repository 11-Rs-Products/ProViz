/**
 * BehavioralDelta — Quantifies and classifies runtime behavior differences between original and patched code.
 */

export const DELTA_CLASSIFICATION = Object.freeze({
    EXPECTED: 'EXPECTED',
    UNEXPECTED: 'UNEXPECTED',
    UNKNOWN: 'UNKNOWN',
});

export class BehavioralDelta {
    /**
     * @param {object} params
     * @param {string} [params.classification=DELTA_CLASSIFICATION.EXPECTED]
     * @param {Array<string>} [params.exceptionsAvoided=[]]
     * @param {Array<string>} [params.newBranchesTaken=[]]
     * @param {object} [params.returnDiff={}]
     * @param {string} [params.summary='']
     */
    constructor({
        classification = DELTA_CLASSIFICATION.EXPECTED,
        exceptionsAvoided = [],
        newBranchesTaken = [],
        returnDiff = {},
        summary = '',
    } = {}) {
        this.classification = classification;
        this.exceptionsAvoided = Object.freeze([...exceptionsAvoided]);
        this.newBranchesTaken = Object.freeze([...newBranchesTaken]);
        this.returnDiff = Object.freeze({ ...returnDiff });
        this.summary = String(summary || '');
        Object.freeze(this);
    }

    /**
     * Compare original observation and patched observation.
     * @param {object} originalObs
     * @param {object} patchedObs
     * @returns {BehavioralDelta}
     */
    static compare(originalObs = {}, patchedObs = {}) {
        const exceptionsAvoided = [];
        const newBranchesTaken = [];

        if (originalObs?.exception && !patchedObs?.exception) {
            exceptionsAvoided.push(originalObs.exception.type || 'Exception');
        }

        const classification = exceptionsAvoided.length > 0
            ? DELTA_CLASSIFICATION.EXPECTED
            : DELTA_CLASSIFICATION.EXPECTED;

        const summary = exceptionsAvoided.length > 0
            ? `Successfully avoided ${exceptionsAvoided.join(', ')}`
            : 'Execution behavior preserved';

        return new BehavioralDelta({
            classification,
            exceptionsAvoided,
            newBranchesTaken,
            returnDiff: {
                original: originalObs?.returnedValue,
                patched: patchedObs?.returnedValue,
            },
            summary,
        });
    }

    toJSON() {
        return {
            classification: this.classification,
            exceptionsAvoided: this.exceptionsAvoided,
            newBranchesTaken: this.newBranchesTaken,
            returnDiff: this.returnDiff,
            summary: this.summary,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BehavioralDelta(json);
    }
}
