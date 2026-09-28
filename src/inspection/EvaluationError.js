/**
 * EvaluationError — Structured error object for inspection & watch expression evaluation failures.
 *
 * Never throws unhandled raw JavaScript exceptions into the UI.
 * Provides machine-readable error codes and rich diagnostic metadata.
 */

export const ERROR_CODES = Object.freeze({
    UNKNOWN_IDENTIFIER: 'UNKNOWN_IDENTIFIER',
    ATTRIBUTE_NOT_FOUND: 'ATTRIBUTE_NOT_FOUND',
    INDEX_OUT_OF_RANGE: 'INDEX_OUT_OF_RANGE',
    INVALID_INDEX: 'INVALID_INDEX',
    UNSUPPORTED_OPERATION: 'UNSUPPORTED_OPERATION',
    TYPE_ERROR: 'TYPE_ERROR',
    DEPTH_LIMIT: 'DEPTH_LIMIT',
    SIZE_LIMIT: 'SIZE_LIMIT',
    TIMEOUT: 'TIMEOUT',
    SYNTAX_ERROR: 'SYNTAX_ERROR',
    MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
    EVALUATION_ERROR: 'EVALUATION_ERROR',
});

export class EvaluationError extends Error {
    /**
     * @param {object} params
     * @param {string} params.code - One of ERROR_CODES
     * @param {string} params.message - Human-readable error description
     * @param {string} [params.expression] - Expression source or sub-expression
     * @param {object|null} [params.location=null] - Character position or AST range
     * @param {object} [params.metadata={}] - Structured error metadata
     */
    constructor({
        code = ERROR_CODES.EVALUATION_ERROR,
        message,
        expression = '',
        location = null,
        metadata = {},
    } = {}) {
        super(message || code);
        this.name = 'EvaluationError';
        this.code = code;
        this.expression = expression;
        this.location = location;
        this.metadata = { ...metadata };
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            expression: this.expression,
            location: this.location,
            metadata: this.metadata,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Factory Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    static unknownIdentifier(name, expression = '') {
        return new EvaluationError({
            code: ERROR_CODES.UNKNOWN_IDENTIFIER,
            message: `name '${name}' is not defined in the current scope`,
            expression: expression || name,
            metadata: { identifier: name },
        });
    }

    static attributeNotFound(attribute, objectType = 'object', expression = '') {
        return new EvaluationError({
            code: ERROR_CODES.ATTRIBUTE_NOT_FOUND,
            message: `'${objectType}' object has no attribute '${attribute}'`,
            expression: expression || attribute,
            metadata: { attribute, objectType },
        });
    }

    static indexOutOfRange(index, length = null, expression = '') {
        return new EvaluationError({
            code: ERROR_CODES.INDEX_OUT_OF_RANGE,
            message: `index ${index} out of range${length !== null ? ` (size: ${length})` : ''}`,
            expression,
            metadata: { index, length },
        });
    }

    static invalidIndex(index, targetType = 'collection', expression = '') {
        return new EvaluationError({
            code: ERROR_CODES.INVALID_INDEX,
            message: `Key or index ${JSON.stringify(index)} not found in ${targetType}`,
            expression,
            metadata: { index, targetType },
        });
    }

    static unsupportedOperation(operation, message = null, expression = '') {
        return new EvaluationError({
            code: ERROR_CODES.UNSUPPORTED_OPERATION,
            message: message || `Operation '${operation}' is not supported during inspection`,
            expression,
            metadata: { operation },
        });
    }

    static typeError(message, expression = '', metadata = {}) {
        return new EvaluationError({
            code: ERROR_CODES.TYPE_ERROR,
            message: message || 'Type error during expression evaluation',
            expression,
            metadata,
        });
    }

    static depthLimit(maxDepth, expression = '') {
        return new EvaluationError({
            code: ERROR_CODES.DEPTH_LIMIT,
            message: `Traversal depth limit (${maxDepth}) exceeded`,
            expression,
            metadata: { maxDepth },
        });
    }

    static sizeLimit(maxSize, expression = '') {
        return new EvaluationError({
            code: ERROR_CODES.SIZE_LIMIT,
            message: `Result size limit (${maxSize}) exceeded`,
            expression,
            metadata: { maxSize },
        });
    }

    static timeout(timeoutMs, expression = '') {
        return new EvaluationError({
            code: ERROR_CODES.TIMEOUT,
            message: `Evaluation timed out after ${timeoutMs}ms`,
            expression,
            metadata: { timeoutMs },
        });
    }

    static syntaxError(message, expression = '', location = null) {
        return new EvaluationError({
            code: ERROR_CODES.SYNTAX_ERROR,
            message: message || 'Syntax error in expression',
            expression,
            location,
        });
    }
}
