/**
 * Expression — Canonical representation of an inspection / watch expression.
 *
 * Encapsulates:
 *  - id: Deterministic expression identifier
 *  - source: Original source code query string (e.g. 'user.name', 'items[0]', 'a is b')
 *  - language: Target language identifier ('python')
 *  - normalized: Normalized query text
 *  - metadata: Arbitrary metadata
 */

export class Expression {
    /**
     * @param {object} params
     * @param {string} params.id - Deterministic expression ID
     * @param {string} params.source - Raw expression string
     * @param {string} [params.language='python'] - Language identifier
     * @param {string} [params.normalized] - Normalized expression string
     * @param {object} [params.metadata={}] - Arbitrary metadata
     */
    constructor({
        id,
        source,
        language = 'python',
        normalized = null,
        metadata = {},
    }) {
        if (!source || typeof source !== 'string') {
            throw new Error('Expression requires a non-empty string "source"');
        }

        this.source = source.trim();
        this.language = (language || 'python').toLowerCase();
        this.normalized = normalized || Expression.normalize(this.source);
        this.id = id || Expression._generateId(this.normalized, this.language);
        this.metadata = { ...metadata };
    }

    /**
     * Generates a deterministic ID from normalized source and language.
     * @private
     */
    static _generateId(normalized, language) {
        let hash = 0;
        const str = `${language}:${normalized}`;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        const hex = Math.abs(hash).toString(16).padStart(8, '0');
        const cleanSlug = normalized.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 16);
        return `expr_${cleanSlug}_${hex}`;
    }

    /**
     * Normalizes an expression string by collapsing redundant whitespace.
     * @param {string} source
     * @returns {string}
     */
    static normalize(source) {
        if (!source) return '';
        return source
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\s*([\.\[\],\(\)])\s*/g, '$1')
            .replace(/\s*([\+\-\*\/%<>!=]=?)\s*/g, ' $1 ')
            .replace(/\s+is\s+not\s+/g, ' is not ')
            .replace(/\s+is\s+/g, ' is ')
            .replace(/\s+not\s+/g, ' not ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Factory helper to create an Expression.
     * @param {string|Expression|object} input
     * @param {string} [language='python']
     * @param {object} [metadata={}]
     * @returns {Expression}
     */
    static create(input, language = 'python', metadata = {}) {
        if (input instanceof Expression) {
            return input;
        }
        if (typeof input === 'string') {
            return new Expression({ source: input, language, metadata });
        }
        if (input && typeof input === 'object') {
            return new Expression({
                id: input.id,
                source: input.source || input.expression,
                language: input.language || language,
                normalized: input.normalized,
                metadata: input.metadata || metadata,
            });
        }
        throw new Error('Invalid expression input');
    }

    equals(other) {
        if (!other) return false;
        const o = Expression.create(other);
        return this.normalized === o.normalized && this.language === o.language;
    }

    clone() {
        return new Expression({
            id: this.id,
            source: this.source,
            language: this.language,
            normalized: this.normalized,
            metadata: { ...this.metadata },
        });
    }

    toJSON() {
        return {
            id: this.id,
            source: this.source,
            normalized: this.normalized,
            language: this.language,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) throw new Error('Cannot construct Expression from null/undefined');
        return new Expression({
            id: json.id,
            source: json.source,
            normalized: json.normalized,
            language: json.language,
            metadata: json.metadata || {},
        });
    }
}
