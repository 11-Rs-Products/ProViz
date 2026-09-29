/**
 * PathDivergence — Structured record of divergence between predicted symbolic path and observed dynamic execution.
 */

export const DIVERGENCE_REASONS = Object.freeze({
    NO_DIVERGENCE: 'NO_DIVERGENCE',
    CONSTRAINT_MISMATCH: 'CONSTRAINT_MISMATCH',
    TYPE_MISMATCH: 'TYPE_MISMATCH',
    VALUE_MISMATCH: 'VALUE_MISMATCH',
    UNMODELED_OPERATION: 'UNMODELED_OPERATION',
    UNMODELED_CALL: 'UNMODELED_CALL',
    CONTROL_FLOW_MISMATCH: 'CONTROL_FLOW_MISMATCH',
    EXCEPTION_MISMATCH: 'EXCEPTION_MISMATCH',
    UNKNOWN: 'UNKNOWN',
});

export class PathDivergence {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.candidateId]
     * @param {string} [params.reason=DIVERGENCE_REASONS.CONTROL_FLOW_MISMATCH]
     * @param {string|null} [params.predictedBranch=null]
     * @param {string|null} [params.observedBranch=null]
     * @param {object|null} [params.sourceLocation=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        candidateId = '',
        reason = DIVERGENCE_REASONS.CONTROL_FLOW_MISMATCH,
        predictedBranch = null,
        observedBranch = null,
        sourceLocation = null,
        metadata = {},
    } = {}) {
        this.candidateId = String(candidateId);
        this.reason = reason;
        this.predictedBranch = predictedBranch;
        this.observedBranch = observedBranch;
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.metadata = Object.freeze({ ...metadata });
        this.id = id || `div_${this.candidateId}_${this.reason}`;
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            candidateId: this.candidateId,
            reason: this.reason,
            predictedBranch: this.predictedBranch,
            observedBranch: this.observedBranch,
            sourceLocation: this.sourceLocation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new PathDivergence(json);
    }
}
