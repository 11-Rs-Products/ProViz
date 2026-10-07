/**
 * EvidenceStatus — Lifecycle states for evidence items.
 */

export const EVIDENCE_STATUSES = Object.freeze({
    ACTIVE: 'ACTIVE',
    FRESH: 'FRESH',
    AGING: 'AGING',
    STALE: 'STALE',
    INVALIDATED: 'INVALIDATED',
    DISPUTED: 'DISPUTED',
});

export class EvidenceStatus {
    static ACTIVE = EVIDENCE_STATUSES.ACTIVE;
    static FRESH = EVIDENCE_STATUSES.FRESH;
    static AGING = EVIDENCE_STATUSES.AGING;
    static STALE = EVIDENCE_STATUSES.STALE;
    static INVALIDATED = EVIDENCE_STATUSES.INVALIDATED;
    static DISPUTED = EVIDENCE_STATUSES.DISPUTED;

    static isValid(status) {
        return Object.values(EVIDENCE_STATUSES).includes(status);
    }
}
