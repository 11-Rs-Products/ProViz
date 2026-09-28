/**
 * EvaluationResult — Structured outcome of an expression evaluation.
 *
 * Encapsulates:
 *  - status: 'success' | 'error' | 'timeout' | 'depth_limit' | 'size_limit' | 'unsupported'
 *  - value: Structured Value descriptor or primitive result
 *  - valueType: Semantic type name (e.g. 'int', 'str', 'list', 'dict', 'User')
 *  - objectId: Heap object ID if reference, else null
 *  - display: Formatted display string for UI presentation
 *  - metadata: Diagnostic and structural metadata
 *  - duration: Evaluation time in ms
 *  - error: EvaluationError instance if failure
 */

import { EvaluationError, ERROR_CODES } from './EvaluationError.js';
import { stringifyValue, isReference, isPrimitive, isOpaque } from '../runtime/Value.js';

export const RESULT_STATUS = Object.freeze({
    SUCCESS: 'success',
    ERROR: 'error',
    TIMEOUT: 'timeout',
    DEPTH_LIMIT: 'depth_limit',
    SIZE_LIMIT: 'size_limit',
    UNSUPPORTED: 'unsupported',
});

export class EvaluationResult {
    /**
     * @param {object} params
     * @param {string} [params.status=RESULT_STATUS.SUCCESS]
     * @param {any} [params.value=null] - Structured Value or raw result
     * @param {string} [params.valueType='unknown']
     * @param {string|null} [params.objectId=null]
     * @param {string} [params.display='']
     * @param {object} [params.metadata={}]
     * @param {number} [params.duration=0]
     * @param {EvaluationError|null} [params.error=null]
     */
    constructor({
        status = RESULT_STATUS.SUCCESS,
        value = null,
        valueType = 'unknown',
        objectId = null,
        display = '',
        metadata = {},
        duration = 0,
        error = null,
    } = {}) {
        this.status = status;
        this.value = value;
        this.valueType = valueType;
        this.objectId = objectId;
        this.display = display;
        this.metadata = { ...metadata };
        this.duration = typeof duration === 'number' ? duration : 0;
        this.error = error;
    }

    get isSuccess() {
        return this.status === RESULT_STATUS.SUCCESS;
    }

    get isError() {
        return this.status !== RESULT_STATUS.SUCCESS;
    }

    toJSON() {
        return {
            status: this.status,
            value: this.value,
            valueType: this.valueType,
            objectId: this.objectId,
            display: this.display,
            metadata: this.metadata,
            duration: this.duration,
            error: this.error ? (typeof this.error.toJSON === 'function' ? this.error.toJSON() : { message: String(this.error) }) : null,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Factory Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Construct a successful EvaluationResult from a structured value and heap.
     * @param {object} params
     * @returns {EvaluationResult}
     */
    static success({ value, heap = {}, display = null, duration = 0, metadata = {} }) {
        let valueType = 'unknown';
        let objectId = null;

        if (isReference(value)) {
            valueType = value.type || 'object';
            objectId = value.objectId;
        } else if (isPrimitive(value)) {
            valueType = value.type || typeof value.value;
        } else if (isOpaque(value)) {
            valueType = value.type || 'opaque';
        } else if (value && typeof value === 'object') {
            valueType = value.type || typeof value;
        } else if (value !== null && value !== undefined) {
            valueType = typeof value;
        } else {
            valueType = 'NoneType';
        }

        const formattedDisplay = display !== null ? display : stringifyValue(value, heap);

        return new EvaluationResult({
            status: RESULT_STATUS.SUCCESS,
            value,
            valueType,
            objectId,
            display: formattedDisplay,
            metadata: {
                isReference: Boolean(objectId),
                ...metadata,
            },
            duration,
            error: null,
        });
    }

    /**
     * Construct an error EvaluationResult from an EvaluationError.
     * @param {EvaluationError|Error|string} err
     * @param {number} [duration=0]
     * @returns {EvaluationResult}
     */
    static error(err, duration = 0) {
        let evalError;
        let status = RESULT_STATUS.ERROR;

        if (err instanceof EvaluationError) {
            evalError = err;
            if (err.code === ERROR_CODES.TIMEOUT) status = RESULT_STATUS.TIMEOUT;
            else if (err.code === ERROR_CODES.DEPTH_LIMIT) status = RESULT_STATUS.DEPTH_LIMIT;
            else if (err.code === ERROR_CODES.SIZE_LIMIT) status = RESULT_STATUS.SIZE_LIMIT;
            else if (err.code === ERROR_CODES.UNSUPPORTED_OPERATION) status = RESULT_STATUS.UNSUPPORTED;
        } else if (err instanceof Error) {
            evalError = new EvaluationError({
                code: ERROR_CODES.EVALUATION_ERROR,
                message: err.message,
            });
        } else {
            evalError = new EvaluationError({
                code: ERROR_CODES.EVALUATION_ERROR,
                message: String(err || 'Evaluation failed'),
            });
        }

        return new EvaluationResult({
            status,
            value: null,
            valueType: 'error',
            objectId: null,
            display: `<Error: ${evalError.message}>`,
            metadata: evalError.metadata,
            duration,
            error: evalError,
        });
    }
}
