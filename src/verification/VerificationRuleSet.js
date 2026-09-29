/**
 * VerificationRuleSet — Container and registry for verification rules.
 */

import { VerificationRule } from './VerificationRule.js';

export class VerificationRuleSet {
    constructor() {
        this._rules = new Map();
    }

    register(rule) {
        if (!(rule instanceof VerificationRule)) {
            throw new Error('Expected instance of VerificationRule');
        }
        this._rules.set(rule.id, rule);
    }

    get(id) {
        return this._rules.get(id) || null;
    }

    getAll() {
        return Array.from(this._rules.values());
    }

    getByKind(kind) {
        return this.getAll().filter(r => r.kind === kind);
    }
}
