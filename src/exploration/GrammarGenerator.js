/**
 * GrammarGenerator — Generates structured textual inputs from formal grammars.
 */

import { Generator } from './Generator.js';
import { Grammar } from './Grammar.js';

export class GrammarGenerator extends Generator {
    /**
     * @param {object} params
     * @param {Grammar} params.grammar
     * @param {number} [params.maxDepth=5]
     */
    constructor(params = {}) {
        super({
            ...params,
            name: 'GrammarGenerator',
            type: 'grammar',
        });
        this.grammar = params.grammar || new Grammar();
        this.maxDepth = params.maxDepth !== undefined ? Number(params.maxDepth) : 5;
        Object.freeze(this);
    }

    generateValue(context) {
        return this._expandSymbol(this.grammar.startSymbol, context, 0);
    }

    _expandSymbol(symbol, context, depth) {
        const rule = this.grammar.getRule(symbol);
        if (!rule || rule.productions.length === 0) {
            return symbol; // Terminal literal
        }

        // At or beyond maxDepth, pick the shortest terminal production
        if (depth >= this.maxDepth) {
            const terminals = rule.productions.filter(p => p.elements.every(e => !this.grammar.getRule(e)));
            const prod = terminals.length > 0 ? terminals[0] : rule.productions[0];
            return prod.elements.map(e => this._expandSymbol(e, context, depth + 1)).join('');
        }

        const prodIdx = Math.floor(context.random(depth + 1) * rule.productions.length);
        const prod = rule.productions[prodIdx];
        return prod.elements.map(e => this._expandSymbol(e, context.next(1), depth + 1)).join('');
    }
}
