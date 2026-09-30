/**
 * Grammar — Formal grammar definition supporting recursive productions and derivation bounds.
 */

import { GrammarRule } from './GrammarRule.js';

export class Grammar {
    /**
     * @param {object} params
     * @param {string} [params.startSymbol='start']
     * @param {object<string, GrammarRule|Array<any>>} [params.rules={}]
     */
    constructor({
        startSymbol = 'start',
        rules = {},
    } = {}) {
        this.startSymbol = String(startSymbol);
        const rMap = {};
        for (const [sym, r] of Object.entries(rules)) {
            if (r instanceof GrammarRule) {
                rMap[sym] = r;
            } else if (Array.isArray(r)) {
                rMap[sym] = new GrammarRule({ symbol: sym, productions: r });
            }
        }
        this.rules = Object.freeze(rMap);
        Object.freeze(this);
    }

    getRule(symbol) {
        return this.rules[symbol] || null;
    }

    toJSON() {
        const jsonRules = {};
        for (const [sym, r] of Object.entries(this.rules)) {
            jsonRules[sym] = r.toJSON();
        }
        return {
            startSymbol: this.startSymbol,
            rules: jsonRules,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        const rules = {};
        for (const [sym, r] of Object.entries(json.rules || {})) {
            rules[sym] = GrammarRule.fromJSON(r);
        }
        return new Grammar({
            startSymbol: json.startSymbol,
            rules,
        });
    }
}
