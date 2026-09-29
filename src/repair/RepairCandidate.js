/**
 * RepairCandidate — Proposed repair candidate and its validation status.
 */

import { PatchSet } from './PatchSet.js';

export const REPAIR_CANDIDATE_STATUS = Object.freeze({
    GENERATED: 'GENERATED',
    STATICALLY_VALID: 'STATICALLY_VALID',
    DYNAMICALLY_VALIDATED: 'DYNAMICALLY_VALIDATED',
    REGRESSION_VALIDATED: 'REGRESSION_VALIDATED',
    REJECTED: 'REJECTED',
    UNKNOWN: 'UNKNOWN',
    APPLIED: 'APPLIED',
});

export class RepairCandidate {
    /**
     * @param {object} params
     * @param {string} [params.candidateId=null]
     * @param {string} [params.workspaceSnapshotId='snapshot_default']
     * @param {number} [params.sourceRevision=1]
     * @param {Array<string>} [params.findingIds=[]]
     * @param {Array<object>} [params.targetLocations=[]]
     * @param {PatchSet|object} params.patch
     * @param {string} [params.strategy='GENERIC']
     * @param {string|number} [params.confidence='HIGH']
     * @param {string} [params.status=REPAIR_CANDIDATE_STATUS.GENERATED]
     * @param {object} [params.analysis={}]
     * @param {object|null} [params.validation=null]
     * @param {object|null} [params.explanation=null]
     */
    constructor({
        candidateId = null,
        workspaceSnapshotId = 'snapshot_default',
        sourceRevision = 1,
        findingIds = [],
        targetLocations = [],
        patch = null,
        strategy = 'GENERIC',
        confidence = 'HIGH',
        status = REPAIR_CANDIDATE_STATUS.GENERATED,
        analysis = {},
        validation = null,
        explanation = null,
    } = {}) {
        this.workspaceSnapshotId = String(workspaceSnapshotId);
        this.sourceRevision = Number(sourceRevision) || 1;
        this.findingIds = Object.freeze([...findingIds]);
        this.targetLocations = Object.freeze([...targetLocations]);
        this.patch = patch instanceof PatchSet ? patch : new PatchSet(patch || {});
        this.strategy = String(strategy);
        this.confidence = confidence;
        this.status = status;
        this.analysis = Object.freeze({ ...analysis });
        this.validation = validation ? Object.freeze({ ...validation }) : null;
        this.explanation = explanation ? Object.freeze({ ...explanation }) : null;

        const hash = RepairCandidate.computeHash(JSON.stringify({
            snap: this.workspaceSnapshotId,
            rev: this.sourceRevision,
            strat: this.strategy,
            patch: this.patch.patchSetId,
            findings: this.findingIds,
        }));
        this.candidateId = candidateId || `cand_repair_${hash}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    withValidation(validation, status = null) {
        return new RepairCandidate({
            candidateId: this.candidateId,
            workspaceSnapshotId: this.workspaceSnapshotId,
            sourceRevision: this.sourceRevision,
            findingIds: this.findingIds,
            targetLocations: this.targetLocations,
            patch: this.patch,
            strategy: this.strategy,
            confidence: this.confidence,
            status: status || this.status,
            analysis: this.analysis,
            validation,
            explanation: this.explanation,
        });
    }

    withStatus(status) {
        return new RepairCandidate({
            candidateId: this.candidateId,
            workspaceSnapshotId: this.workspaceSnapshotId,
            sourceRevision: this.sourceRevision,
            findingIds: this.findingIds,
            targetLocations: this.targetLocations,
            patch: this.patch,
            strategy: this.strategy,
            confidence: this.confidence,
            status,
            analysis: this.analysis,
            validation: this.validation,
            explanation: this.explanation,
        });
    }

    toJSON() {
        return {
            candidateId: this.candidateId,
            workspaceSnapshotId: this.workspaceSnapshotId,
            sourceRevision: this.sourceRevision,
            findingIds: this.findingIds,
            targetLocations: this.targetLocations,
            patch: this.patch.toJSON(),
            strategy: this.strategy,
            confidence: this.confidence,
            status: this.status,
            analysis: this.analysis,
            validation: this.validation?.toJSON ? this.validation.toJSON() : this.validation,
            explanation: this.explanation?.toJSON ? this.explanation.toJSON() : this.explanation,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RepairCandidate({
            ...json,
            patch: PatchSet.fromJSON(json.patch),
        });
    }
}
