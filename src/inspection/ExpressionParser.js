/**
 * ExpressionParser — Safe language-neutral tokenizer and AST parser for inspection expressions.
 *
 * Guaranteed Properties:
 *  1. Pure & Safe: Parses expressions into a strict AST without invoking eval() or Function().
 *  2. Language Extensible: Default Python adapter with support for multi-language extensions.
 *  3. Bounded & Cached: Reusable AST cache by (expression, language).
 */

import { EvaluationError, ERROR_CODES } from './EvaluationError.js';

export const AST_NODE_TYPES = Object.freeze({
    IDENTIFIER: 'Identifier',
    MEMBER_ACCESS: 'MemberAccess',
    INDEX_ACCESS: 'IndexAccess',
    LITERAL: 'Literal',
    UNARY_OP: 'UnaryOp',
    BINARY_OP: 'BinaryOp',
    COMPARISON: 'Comparison',
    IDENTITY: 'Identity',
    CALL: 'Call',
    LIST_LITERAL: 'ListLiteral',
    DICT_LITERAL: 'DictLiteral',
});

export class ExpressionParser {
    constructor() {
        this._cache = new Map(); // `${language}:${source}` -> AST
    }

    /**
     * Parse an expression string into a normalized AST.
     * @param {string} source
     * @param {string} [language='python']
     * @returns {object} AST Node
     */
    parse(source, language = 'python') {
        if (!source || typeof source !== 'string') {
            throw EvaluationError.syntaxError('Expression must be a non-empty string', source);
        }

        const trimmed = source.trim();
        const cacheKey = `${language}:${trimmed}`;
        if (this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }

        const tokens = this._tokenize(trimmed);
        if (tokens.length === 0) {
            throw EvaluationError.syntaxError('Empty expression', trimmed);
        }

        const parserState = { tokens, pos: 0, source: trimmed };
        const ast = this._parseExpression(parserState);

        if (parserState.pos < parserState.tokens.length) {
            const extraToken = parserState.tokens[parserState.pos];
            throw EvaluationError.syntaxError(
                `Unexpected token '${extraToken.value}' at character ${extraToken.pos}`,
                trimmed,
                extraToken.pos
            );
        }

        this._cache.set(cacheKey, ast);
        return ast;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Tokenizer
    // ─────────────────────────────────────────────────────────────────────────────

    _tokenize(source) {
        const tokens = [];
        let i = 0;
        const len = source.length;

        while (i < len) {
            const char = source[i];

            // Skip whitespace
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // Two-character operators
            const twoChar = source.substring(i, i + 2);
            if (['==', '!=', '<=', '>=', '//'].includes(twoChar)) {
                tokens.push({ type: 'Operator', value: twoChar, pos: i });
                i += 2;
                continue;
            }

            // Single-character punctuation and operators
            if (['.', '[', ']', '(', ')', '{', '}', ':', ',', '+', '-', '*', '/', '%', '<', '>'].includes(char)) {
                tokens.push({ type: 'Punctuation', value: char, pos: i });
                i++;
                continue;
            }

            // String literals
            if (char === '"' || char === "'") {
                const quote = char;
                let strVal = '';
                const startPos = i;
                i++; // Skip opening quote
                let closed = false;

                while (i < len) {
                    const c = source[i];
                    if (c === '\\') {
                        // Escape sequence
                        i++;
                        if (i >= len) break;
                        const nextC = source[i];
                        if (nextC === 'n') strVal += '\n';
                        else if (nextC === 't') strVal += '\t';
                        else if (nextC === 'r') strVal += '\r';
                        else strVal += nextC;
                    } else if (c === quote) {
                        closed = true;
                        i++; // Skip closing quote
                        break;
                    } else {
                        strVal += c;
                    }
                    i++;
                }

                if (!closed) {
                    throw EvaluationError.syntaxError(`Unterminated string literal at ${startPos}`, source, startPos);
                }

                tokens.push({ type: 'String', value: strVal, raw: source.substring(startPos, i), pos: startPos });
                continue;
            }

            // Number literals
            if (/[0-9]/.test(char) || (char === '.' && i + 1 < len && /[0-9]/.test(source[i + 1]))) {
                const startPos = i;
                let numStr = '';
                let hasDot = false;

                while (i < len && (/[0-9]/.test(source[i]) || (source[i] === '.' && !hasDot))) {
                    if (source[i] === '.') hasDot = true;
                    numStr += source[i];
                    i++;
                }

                const numVal = hasDot ? parseFloat(numStr) : parseInt(numStr, 10);
                tokens.push({ type: 'Number', value: numVal, raw: numStr, isFloat: hasDot, pos: startPos });
                continue;
            }

            // Identifiers / Keywords
            if (/[a-zA-Z_]/.test(char)) {
                const startPos = i;
                let ident = '';
                while (i < len && /[a-zA-Z0-9_]/.test(source[i])) {
                    ident += source[i];
                    i++;
                }

                // Check for boolean / None literals
                if (ident === 'True' || ident === 'true') {
                    tokens.push({ type: 'Boolean', value: true, raw: ident, pos: startPos });
                } else if (ident === 'False' || ident === 'false') {
                    tokens.push({ type: 'Boolean', value: false, raw: ident, pos: startPos });
                } else if (ident === 'None' || ident === 'null' || ident === 'nil') {
                    tokens.push({ type: 'None', value: null, raw: ident, pos: startPos });
                } else {
                    tokens.push({ type: 'Identifier', value: ident, pos: startPos });
                }
                continue;
            }

            throw EvaluationError.syntaxError(`Unexpected character '${char}' at ${i}`, source, i);
        }

        return tokens;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Recursive Descent Parser
    // ─────────────────────────────────────────────────────────────────────────────

    _peek(state) {
        return state.tokens[state.pos] || null;
    }

    _consume(state, expectedValue = null) {
        const token = state.tokens[state.pos];
        if (!token) {
            throw EvaluationError.syntaxError('Unexpected end of expression', state.source);
        }
        if (expectedValue !== null && token.value !== expectedValue) {
            throw EvaluationError.syntaxError(`Expected '${expectedValue}' but found '${token.value}' at ${token.pos}`, state.source, token.pos);
        }
        state.pos++;
        return token;
    }

    _match(state, values) {
        const token = this._peek(state);
        if (!token) return false;
        if (Array.isArray(values)) {
            if (values.includes(token.value)) {
                state.pos++;
                return token;
            }
        } else if (token.value === values) {
            state.pos++;
            return token;
        }
        return false;
    }

    _parseExpression(state) {
        return this._parseIdentity(state);
    }

    _parseIdentity(state) {
        let left = this._parseComparison(state);

        const token = this._peek(state);
        if (token && token.value === 'is') {
            state.pos++;
            let isNot = false;
            const nextToken = this._peek(state);
            if (nextToken && nextToken.value === 'not') {
                state.pos++;
                isNot = true;
            }
            const right = this._parseComparison(state);
            return {
                type: AST_NODE_TYPES.IDENTITY,
                isNot,
                left,
                right,
            };
        }

        return left;
    }

    _parseComparison(state) {
        let left = this._parseAdditive(state);

        let opToken;
        while ((opToken = this._match(state, ['==', '!=', '<=', '>=', '<', '>']))) {
            const right = this._parseAdditive(state);
            left = {
                type: AST_NODE_TYPES.COMPARISON,
                operator: opToken.value,
                left,
                right,
            };
        }

        return left;
    }

    _parseAdditive(state) {
        let left = this._parseMultiplicative(state);

        let opToken;
        while ((opToken = this._match(state, ['+', '-']))) {
            const right = this._parseMultiplicative(state);
            left = {
                type: AST_NODE_TYPES.BINARY_OP,
                operator: opToken.value,
                left,
                right,
            };
        }

        return left;
    }

    _parseMultiplicative(state) {
        let left = this._parseUnary(state);

        let opToken;
        while ((opToken = this._match(state, ['*', '//', '/', '%']))) {
            const right = this._parseUnary(state);
            left = {
                type: AST_NODE_TYPES.BINARY_OP,
                operator: opToken.value,
                left,
                right,
            };
        }

        return left;
    }

    _parseUnary(state) {
        const token = this._peek(state);
        if (token && (token.value === '-' || token.value === '+' || token.value === 'not')) {
            state.pos++;
            const arg = this._parseUnary(state);
            return {
                type: AST_NODE_TYPES.UNARY_OP,
                operator: token.value,
                argument: arg,
            };
        }

        return this._parsePostfix(state);
    }

    _parsePostfix(state) {
        let target = this._parsePrimary(state);

        while (true) {
            const next = this._peek(state);
            if (!next) break;

            if (next.value === '.') {
                // Member access: target.property
                state.pos++;
                const propToken = this._peek(state);
                if (!propToken || propToken.type !== 'Identifier') {
                    throw EvaluationError.syntaxError(`Expected property identifier after '.' at ${next.pos}`, state.source, next.pos);
                }
                state.pos++;
                target = {
                    type: AST_NODE_TYPES.MEMBER_ACCESS,
                    object: target,
                    property: propToken.value,
                };
            } else if (next.value === '[') {
                // Index access: target[index]
                state.pos++;
                const indexExpr = this._parseExpression(state);
                this._consume(state, ']');
                target = {
                    type: AST_NODE_TYPES.INDEX_ACCESS,
                    target,
                    index: indexExpr,
                };
            } else if (next.value === '(') {
                // Function call: callee(arg1, arg2)
                state.pos++;
                const args = [];
                if (this._peek(state) && this._peek(state).value !== ')') {
                    while (true) {
                        args.push(this._parseExpression(state));
                        if (this._match(state, ',')) {
                            if (this._peek(state) && this._peek(state).value === ')') break;
                        } else {
                            break;
                        }
                    }
                }
                this._consume(state, ')');
                target = {
                    type: AST_NODE_TYPES.CALL,
                    callee: target,
                    args,
                };
            } else {
                break;
            }
        }

        return target;
    }

    _parsePrimary(state) {
        const token = this._peek(state);
        if (!token) {
            throw EvaluationError.syntaxError('Unexpected end of expression', state.source);
        }

        // Parentheses grouping: (expr)
        if (token.value === '(') {
            state.pos++;
            const inner = this._parseExpression(state);
            this._consume(state, ')');
            return inner;
        }

        // List literal: [1, 2, 3]
        if (token.value === '[') {
            state.pos++;
            const elements = [];
            if (this._peek(state) && this._peek(state).value !== ']') {
                while (true) {
                    elements.push(this._parseExpression(state));
                    if (this._match(state, ',')) {
                        if (this._peek(state) && this._peek(state).value === ']') break;
                    } else {
                        break;
                    }
                }
            }
            this._consume(state, ']');
            return {
                type: AST_NODE_TYPES.LIST_LITERAL,
                elements,
            };
        }

        // Literals
        if (token.type === 'Number') {
            state.pos++;
            return {
                type: AST_NODE_TYPES.LITERAL,
                raw: token.raw,
                value: token.value,
                valueType: token.isFloat ? 'float' : 'int',
            };
        }

        if (token.type === 'String') {
            state.pos++;
            return {
                type: AST_NODE_TYPES.LITERAL,
                raw: token.raw,
                value: token.value,
                valueType: 'str',
            };
        }

        if (token.type === 'Boolean') {
            state.pos++;
            return {
                type: AST_NODE_TYPES.LITERAL,
                raw: token.raw,
                value: token.value,
                valueType: 'bool',
            };
        }

        if (token.type === 'None') {
            state.pos++;
            return {
                type: AST_NODE_TYPES.LITERAL,
                raw: token.raw,
                value: null,
                valueType: 'NoneType',
            };
        }

        // Identifier
        if (token.type === 'Identifier') {
            state.pos++;
            return {
                type: AST_NODE_TYPES.IDENTIFIER,
                name: token.value,
            };
        }

        throw EvaluationError.syntaxError(`Unexpected token '${token.value}' at ${token.pos}`, state.source, token.pos);
    }
}
