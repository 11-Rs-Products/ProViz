/**
 * ShrinkResult — Output summary of counterexample minimization.
 */

export class ShrinkResult {
    /**
     * @param {object} params
     * @param {any} params.originalInput
     * @param {any} params.minimalInput
     * @param {number} [params.shrinkSteps=0]
     * @param {Array<string>} [params.removedStructure=[]]
     * @param {Array<string>} [params.preservedProperties=[]]
     * @param {string} [params.confidence='PROVEN']
     */
    constructor({
        originalInput,
        minimalInput,
        shrinkSteps = 0,
        removedStructure = [],
        preservedProperties = [],
        confidence = 'PROVEN',
    } = {}) {
        this.originalInput = originalInput;
        this.minimalInput = minimalInput;
        this.shrinkSteps = Number(shrinkSteps);
        this.removedStructure = Object.freeze([...removedStructure]);
        this.preservedProperties = Object.freeze([...preservedProperties]);
        this.confidence = String(confidence);
        Object.freeze(this);
    }

    toJSON() {
        return {
            originalInput: this.originalInput,
            minimalInput: this.minimalInput,
            shrinkSteps: this.shrinkSteps,
            removedStructure: this.removedStructure,
            preservedProperties: this.preservedProperties,
            confidence: this.confidence,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ShrinkResult(json);
    }
}
