/**
 * TypeDiagnostics — Structured type and value-flow diagnostics and warnings.
 */

export const DIAGNOSTIC_CODES = Object.freeze({
    POSSIBLE_TYPE_MISMATCH: 'POSSIBLE_TYPE_MISMATCH',
    UNSUPPORTED_OPERATION: 'UNSUPPORTED_OPERATION',
    UNKNOWN_TYPE: 'UNKNOWN_TYPE',
    POSSIBLE_NONE_ACCESS: 'POSSIBLE_NONE_ACCESS',
    UNKNOWN_ATTRIBUTE: 'UNKNOWN_ATTRIBUTE',
    INCOMPATIBLE_ARGUMENT: 'INCOMPATIBLE_ARGUMENT',
    RETURN_TYPE_VARIANCE: 'RETURN_TYPE_VARIANCE',
    UNREACHABLE_BRANCH: 'UNREACHABLE_BRANCH',
    UNSUPPORTED_DYNAMIC_BEHAVIOR: 'UNSUPPORTED_DYNAMIC_BEHAVIOR',
});

export const DIAGNOSTIC_SEVERITY = Object.freeze({
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    HINT: 'hint',
});

export class TypeDiagnostic {
    /**
     * @param {object} params
     * @param {string} [params.severity=DIAGNOSTIC_SEVERITY.WARNING]
     * @param {string} params.code
     * @param {string} params.message
     * @param {object|null} [params.sourceLocation=null]
     * @param {Array<object>} [params.relatedLocations=[]]
     * @param {string} [params.evidence='STATIC_INFERENCE']
     * @param {string} [params.confidence='STATIC_INFERENCE']
     */
    constructor({
        severity = DIAGNOSTIC_SEVERITY.WARNING,
        code = DIAGNOSTIC_CODES.POSSIBLE_TYPE_MISMATCH,
        message = '',
        sourceLocation = null,
        relatedLocations = [],
        evidence = 'STATIC_INFERENCE',
        confidence = 'STATIC_INFERENCE',
    }) {
        this.severity = severity;
        this.code = code;
        this.message = message;
        this.sourceLocation = sourceLocation;
        this.relatedLocations = Array.isArray(relatedLocations) ? relatedLocations : [];
        this.evidence = evidence;
        this.confidence = confidence;
    }

    toJSON() {
        return {
            severity: this.severity,
            code: this.code,
            message: this.message,
            sourceLocation: this.sourceLocation,
            relatedLocations: this.relatedLocations,
            evidence: this.evidence,
            confidence: this.confidence,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TypeDiagnostic(json);
    }
}

export const TypeDiagnostics = TypeDiagnostic;
