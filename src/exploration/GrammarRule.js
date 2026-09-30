/**
 * GrammarRule — Non-terminal symbol associated with a set of alternative GrammarProductions.
 */

import { GrammarProduction } from './GrammarProduction.js';

export class GrammarRule {
    /**
     * @param {object} params
     * @param {string} params.symbol
     * @param {Array<GrammarProduction|Array<string>>} params.productions
     */
    constructor({ symbol, productions = [] } = {}) {
        this.symbol = String(symbol || '');
        this.productions = Object.freeze(productions.map(p =>
            p instanceof GrammarProduction
                ? p
                : new GrammarProduction({ elements: Array.isArray(p) ? p : [String(p)] })
        ));
        Object.freeze(this);
    }

    toJSON() {
        return {
            symbol: this.symbol,
            productions: this.productions.map(p => p.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new GrammarRule({
            symbol: json.symbol,
            productions: (json.productions || []).map(p => GrammarProduction.fromJSON(p)),
        });
    }
}
