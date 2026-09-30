/**
 * GrammarParser — Simple BNF/EBNF string parser to construct Grammar objects.
 */

import { Grammar } from './Grammar.js';
import { GrammarRule } from './GrammarRule.js';
import { GrammarProduction } from './GrammarProduction.js';

export class GrammarParser {
    /**
     * Parses a string representation of BNF rules into a Grammar object.
     * Example:
     *   start -> expr
     *   expr -> num | "(" expr ")"
     *   num -> "0" | "1" | "2"
     * @param {string} bnfText
     * @param {string} [startSymbol='start']
     * @returns {Grammar}
     */
    static parse(bnfText, startSymbol = 'start') {
        const rules = {};
        const lines = bnfText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

        for (const line of lines) {
            const parts = line.split('->');
            if (parts.length === 2) {
                const sym = parts[0].trim();
                const alts = parts[1].split('|').map(a => a.trim());
                const prods = alts.map(alt => {
                    // Extract quoted literals or space-separated tokens
                    const tokens = alt.split(/\s+/).filter(Boolean).map(t => t.replace(/^["']|["']$/g, ''));
                    return new GrammarProduction({ elements: tokens });
                });
                rules[sym] = new GrammarRule({ symbol: sym, productions: prods });
            }
        }

        return new Grammar({
            startSymbol: Object.keys(rules)[0] || startSymbol,
            rules,
        });
    }
}
