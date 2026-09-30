/**
 * ShrinkCandidate — Represents an intermediate reduced input candidate.
 */

export class ShrinkCandidate {
    /**
     * @param {object} params
     * @param {any} params.value
     * @param {number} [params.step=0]
     * @param {string} [params.strategy='ELEMENT_REMOVAL']
     */
    constructor({ value, step = 0, strategy = 'ELEMENT_REMOVAL' } = {}) {
        this.value = value;
        this.step = Number(step);
        this.strategy = String(strategy);
        Object.freeze(this);
    }
}
