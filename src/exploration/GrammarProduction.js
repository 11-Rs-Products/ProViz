/**
 * GrammarProduction — Single production alternative composed of symbols or string tokens.
 */

export class GrammarProduction {
    /**
     * @param {object} params
     * @param {Array<string>} params.elements
     * @param {number} [params.weight=1.0]
     */
    constructor({ elements = [], weight = 1.0 } = {}) {
        this.elements = Object.freeze([...elements]);
        this.weight = Number(weight) || 1.0;
        Object.freeze(this);
    }

    toJSON() {
        return {
            elements: this.elements,
            weight: this.weight,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new GrammarProduction(json);
    }
}
