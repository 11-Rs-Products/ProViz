/**
 * FindingResolution — Semantics of finding status after applying a patch.
 */

export const RESOLUTION_STATUS = Object.freeze({
    RESOLVED: 'RESOLVED',
    STILL_PRESENT: 'STILL_PRESENT',
    TRANSFORMED: 'TRANSFORMED',
    UNREACHABLE: 'UNREACHABLE',
    UNKNOWN: 'UNKNOWN',
    REGRESSED: 'REGRESSED',
});

export class FindingResolution {
    /**
     * @param {object} params
     * @param {string} params.findingId
     * @param {string} params.status - One of RESOLUTION_STATUS
     * @param {string} [params.explanation='']
     * @param {object} [params.details={}]
     */
    constructor({
        findingId,
        status = RESOLUTION_STATUS.RESOLVED,
        explanation = '',
        details = {},
    } = {}) {
        this.findingId = String(findingId);
        this.status = status;
        this.explanation = String(explanation || '');
        this.details = Object.freeze({ ...details });
        Object.freeze(this);
    }

    get isResolved() {
        return this.status === RESOLUTION_STATUS.RESOLVED || this.status === RESOLUTION_STATUS.UNREACHABLE;
    }

    toJSON() {
        return {
            findingId: this.findingId,
            status: this.status,
            explanation: this.explanation,
            details: this.details,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new FindingResolution(json);
    }
}
