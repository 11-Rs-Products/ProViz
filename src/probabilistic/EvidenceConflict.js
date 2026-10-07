/**
 * EvidenceConflict — Structured representation of contradicting evidence items on the same subject.
 */

export const ConflictClassification = Object.freeze({
    PROOF_SCOPE_MISMATCH: 'PROOF_SCOPE_MISMATCH',
    ENVIRONMENT_MISMATCH: 'ENVIRONMENT_MISMATCH',
    STALE_ANALYSIS: 'STALE_ANALYSIS',
    OBSERVATION_CONFLICT: 'OBSERVATION_CONFLICT',
    ORACLE_CONFLICT: 'ORACLE_CONFLICT',
    SPECIFICATION_CONFLICT: 'SPECIFICATION_CONFLICT',
    UNKNOWN_CONFLICT: 'UNKNOWN_CONFLICT',
});

export const CONFLICT_TYPES = ConflictClassification;

export class EvidenceConflict {
    constructor({
        id = null,
        conflictId = null,
        subject,
        classification = null,
        conflictType = null,
        evidenceA = null,
        evidenceB = null,
        supportingEvidenceIds = [],
        refutingEvidenceIds = [],
        description = '',
        environmentContext = {},
        severity = 'HIGH',
        resolved = false
    } = {}) {
        this.id = id || conflictId || `conf_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
        this.conflictId = this.id;
        this.subject = String(subject);
        this.classification = classification || conflictType || ConflictClassification.OBSERVATION_CONFLICT;
        this.conflictType = this.classification;
        this.evidenceA = evidenceA;
        this.evidenceB = evidenceB;

        const supIds = supportingEvidenceIds.length > 0
            ? supportingEvidenceIds
            : (evidenceA ? [evidenceA.id] : []);
        const refIds = refutingEvidenceIds.length > 0
            ? refutingEvidenceIds
            : (evidenceB ? [evidenceB.id] : []);

        this.supportingEvidenceIds = Object.freeze([...supIds]);
        this.refutingEvidenceIds = Object.freeze([...refIds]);
        this.description = String(description || '');
        this.environmentContext = Object.freeze({ ...environmentContext });
        this.severity = severity;
        this.resolved = Boolean(resolved);
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            conflictId: this.conflictId,
            subject: this.subject,
            classification: this.classification,
            conflictType: this.conflictType,
            supportingEvidenceIds: this.supportingEvidenceIds,
            refutingEvidenceIds: this.refutingEvidenceIds,
            description: this.description,
            environmentContext: this.environmentContext,
            severity: this.severity,
            resolved: this.resolved
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new EvidenceConflict(json);
    }
}
