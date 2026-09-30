/**
 * GrammarSymbol — Terminal or non-terminal grammar symbol.
 */

export class GrammarSymbol {
    /**
     * @param {object} params
     * @param {string} params.name
     * @param {boolean} [params.isTerminal=false]
     */
    constructor({ name, isTerminal = false } = {}) {
        this.name = String(name || '');
        this.isTerminal = Boolean(isTerminal);
        Object.freeze(this);
    }

    toJSON() {
        return {
            name: this.name,
            isTerminal: this.isTerminal,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new GrammarSymbol(json);
    }
}
