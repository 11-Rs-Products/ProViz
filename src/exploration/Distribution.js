/**
 * Distribution — Abstract base class for deterministic generation sampling distributions.
 */

export class Distribution {
    /**
     * @param {object} [params]
     * @param {string} [params.name='Distribution']
     */
    constructor({ name = 'Distribution' } = {}) {
        this.name = name;
        if (new.target === Distribution) {
            Object.freeze(this);
        }
    }

    /**
     * Samples an index from a set of size N given a random float in [0, 1).
     * @param {number} size
     * @param {number} randomVal
     * @returns {number}
     */
    sampleIndex(size, randomVal) {
        throw new Error('sampleIndex must be implemented by subclass');
    }
}
