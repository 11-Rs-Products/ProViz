/**
 * PropertyState — Four-state proof lattice for property verification.
 */

export const PROPERTY_STATES = Object.freeze({
    PROVEN: 'PROVEN',
    DISPROVEN: 'DISPROVEN',
    POSSIBLE: 'POSSIBLE',
    UNKNOWN: 'UNKNOWN',
});

export class PropertyState {
    /**
     * Join two property states in the proof lattice.
     * @param {string} a
     * @param {string} b
     * @returns {string}
     */
    static join(a, b) {
        if (a === b) return a;
        if (a === PROPERTY_STATES.UNKNOWN || b === PROPERTY_STATES.UNKNOWN) {
            return PROPERTY_STATES.UNKNOWN;
        }
        if (a === PROPERTY_STATES.POSSIBLE || b === PROPERTY_STATES.POSSIBLE) {
            return PROPERTY_STATES.POSSIBLE;
        }
        if ((a === PROPERTY_STATES.PROVEN && b === PROPERTY_STATES.DISPROVEN) ||
            (a === PROPERTY_STATES.DISPROVEN && b === PROPERTY_STATES.PROVEN)) {
            return PROPERTY_STATES.POSSIBLE;
        }
        return PROPERTY_STATES.UNKNOWN;
    }

    /**
     * Invert a property state (e.g. for negation).
     * @param {string} state
     * @returns {string}
     */
    static negate(state) {
        if (state === PROPERTY_STATES.PROVEN) return PROPERTY_STATES.DISPROVEN;
        if (state === PROPERTY_STATES.DISPROVEN) return PROPERTY_STATES.PROVEN;
        return state;
    }
}
