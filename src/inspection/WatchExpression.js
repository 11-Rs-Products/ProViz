/**
 * WatchExpression — Persistent watch query model.
 *
 * Represents a persistent user expression to be continuously evaluated
 * across timeline navigation steps.
 */

import { Expression } from './Expression.js';

export class WatchExpression {
    /**
     * @param {object} params
     * @param {string} [params.id] - Unique watch ID
     * @param {Expression|string} params.expression - Expression instance or query text
     * @param {string} [params.language='python'] - Language identifier
     * @param {boolean} [params.enabled=true] - Whether watch is active
     * @param {number} [params.createdAt] - Creation sequence or timestamp
     * @param {object} [params.metadata={}] - Arbitrary metadata
     */
    constructor({
        id = null,
        expression,
        language = 'python',
        enabled = true,
        createdAt = null,
        metadata = {},
    } = {}) {
        this.expression = expression instanceof Expression ? expression : Expression.create(expression, language);
        this.id = id || `watch_${this.expression.id}`;
        this.language = (language || this.expression.language || 'python').toLowerCase();
        this.enabled = Boolean(enabled);
        this.createdAt = typeof createdAt === 'number' ? createdAt : Date.now();
        this.metadata = { ...metadata };
    }

    get source() {
        return this.expression.source;
    }

    get normalized() {
        return this.expression.normalized;
    }

    enable() {
        this.enabled = true;
        return this;
    }

    disable() {
        this.enabled = false;
        return this;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    update(newExpression) {
        this.expression = newExpression instanceof Expression ? newExpression : Expression.create(newExpression, this.language);
        return this;
    }

    clone() {
        return new WatchExpression({
            id: this.id,
            expression: this.expression.clone(),
            language: this.language,
            enabled: this.enabled,
            createdAt: this.createdAt,
            metadata: { ...this.metadata },
        });
    }

    toJSON() {
        return {
            id: this.id,
            expression: this.expression.toJSON(),
            language: this.language,
            enabled: this.enabled,
            createdAt: this.createdAt,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) throw new Error('Cannot construct WatchExpression from null/undefined');
        return new WatchExpression({
            id: json.id,
            expression: Expression.fromJSON(json.expression),
            language: json.language,
            enabled: json.enabled,
            createdAt: json.createdAt,
            metadata: json.metadata || {},
        });
    }
}
